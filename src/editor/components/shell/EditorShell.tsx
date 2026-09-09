import { useCallback, useEffect, useId, useRef, useState } from "react";
import { workspaceNeedsNewDiagramConfirmation } from "../../../app/bootstrap.ts";
import { useOptionalWorkspaceSession } from "../../../app/WorkspaceSessionProvider.tsx";
import { DEFAULT_VIEWPORT } from "../../../domain/diagram/defaults.ts";
import { createDiagramDocument } from "../../../domain/diagram/factories.ts";
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
import { ExportDialog } from "../ExportDialog.tsx";
import { Inspector } from "../Inspector/Inspector.tsx";
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
  const drawerOpen = paletteOpen || inspectorOpen;
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

      setPaletteOpen(false);
      setInspectorOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function togglePalette() {
    setPaletteOpen((open) => !open);
    setInspectorOpen(false);
  }

  function toggleInspector() {
    setInspectorOpen((open) => !open);
    setPaletteOpen(false);
  }

  function closeDrawers() {
    setPaletteOpen(false);
    setInspectorOpen(false);
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
    store.getState().setDialogMode("none");
  }

  return (
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
          onExport={toggleExport}
        />
      </header>
      <div className={styles.narrowNotice} role="alert">
        Esta ventana es más estrecha que 768 px. La edición no está soportada;
        el diagrama no se borra.
      </div>
      <nav
        id="editor-palette"
        className={`${styles.panel} ${styles.palette} ${paletteOpen ? styles.drawerOpen : ""}`}
        aria-labelledby={paletteHeadingId}
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
        className={`${styles.panel} ${styles.inspector} ${inspectorOpen ? styles.drawerOpen : ""}`}
        aria-labelledby={inspectorHeadingId}
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
    </div>
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
