import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { workspaceNeedsNewDiagramConfirmation } from "../../../app/bootstrap.ts";
import { useOptionalWorkspaceSession } from "../../../app/WorkspaceSessionProvider.tsx";
import { DEFAULT_VIEWPORT } from "../../../domain/diagram/defaults.ts";
import {
  documentFileFilename,
  INVALID_DOCUMENT_FILE_MESSAGE,
  parseDocumentFileText,
  serializeDocumentFile,
  type ArkUmlDocumentFile,
} from "../../../domain/diagram/documentFile.ts";
import { createDiagramDocument } from "../../../domain/diagram/factories.ts";
import { downloadBlob } from "../../../export/download.ts";
import { useCompactLayout } from "../../a11y/useCompactLayout.ts";
import { DiagramCanvas } from "../../canvas/DiagramCanvas.tsx";
import { useEditorShortcuts } from "../../shortcuts/useEditorShortcuts.ts";
import {
  EditorStoreProvider,
  useEditorStore,
  useEditorStoreApi,
  useOptionalEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import {
  selectDialogMode,
  selectDocumentTitle,
  selectLiveAnnouncement,
  selectMessage,
  selectViewport,
} from "../../store/selectors.ts";
import { TooltipProvider } from "../common/Tooltip.tsx";
import { ExportDialog } from "../ExportDialog.tsx";
import { Inspector } from "../Inspector/Inspector.tsx";
import { InvalidDocumentFileDialog } from "../InvalidDocumentFileDialog.tsx";
import { NewDiagramDialog } from "../NewDiagramDialog.tsx";
import { RecoveryDialog } from "../RecoveryDialog.tsx";
import { HelpDialog } from "./HelpDialog.tsx";
import { Palette } from "./Palette.tsx";
import { StatusBar } from "./StatusBar.tsx";
import { TopBar } from "./TopBar.tsx";
import styles from "./EditorShell.module.css";

export type EditorShellProps = {
  documentTitle?: string;
  zoomPercent?: number;
};

export function EditorShell(props: EditorShellProps) {
  const store = useOptionalEditorStoreApi();
  if (store === undefined) {
    return (
      <EditorStoreProvider>
        <EditorShellLayout {...props} />
      </EditorStoreProvider>
    );
  }
  return <EditorShellLayout {...props} />;
}

function EditorShellLayout({ documentTitle, zoomPercent }: EditorShellProps) {
  const store = useEditorStoreApi();
  const session = useOptionalWorkspaceSession();
  const storeTitle = useEditorStore(selectDocumentTitle);
  const viewport = useEditorStore(selectViewport);
  const dialogMode = useEditorStore(selectDialogMode);
  const recoveryMessage = useEditorStore(selectMessage);
  const helpOpen = dialogMode === "help";
  const exportOpen = dialogMode === "export";
  const newDiagramOpen = dialogMode === "new-diagram";
  const openFileOpen = dialogMode === "open-file";
  const invalidFileOpen = dialogMode === "invalid-document-file";
  const recoveryOpen = dialogMode === "recovery";
  const title = documentTitle ?? storeTitle;
  const zoom = zoomPercent ?? Math.round(viewport.zoom * 100);
  const paletteHeadingId = useId();
  const inspectorHeadingId = useId();
  const canvasHeadingId = useId();
  const helpTitleId = useId();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [canvasNonce, setCanvasNonce] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<ArkUmlDocumentFile | undefined>(undefined);
  const compact = useCompactLayout();
  const paletteRef = useRef<HTMLElement>(null);
  const inspectorPanelRef = useRef<HTMLElement>(null);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const inspectorButtonRef = useRef<HTMLButtonElement>(null);
  const drawerOpen = paletteOpen || inspectorOpen;
  const paletteHidden = compact && !paletteOpen;
  const inspectorHidden = compact && !inspectorOpen;
  const fitViewRef = useRef<() => void>(() => {
    /* registered by the canvas */
  });
  const registerFitView = useCallback((fitView: () => void) => {
    fitViewRef.current = fitView;
  }, []);
  const runFitView = useCallback(() => {
    fitViewRef.current();
  }, []);
  const flushAutosave = useCallback(() => {
    void session?.coordinator.flush({ announce: true });
  }, [session]);

  useEditorShortcuts({ fitView: runFitView, flushAutosave });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (!paletteOpen && !inspectorOpen) {
        return;
      }

      const returnTo = paletteOpen
        ? paletteButtonRef.current
        : inspectorButtonRef.current;
      setPaletteOpen(false);
      setInspectorOpen(false);
      if (compact) {
        returnTo?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [compact, inspectorOpen, paletteOpen]);

  useEffect(() => {
    if (!compact || !paletteOpen) {
      return;
    }
    const first = firstFocusable(paletteRef.current);
    first?.focus();
  }, [compact, paletteOpen]);

  useEffect(() => {
    if (!compact || !inspectorOpen) {
      return;
    }
    const first = firstFocusable(inspectorPanelRef.current);
    first?.focus();
  }, [compact, inspectorOpen]);

  function togglePalette() {
    if (paletteOpen) {
      setPaletteOpen(false);
      if (compact) {
        paletteButtonRef.current?.focus();
      }
      return;
    }
    setInspectorOpen(false);
    setPaletteOpen(true);
  }

  function toggleInspector() {
    if (inspectorOpen) {
      setInspectorOpen(false);
      if (compact) {
        inspectorButtonRef.current?.focus();
      }
      return;
    }
    setPaletteOpen(false);
    setInspectorOpen(true);
  }

  function closeDrawers() {
    const returnTo = paletteOpen
      ? paletteButtonRef.current
      : inspectorButtonRef.current;
    setPaletteOpen(false);
    setInspectorOpen(false);
    if (compact) {
      returnTo?.focus();
    }
  }

  function toggleHelp() {
    store.getState().setDialogMode(helpOpen ? "none" : "help");
  }

  function closeHelp() {
    store.getState().setDialogMode("none");
  }

  function toggleExport() {
    store.getState().setDialogMode(exportOpen ? "none" : "export");
  }

  function resetInMemory() {
    store
      .getState()
      .hydrateWorkspace(createDiagramDocument(), DEFAULT_VIEWPORT);
    store.getState().setTool("select");
    store.getState().setDialogMode("none");
    setCanvasNonce((value) => value + 1);
  }

  async function confirmNewWorkspace() {
    if (session === undefined) {
      resetInMemory();
      return;
    }
    await session.coordinator.startNewDiagram();
    setCanvasNonce((value) => value + 1);
  }

  function requestNewDiagram() {
    const needsConfirmation = workspaceNeedsNewDiagramConfirmation(
      store.getState(),
      session?.coordinator.isOverwriteBlocked() === true,
    );
    if (needsConfirmation) {
      store.getState().setDialogMode("new-diagram");
      return;
    }
    void confirmNewWorkspace();
  }

  function cancelDialog() {
    pendingFileRef.current = undefined;
    store.getState().setDialogMode("none");
  }

  function applyDocumentFile(file: ArkUmlDocumentFile) {
    pendingFileRef.current = undefined;
    store.getState().hydrateWorkspace(file.document, file.view);
    store.getState().setTool("select");
    store.getState().setDialogMode("none");
    setCanvasNonce((value) => value + 1);
  }

  function requestOpenFile() {
    fileInputRef.current?.click();
  }

  function saveDocumentFile() {
    const state = store.getState();
    const json = serializeDocumentFile(state.document, state.viewport);
    downloadBlob(
      new Blob([json], { type: "application/json" }),
      documentFileFilename(state.document.metadata.title),
    );
  }

  async function handleDocumentFileChosen(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (file === undefined) {
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      store.getState().setMessage(INVALID_DOCUMENT_FILE_MESSAGE);
      store.getState().setDialogMode("invalid-document-file");
      return;
    }

    const parsed = parseDocumentFileText(text);
    if (!parsed.ok) {
      store.getState().setMessage(INVALID_DOCUMENT_FILE_MESSAGE);
      store.getState().setDialogMode("invalid-document-file");
      return;
    }

    const needsConfirmation = workspaceNeedsNewDiagramConfirmation(
      store.getState(),
      session?.coordinator.isOverwriteBlocked() === true,
    );
    if (needsConfirmation) {
      pendingFileRef.current = parsed.value;
      store.getState().setDialogMode("open-file");
      return;
    }

    applyDocumentFile(parsed.value);
  }

  function confirmOpenFile() {
    const pending = pendingFileRef.current;
    if (pending === undefined) {
      store.getState().setDialogMode("none");
      return;
    }
    applyDocumentFile(pending);
  }

  return (
    <TooltipProvider>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <TopBar
            documentTitle={title}
            paletteOpen={paletteOpen}
            inspectorOpen={inspectorOpen}
            helpOpen={helpOpen}
            exportOpen={exportOpen}
            onTogglePalette={togglePalette}
            onToggleInspector={toggleInspector}
            onToggleHelp={toggleHelp}
            onNewDiagram={requestNewDiagram}
            onOpenFile={requestOpenFile}
            onSaveJson={saveDocumentFile}
            onExport={toggleExport}
            paletteButtonRef={paletteButtonRef}
            inspectorButtonRef={inspectorButtonRef}
          />
        </header>
        <div className={styles.narrowNotice} role="alert">
          Esta ventana es más estrecha que 768 px. La edición no está soportada;
          el diagrama no se borra.
        </div>
        <nav
          id="editor-palette"
          ref={paletteRef}
          className={`${styles.panel} ${styles.palette} ${paletteOpen ? styles.drawerOpen : ""}`}
          aria-labelledby={paletteHeadingId}
          aria-hidden={paletteHidden || undefined}
          inert={paletteHidden || undefined}
        >
          <Palette headingId={paletteHeadingId} />
        </nav>
        <main className={styles.canvas} aria-labelledby={canvasHeadingId}>
          <h2 id={canvasHeadingId} className={styles.canvasHeading}>
            Lienzo
          </h2>
          <DiagramCanvas key={canvasNonce} onFitViewReady={registerFitView} />
        </main>
        <aside
          id="editor-inspector"
          ref={inspectorPanelRef}
          className={`${styles.panel} ${styles.inspector} ${inspectorOpen ? styles.drawerOpen : ""}`}
          aria-labelledby={inspectorHeadingId}
          aria-hidden={inspectorHidden || undefined}
          inert={inspectorHidden || undefined}
        >
          <Inspector headingId={inspectorHeadingId} />
        </aside>
        <div
          className={styles.statusbar}
          role="status"
          aria-live="off"
          aria-label="Estado del editor"
        >
          <StatusBar zoomPercent={zoom} />
        </div>
        <EditorLiveRegion />
        {helpOpen ? (
          <div id="editor-help">
            <HelpDialog titleId={helpTitleId} onClose={closeHelp} />
          </div>
        ) : null}
        {exportOpen ? (
          <div id="editor-export">
            <ExportDialog onCancel={cancelDialog} />
          </div>
        ) : null}
        {newDiagramOpen ? (
          <NewDiagramDialog
            onCancel={cancelDialog}
            onConfirm={() => {
              void confirmNewWorkspace();
            }}
          />
        ) : null}
        {openFileOpen ? (
          <NewDiagramDialog
            title="Abrir archivo"
            confirmLabel="Abrir archivo"
            testId="open-file-dialog"
            onCancel={cancelDialog}
            onConfirm={confirmOpenFile}
          />
        ) : null}
        {invalidFileOpen ? (
          <InvalidDocumentFileDialog onClose={cancelDialog} />
        ) : null}
        {recoveryOpen ? (
          <RecoveryDialog
            message={recoveryMessage ?? "El documento guardado no es válido."}
            onCancel={cancelDialog}
            onConfirm={() => {
              void confirmNewWorkspace();
            }}
          />
        ) : null}
        {drawerOpen ? (
          <button
            type="button"
            className={styles.backdrop}
            onClick={closeDrawers}
          >
            Cerrar paneles
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className={styles.fileInput}
          tabIndex={-1}
          aria-hidden="true"
          data-testid="document-file-input"
          onChange={(event) => {
            void handleDocumentFileChosen(event);
          }}
        />
      </div>
    </TooltipProvider>
  );
}

function firstFocusable(
  container: HTMLElement | null,
): HTMLElement | undefined {
  if (container === null) {
    return undefined;
  }
  return (
    container.querySelector<HTMLElement>(
      'button:not([disabled]):not([aria-disabled="true"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? undefined
  );
}

function EditorLiveRegion() {
  const announcement = useEditorStore(selectLiveAnnouncement);
  return (
    <div
      className={styles.live}
      data-testid="editor-live"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
}
