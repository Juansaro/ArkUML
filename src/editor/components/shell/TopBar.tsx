import { InertButton } from "./InertButton.tsx";
import styles from "./TopBar.module.css";

type TopBarProps = {
  documentTitle: string;
  paletteOpen: boolean;
  inspectorOpen: boolean;
  onTogglePalette: () => void;
  onToggleInspector: () => void;
};

export function TopBar({
  documentTitle,
  paletteOpen,
  inspectorOpen,
  onTogglePalette,
  onToggleInspector,
}: TopBarProps) {
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
        <InertButton reason="Deshacer aún no está disponible.">
          Deshacer
        </InertButton>
        <InertButton reason="Rehacer aún no está disponible.">
          Rehacer
        </InertButton>
        <InertButton reason="Exportar aún no está disponible.">
          Exportar
        </InertButton>
      </div>
    </>
  );
}
