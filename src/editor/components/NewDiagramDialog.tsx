import { useId, useRef, useState } from "react";
import type { DocumentKind } from "../../domain/diagram/model.ts";
import { useFocusTrap } from "./useFocusTrap.ts";
import styles from "./NewDiagramDialog.module.css";

export type NewDiagramKindOption = {
  value: DocumentKind;
  label: string;
};

type NewDiagramDialogProps = {
  title?: string;
  confirmLabel?: string;
  description?: string;
  testId?: string;
  kindOptions?: readonly NewDiagramKindOption[];
  defaultKind?: DocumentKind;
  onCancel: () => void;
  onConfirm: (kind?: DocumentKind) => void;
};

const DEFAULT_TITLE = "Nuevo diagrama";
const DEFAULT_CONFIRM = "Crear diagrama nuevo";
const DEFAULT_DESCRIPTION =
  "Se perderá el diagrama actual. Esta acción no se puede deshacer.";
const DEFAULT_TEST_ID = "new-diagram-dialog";

export function NewDiagramDialog({
  title = DEFAULT_TITLE,
  confirmLabel = DEFAULT_CONFIRM,
  description,
  testId = DEFAULT_TEST_ID,
  kindOptions,
  defaultKind,
  onCancel,
  onConfirm,
}: NewDiagramDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const kindsId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasKinds = kindOptions !== undefined && kindOptions.length > 0;
  const [kind, setKind] = useState<DocumentKind>(
    defaultKind ?? kindOptions?.[0]?.value ?? "use-case",
  );
  useFocusTrap(dialogRef, onCancel);
  const body =
    description ?? (hasKinds ? undefined : DEFAULT_DESCRIPTION);

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onCancel} />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body !== undefined ? descriptionId : undefined}
        data-testid={testId}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {body !== undefined ? (
          <p id={descriptionId} className={styles.body}>
            {body}
          </p>
        ) : null}
        {hasKinds ? (
          <fieldset className={styles.kinds} aria-labelledby={kindsId}>
            <legend id={kindsId} className={styles.legend}>
              Tipo
            </legend>
            {kindOptions.map((option) => (
              <label key={option.value} className={styles.kindOption}>
                <input
                  type="radio"
                  name="new-diagram-kind"
                  value={option.value}
                  checked={kind === option.value}
                  onChange={() => {
                    setKind(option.value);
                  }}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        ) : null}
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={() => {
              onConfirm(hasKinds ? kind : undefined);
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
