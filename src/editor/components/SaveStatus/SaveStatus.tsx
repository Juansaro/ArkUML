import { useOptionalWorkspaceSession } from "../../../app/WorkspaceSessionProvider.tsx";
import type { SaveStatus as SaveStatusValue } from "../../store/editorStore.ts";
import {
  selectDialogMode,
  selectMessage,
  selectSaveStatus,
} from "../../store/selectors.ts";
import { useEditorStore } from "../../store/EditorStoreProvider.tsx";
import styles from "./SaveStatus.module.css";

const STATUS_LABEL: Record<SaveStatusValue, string> = {
  idle: "—",
  saving: "Guardando",
  saved: "Guardado",
  error: "Error",
};

export function SaveStatus() {
  const session = useOptionalWorkspaceSession();
  const saveStatus = useEditorStore(selectSaveStatus);
  const message = useEditorStore(selectMessage);
  const dialogMode = useEditorStore(selectDialogMode);
  const overwriteBlocked = session?.coordinator.isOverwriteBlocked() === true;
  const showRetry =
    session !== undefined &&
    saveStatus === "error" &&
    dialogMode !== "recovery" &&
    !overwriteBlocked;
  const errorMessage = saveStatus === "error" ? message : undefined;
  const label = STATUS_LABEL[saveStatus];

  return (
    <div
      className={`${styles.status} ${saveStatus === "error" ? styles.error : ""}`}
      data-testid="save-status"
      data-state={saveStatus}
      title={errorMessage}
    >
      <p className={styles.label}>{label}</p>
      {errorMessage !== undefined ? (
        <p className={styles.message}>{errorMessage}</p>
      ) : null}
      {showRetry ? (
        <button
          type="button"
          className={styles.retry}
          onClick={() => {
            void session?.coordinator.flush();
          }}
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
