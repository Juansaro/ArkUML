import { useEffect, useId, useState, type FormEvent } from "react";
import { selectDocument } from "../../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import {
  commitRelationship,
  connectionRejectionMessage,
  connectableEndpointOptions,
  relationshipEndpointFieldLabels,
  type RelationshipTool,
} from "../../tools/relationshipTool.ts";
import styles from "./Inspector.module.css";

type ConnectFormProps = {
  kind: RelationshipTool;
};

export function ConnectForm({ kind }: ConnectFormProps) {
  const store = useEditorStoreApi();
  const document = useEditorStore(selectDocument);
  const sourceFieldId = useId();
  const targetFieldId = useId();
  const errorId = useId();
  const labels = relationshipEndpointFieldLabels(kind);
  const options = connectableEndpointOptions(document, kind);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const selectedTarget = options.some((option) => option.id === target)
    ? target
    : "";
  const rejection = connectionRejectionMessage(
    document,
    kind,
    source,
    selectedTarget,
  );
  const canSubmit =
    source.length > 0 && selectedTarget.length > 0 && rejection === undefined;

  useEffect(() => {
    if (rejection !== undefined) {
      store.getState().setMessage(rejection);
    }
  }, [rejection, store]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    commitRelationship(store, {
      kind,
      sourceId: source,
      targetId: selectedTarget,
      sourceAnchor: "right",
      targetAnchor: "left",
    });
  }

  return (
    <form
      className={styles.connect}
      onSubmit={onSubmit}
      aria-describedby={rejection !== undefined ? errorId : undefined}
    >
      <label className={styles.field} htmlFor={sourceFieldId}>
        <span className={styles.label}>{labels.source}</span>
        <select
          id={sourceFieldId}
          className={styles.select}
          value={source}
          data-testid="connect-source"
          aria-invalid={rejection !== undefined}
          aria-describedby={rejection !== undefined ? errorId : undefined}
          onChange={(event) => {
            setSource(event.target.value);
          }}
        >
          <option value="">Elegir origen</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field} htmlFor={targetFieldId}>
        <span className={styles.label}>{labels.target}</span>
        <select
          id={targetFieldId}
          className={styles.select}
          value={selectedTarget}
          data-testid="connect-target"
          aria-invalid={rejection !== undefined && selectedTarget.length > 0}
          aria-describedby={rejection !== undefined ? errorId : undefined}
          onChange={(event) => {
            setTarget(event.target.value);
          }}
        >
          <option value="">Elegir destino</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {rejection !== undefined ? (
        <p className={styles.error} id={errorId} data-testid="connect-error">
          {rejection}
        </p>
      ) : null}
      <button
        type="submit"
        className={styles.connectSubmit}
        disabled={!canSubmit}
        data-testid="connect-relationship"
      >
        Conectar
      </button>
    </form>
  );
}
