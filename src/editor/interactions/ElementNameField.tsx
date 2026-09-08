import { useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";
import styles from "./ElementNameField.module.css";

type ElementNameFieldProps = {
  elementId: string;
  name: string;
  ariaLabel: string;
  className?: string;
  autoFocus?: boolean;
  showError?: boolean;
  onCommitted?: () => void;
  onCancel?: () => void;
  onInvalidBlur?: () => void;
};

export function ElementNameField({
  elementId,
  name,
  ariaLabel,
  className,
  autoFocus = false,
  showError = false,
  onCommitted,
  onCancel,
  onInvalidBlur,
}: ElementNameFieldProps) {
  const store = useEditorStoreApi();
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | undefined>(undefined);
  const [source, setSource] = useState({ elementId, name });
  const ignoreBlurRef = useRef(false);

  if (source.elementId !== elementId || source.name !== name) {
    setSource({ elementId, name });
    setDraft(name);
    setError(undefined);
  }

  function commit(): boolean {
    const result = store.getState().renameElement(elementId, draft);
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    setError(undefined);
    return true;
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      ignoreBlurRef.current = true;
      if (commit()) {
        onCommitted?.();
        return;
      }
      ignoreBlurRef.current = false;
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      ignoreBlurRef.current = true;
      setDraft(name);
      setError(undefined);
      onCancel?.();
    }
  }

  function onBlur() {
    if (ignoreBlurRef.current) {
      ignoreBlurRef.current = false;
      return;
    }
    if (commit()) {
      onCommitted?.();
      return;
    }
    setDraft(name);
    onInvalidBlur?.();
  }

  const classNames =
    className === undefined ? styles.input : `${styles.input} ${className}`;

  const input = (
    <input
      className={classNames}
      value={draft}
      autoFocus={autoFocus}
      spellCheck={false}
      aria-label={ariaLabel}
      aria-invalid={error !== undefined}
      data-testid="element-name-input"
      onChange={(event) => {
        setDraft(event.target.value);
        if (error !== undefined) {
          setError(undefined);
        }
      }}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      {...focusProps(autoFocus)}
    />
  );

  if (!showError) {
    return input;
  }

  return (
    <div className={styles.field}>
      {input}
      {error !== undefined ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

function focusProps(autoFocus: boolean): {
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
} {
  if (!autoFocus) {
    return {};
  }
  return {
    onFocus: (event: FocusEvent<HTMLInputElement>) => {
      event.currentTarget.select();
    },
  };
}
