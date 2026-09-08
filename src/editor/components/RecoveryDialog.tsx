import { useId, useRef } from "react";
import { useFocusTrap } from "./useFocusTrap.ts";
import styles from "./NewDiagramDialog.module.css";

type RecoveryDialogProps = {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RecoveryDialog({
  message,
  onCancel,
  onConfirm,
}: RecoveryDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onCancel);

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onCancel} />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-testid="recovery-dialog"
      >
        <h2 id={titleId} className={styles.title}>
          No se pudo recuperar el diagrama
        </h2>
        <p id={descriptionId} className={styles.body}>
          {message} Puedes comenzar un diagrama nuevo. El archivo dañado no se
          sobrescribirá hasta que confirmes.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Continuar en memoria
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            Comenzar limpio
          </button>
        </div>
      </div>
    </div>
  );
}
