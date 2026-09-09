import { useShallow } from "zustand/react/shallow";
import { ElementNameField } from "../../interactions/ElementNameField.tsx";
import {
  selectDiagramWarnings,
  selectInspectorView,
  selectTool,
} from "../../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import {
  isCreateElementTool,
  placeActiveCreateTool,
} from "../../tools/createElementTool.ts";
import {
  isRelationshipTool,
  relationshipConnectionHelp,
  relationshipEndpointFieldLabels,
} from "../../tools/relationshipTool.ts";
import { ConnectForm } from "./ConnectForm.tsx";
import styles from "./Inspector.module.css";

type InspectorProps = {
  headingId: string;
};

export function Inspector({ headingId }: InspectorProps) {
  const view = useEditorStore(useShallow(selectInspectorView));
  const tool = useEditorStore(selectTool);
  const warnings = useEditorStore(selectDiagramWarnings);
  const connectionHelp = relationshipConnectionHelp(tool);
  const createTool = isCreateElementTool(tool) ? tool : undefined;
  const relationshipTool = isRelationshipTool(tool) ? tool : undefined;

  return (
    <div className={styles.body} data-testid="inspector">
      <h2 id={headingId} className={styles.heading} tabIndex={-1}>
        Inspector
      </h2>
      {createTool !== undefined ? <PlaceElementControl /> : null}
      {relationshipTool !== undefined && view.status !== "relationship" ? (
        <>
          {connectionHelp !== undefined ? (
            <ConnectionHelp text={connectionHelp} />
          ) : null}
          <ConnectForm key={relationshipTool} kind={relationshipTool} />
        </>
      ) : null}
      {view.status === "empty" &&
      createTool === undefined &&
      relationshipTool === undefined ? (
        <p className={styles.empty}>
          Selecciona un elemento o una relación para ver su nombre, tipo y
          extremos.
        </p>
      ) : (
        <InspectorBody view={view} connectionHelp={connectionHelp} />
      )}
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
    return null;
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

function PlaceElementControl() {
  const store = useEditorStoreApi();

  return (
    <button
      type="button"
      data-testid="place-element"
      onClick={() => {
        placeActiveCreateTool(store);
        window.setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>(
            '[data-testid="inspector"] [data-testid="element-name-input"]',
          );
          input?.focus();
        }, 0);
      }}
    >
      Colocar en el lienzo
    </button>
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
