import { useId, useRef } from "react";
import { useFocusTrap } from "./useFocusTrap.ts";
import styles from "./NewDiagramDialog.module.css";

type NewDiagramDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function NewDiagramDialog({
  onCancel,
  onConfirm,
}: NewDiagramDialogProps) {
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
        data-testid="new-diagram-dialog"
      >
        <h2 id={titleId} className={styles.title}>
          Nuevo diagrama
        </h2>
        <p id={descriptionId} className={styles.body}>
          Se perderá el diagrama actual. Esta acción no se puede deshacer.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            Crear diagrama nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
