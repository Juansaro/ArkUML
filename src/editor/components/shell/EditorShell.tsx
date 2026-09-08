import { useEffect, useId, useState } from "react";
import { DiagramCanvas } from "../../canvas/DiagramCanvas.tsx";
import {
  EditorStoreProvider,
  useEditorStore,
  useOptionalEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import {
  selectDocumentTitle,
  selectMessage,
  selectViewport,
} from "../../store/selectors.ts";
import { Inspector } from "../Inspector/Inspector.tsx";
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
  const storeTitle = useEditorStore(selectDocumentTitle);
  const viewport = useEditorStore(selectViewport);
  const title = documentTitle ?? storeTitle;
  const zoom = zoomPercent ?? Math.round(viewport.zoom * 100);
  const paletteHeadingId = useId();
  const inspectorHeadingId = useId();
  const canvasHeadingId = useId();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const drawerOpen = paletteOpen || inspectorOpen;

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

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <TopBar
          documentTitle={title}
          paletteOpen={paletteOpen}
          inspectorOpen={inspectorOpen}
          onTogglePalette={togglePalette}
          onToggleInspector={toggleInspector}
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
        <DiagramCanvas />
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
  const message = useEditorStore(selectMessage);
  return (
    <div
      className={styles.live}
      data-testid="editor-live"
      aria-live="polite"
      aria-atomic="true"
    >
      {message ?? ""}
    </div>
  );
}
