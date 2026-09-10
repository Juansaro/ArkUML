import { useId, useRef } from "react";
import { INVALID_DOCUMENT_FILE_MESSAGE } from "../../domain/diagram/documentFile.ts";
import { useFocusTrap } from "./useFocusTrap.ts";
import styles from "./NewDiagramDialog.module.css";

type InvalidDocumentFileDialogProps = {
  onClose: () => void;
};

export function InvalidDocumentFileDialog({
  onClose,
}: InvalidDocumentFileDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="invalid-document-file-dialog"
      >
        <h2 id={titleId} className={styles.title}>
          {INVALID_DOCUMENT_FILE_MESSAGE}
        </h2>
        <div className={styles.actions}>
          <button type="button" className={styles.confirm} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
