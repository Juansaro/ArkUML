import { useShallow } from "zustand/react/shallow";
import { ElementNameField } from "../../interactions/ElementNameField.tsx";
import {
  selectDiagramWarnings,
  selectInspectorView,
  selectTool,
} from "../../store/selectors.ts";
import { useEditorStore } from "../../store/EditorStoreProvider.tsx";
import {
  relationshipConnectionHelp,
  relationshipEndpointFieldLabels,
} from "../../tools/relationshipTool.ts";
import styles from "./Inspector.module.css";

type InspectorProps = {
  headingId: string;
};

export function Inspector({ headingId }: InspectorProps) {
  const view = useEditorStore(useShallow(selectInspectorView));
  const tool = useEditorStore(selectTool);
  const warnings = useEditorStore(selectDiagramWarnings);
  const connectionHelp = relationshipConnectionHelp(tool);

  return (
    <div className={styles.body} data-testid="inspector">
      <h2 id={headingId} className={styles.heading}>
        Inspector
      </h2>
      <InspectorBody view={view} connectionHelp={connectionHelp} />
      {warnings.length > 0 ? (
        <ul
          className={styles.warnings}
          data-testid="inspector-warnings"
          aria-label="Avisos del diagrama"
        >
          {warnings.map((warning) => (
            <li
              key={`${warning.code}:${warning.elementId}`}
              className={styles.warning}
              data-testid="inspector-warning"
              data-warning-code={warning.code}
            >
              {warning.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function InspectorBody({
  view,
  connectionHelp,
}: {
  view: ReturnType<typeof selectInspectorView>;
  connectionHelp: string | undefined;
}) {
  if (view.status === "empty") {
    if (connectionHelp !== undefined) {
      return <ConnectionHelp text={connectionHelp} />;
    }
    return (
      <p className={styles.empty}>
        Selecciona un elemento o una relación para ver su nombre, tipo y
        extremos.
      </p>
    );
  }

  if (view.status === "multiple") {
    return (
      <p className={styles.multiple} data-testid="inspector-multiple">
        {view.count} seleccionados
      </p>
    );
  }

  if (view.status === "relationship") {
    const endpoints = relationshipEndpointFieldLabels(view.kind);
    return (
      <div className={styles.fields}>
        {connectionHelp !== undefined ? (
          <ConnectionHelp text={connectionHelp} />
        ) : null}
        <TypeField label={view.typeLabel} />
        <EndpointField
          label={endpoints.source}
          value={view.sourceLabel}
          testId="inspector-source"
        />
        <EndpointField
          label={endpoints.target}
          value={view.targetLabel}
          testId="inspector-target"
        />
      </div>
    );
  }

  return (
    <div className={styles.fields}>
      {connectionHelp !== undefined ? (
        <ConnectionHelp text={connectionHelp} />
      ) : null}
      <TypeField label={view.typeLabel} />
      <label className={styles.field}>
        <span className={styles.label}>Nombre</span>
        <ElementNameField
          key={view.id}
          elementId={view.id}
          name={view.name}
          ariaLabel="Nombre"
          showError
        />
      </label>
    </div>
  );
}

function EndpointField({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className={styles.field}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value} data-testid={testId}>
        {value}
      </p>
    </div>
  );
}

function TypeField({ label }: { label: string }) {
  return (
    <div className={styles.field}>
      <p className={styles.label}>Tipo</p>
      <p className={styles.value} data-testid="inspector-type">
        {label}
      </p>
    </div>
  );
}

function ConnectionHelp({ text }: { text: string }) {
  return (
    <p className={styles.help} data-testid="connection-help">
      {text}
    </p>
  );
}
