import styles from "./StatusBar.module.css";

type StatusBarProps = {
  zoomPercent: number;
};

export function StatusBar({ zoomPercent }: StatusBarProps) {
  return (
    <>
      <p className={styles.item}>Zoom {zoomPercent}%</p>
      <p
        className={styles.item}
        title="El estado de guardado se mostrará cuando el autosave esté conectado a la interfaz."
      >
        Guardado: —
      </p>
    </>
  );
}
