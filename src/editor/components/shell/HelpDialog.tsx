import { EDITOR_SHORTCUT_HELP } from "../../shortcuts/shortcutMap.ts";
import styles from "./HelpDialog.module.css";

type HelpDialogProps = {
  titleId: string;
  onClose: () => void;
};

export function HelpDialog({ titleId, onClose }: HelpDialogProps) {
  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Cerrar ayuda"
        onClick={onClose}
      />
      <div
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
