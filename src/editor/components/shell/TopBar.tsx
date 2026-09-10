import type { Ref } from "react";
import { useShallow } from "zustand/react/shallow";
import { Icon } from "../common/Icon.tsx";
import { ToolButton } from "../common/ToolButton.tsx";
import { selectCanRedo, selectCanUndo } from "../../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import styles from "./TopBar.module.css";

type TopBarProps = {
  documentTitle: string;
  paletteOpen: boolean;
  inspectorOpen: boolean;
  helpOpen: boolean;
  exportOpen: boolean;
  onTogglePalette: () => void;
  onToggleInspector: () => void;
  onToggleHelp: () => void;
  onNewDiagram: () => void;
  onOpenFile: () => void;
  onSaveJson: () => void;
  onExport: () => void;
  paletteButtonRef?: Ref<HTMLButtonElement>;
  inspectorButtonRef?: Ref<HTMLButtonElement>;
};

export function TopBar({
  documentTitle,
  paletteOpen,
  inspectorOpen,
  helpOpen,
  exportOpen,
  onTogglePalette,
  onToggleInspector,
  onToggleHelp,
  onNewDiagram,
  onOpenFile,
  onSaveJson,
  onExport,
  paletteButtonRef,
  inspectorButtonRef,
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
        <div className={styles.brand}>
          <span className={styles.mark}>
            <Icon name="mark" size={24} />
          </span>
          <h1 className={styles.product}>ArkUML</h1>
        </div>
        <p className={styles.documentTitle}>{documentTitle}</p>
      </div>
      <p className={styles.help}>Editor de diagramas de casos de uso</p>
      <div className={styles.drawerToggles}>
        <ToolButton
          ref={paletteButtonRef}
          icon="palette"
          label="Paleta"
          description={paletteOpen ? "Cerrar paleta." : "Abrir paleta."}
          placement="bottom"
          aria-expanded={paletteOpen}
          aria-controls="editor-palette"
          onClick={onTogglePalette}
        />
        <ToolButton
          ref={inspectorButtonRef}
          icon="inspector"
          label="Inspector"
          description={inspectorOpen ? "Cerrar inspector." : "Abrir inspector."}
          placement="bottom"
          aria-expanded={inspectorOpen}
          aria-controls="editor-inspector"
          onClick={onToggleInspector}
        />
      </div>
      <div className={styles.actions}>
        <ToolButton
          icon="newDiagram"
          label="Nuevo"
          description="Crear un diagrama nuevo."
          placement="bottom"
          onClick={onNewDiagram}
        />
        <ToolButton
          icon="openFile"
          label="Abrir"
          description="Abrir un archivo ArkUML."
          placement="bottom"
          onClick={onOpenFile}
        />
        <ToolButton
          icon="saveJson"
          label="Guardar JSON"
          description="Descargar el diagrama como JSON."
          placement="bottom"
          onClick={onSaveJson}
        />
        <ToolButton
          icon="undo"
          label="Deshacer"
          description={
            canUndo
              ? "Deshacer (Ctrl/Cmd+Z)."
              : "Nada que deshacer (Ctrl/Cmd+Z)."
          }
          placement="bottom"
          unavailable={!canUndo}
          onClick={() => {
            store.getState().undo();
          }}
        />
        <ToolButton
          icon="redo"
          label="Rehacer"
          description={
            canRedo
              ? "Rehacer (Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y)."
              : "Nada que rehacer (Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y)."
          }
          placement="bottom"
          unavailable={!canRedo}
          onClick={() => {
            store.getState().redo();
          }}
        />
        <ToolButton
          icon="export"
          label="Exportar"
          description="Exportar como PNG o JPG."
          placement="bottom"
          aria-haspopup="dialog"
          aria-expanded={exportOpen}
          aria-controls={exportOpen ? "editor-export" : undefined}
          onClick={onExport}
        />
        <ToolButton
          icon="help"
          label="Ayuda"
          description="Ver ayuda y atajos."
          placement="bottom"
          aria-haspopup="dialog"
          aria-expanded={helpOpen}
          aria-controls={helpOpen ? "editor-help" : undefined}
          onClick={onToggleHelp}
        />
      </div>
    </>
  );
}
