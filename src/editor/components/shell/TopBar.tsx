import { useShallow } from "zustand/react/shallow";
import { selectCanRedo, selectCanUndo } from "../../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import { InertButton } from "./InertButton.tsx";
import styles from "./TopBar.module.css";

type TopBarProps = {
  documentTitle: string;
  paletteOpen: boolean;
  inspectorOpen: boolean;
  helpOpen: boolean;
  onTogglePalette: () => void;
  onToggleInspector: () => void;
  onToggleHelp: () => void;
};

export function TopBar({
  documentTitle,
  paletteOpen,
  inspectorOpen,
  helpOpen,
  onTogglePalette,
  onToggleInspector,
  onToggleHelp,
}: TopBarProps) {
  const store = useEditorStoreApi();
  const { canUndo, canRedo } = useEditorStore(
    useShallow((state) => ({
      canUndo: selectCanUndo(state),
      canRedo: selectCanRedo(state),
    })),
  );

  return (
    <>
      <div className={styles.identity}>
        <h1 className={styles.product}>ArkUML</h1>
        <p className={styles.documentTitle}>{documentTitle}</p>
      </div>
      <p className={styles.help}>Editor de diagramas de casos de uso</p>
      <div className={styles.drawerToggles}>
        <button
          type="button"
          aria-expanded={paletteOpen}
          aria-controls="editor-palette"
          onClick={onTogglePalette}
        >
          Paleta
        </button>
        <button
          type="button"
          aria-expanded={inspectorOpen}
          aria-controls="editor-inspector"
          onClick={onToggleInspector}
        >
          Inspector
        </button>
      </div>
      <div className={styles.actions}>
        <InertButton reason="Nuevo diagrama aún no está disponible.">
          Nuevo
        </InertButton>
        <button
          type="button"
          disabled={!canUndo}
          title="Deshacer (Ctrl+Z)"
          onClick={() => {
            store.getState().undo();
          }}
        >
          Deshacer
        </button>
        <button
          type="button"
          disabled={!canRedo}
          title="Rehacer (Ctrl+Y)"
          onClick={() => {
            store.getState().redo();
          }}
        >
          Rehacer
        </button>
        <InertButton reason="Exportar aún no está disponible.">
          Exportar
        </InertButton>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={helpOpen}
          aria-controls={helpOpen ? "editor-help" : undefined}
          onClick={onToggleHelp}
        >
          Ayuda
        </button>
      </div>
    </>
  );
}
