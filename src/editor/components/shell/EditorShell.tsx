import { useCallback, useEffect, useId, useRef, useState } from "react";
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
  selectViewport,
} from "../../store/selectors.ts";
import { Inspector } from "../Inspector/Inspector.tsx";
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
  const storeTitle = useEditorStore(selectDocumentTitle);
  const viewport = useEditorStore(selectViewport);
  const helpOpen = useEditorStore(selectDialogMode) === "help";
  const title = documentTitle ?? storeTitle;
  const zoom = zoomPercent ?? Math.round(viewport.zoom * 100);
  const paletteHeadingId = useId();
  const inspectorHeadingId = useId();
  const canvasHeadingId = useId();
  const helpTitleId = useId();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
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

  useEditorShortcuts({ fitView: runFitView });

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

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <TopBar
          documentTitle={title}
          paletteOpen={paletteOpen}
          inspectorOpen={inspectorOpen}
          helpOpen={helpOpen}
          onTogglePalette={togglePalette}
          onToggleInspector={toggleInspector}
          onToggleHelp={toggleHelp}
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
        <DiagramCanvas onFitViewReady={registerFitView} />
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
