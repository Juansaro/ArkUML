import { useId, useRef } from "react";
import { useFocusTrap } from "./useFocusTrap.ts";
import styles from "./NewDiagramDialog.module.css";

type NewDiagramDialogProps = {
  title?: string;
  confirmLabel?: string;
  testId?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const DEFAULT_TITLE = "Nuevo diagrama";
const DEFAULT_CONFIRM = "Crear diagrama nuevo";
const DEFAULT_TEST_ID = "new-diagram-dialog";

export function NewDiagramDialog({
  title = DEFAULT_TITLE,
  confirmLabel = DEFAULT_CONFIRM,
  testId = DEFAULT_TEST_ID,
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
        data-testid={testId}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.body}>
          Se perderá el diagrama actual. Esta acción no se puede deshacer.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
