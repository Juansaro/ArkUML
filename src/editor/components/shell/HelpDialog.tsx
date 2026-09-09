import { useRef } from "react";
import { EDITOR_SHORTCUT_HELP } from "../../shortcuts/shortcutMap.ts";
import { useFocusTrap } from "../useFocusTrap.ts";
import styles from "./HelpDialog.module.css";

type HelpDialogProps = {
  titleId: string;
  onClose: () => void;
};

export function HelpDialog({ titleId, onClose }: HelpDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="help-dialog"
      >
        <h2 id={titleId} className={styles.title}>
          Ayuda
        </h2>
        <p className={styles.lead}>Editor de diagramas de casos de uso</p>
        <table className={styles.table}>
          <caption className={styles.caption}>Atajos de teclado</caption>
          <thead>
            <tr>
              <th scope="col">Atajo</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {EDITOR_SHORTCUT_HELP.map((item) => (
              <tr key={item.id}>
                <th scope="row">{item.keysLabel}</th>
                <td>{item.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className={styles.close} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
