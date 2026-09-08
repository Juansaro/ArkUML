import { SaveStatus } from "../SaveStatus/SaveStatus.tsx";
import styles from "./StatusBar.module.css";

type StatusBarProps = {
  zoomPercent: number;
};

export function StatusBar({ zoomPercent }: StatusBarProps) {
  return (
    <>
      <p className={styles.item}>Zoom {zoomPercent}%</p>
      <SaveStatus />
    </>
  );
}
