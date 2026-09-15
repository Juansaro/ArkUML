import { useId, useRef } from "react";
import { STORAGE_UPGRADE_MESSAGE } from "../../persistence/autosaveCoordinator.ts";
import { useFocusTrap } from "./useFocusTrap.ts";
import styles from "./NewDiagramDialog.module.css";

type StorageUpgradeDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function StorageUpgradeDialog({
  onCancel,
  onConfirm,
}: StorageUpgradeDialogProps) {
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
        data-testid="storage-upgrade-dialog"
      >
        <h2 id={titleId} className={styles.title}>
          Actualizar el workspace
        </h2>
        <p id={descriptionId} className={styles.body}>
          {STORAGE_UPGRADE_MESSAGE}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            Guardar como 2.0
          </button>
        </div>
      </div>
    </div>
  );
}
