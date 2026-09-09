import { useId, useState, type FormEvent } from "react";
import { selectDocument } from "../../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import {
  commitRelationship,
  connectableEndpointOptions,
  relationshipEndpointFieldLabels,
  validRelationshipTargets,
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
  const labels = relationshipEndpointFieldLabels(kind);
  const options = connectableEndpointOptions(document, kind);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const targets =
    source.length === 0
      ? options
      : validRelationshipTargets(document, kind, source, options);
  const selectedTarget = targets.some((option) => option.id === target)
    ? target
    : "";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (source.length === 0 || selectedTarget.length === 0) {
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

  const canSubmit = source.length > 0 && selectedTarget.length > 0;

  return (
    <form className={styles.connect} onSubmit={onSubmit}>
      <label className={styles.field} htmlFor={sourceFieldId}>
        <span className={styles.label}>{labels.source}</span>
        <select
          id={sourceFieldId}
          className={styles.select}
          value={source}
          data-testid="connect-source"
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
          onChange={(event) => {
            setTarget(event.target.value);
          }}
        >
          <option value="">Elegir destino</option>
          {targets.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
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
