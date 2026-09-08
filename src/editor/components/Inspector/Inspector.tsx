import { useShallow } from "zustand/react/shallow";
import { ElementNameField } from "../../interactions/ElementNameField.tsx";
import {
  selectDiagramWarnings,
  selectInspectorView,
} from "../../store/selectors.ts";
import { useEditorStore } from "../../store/EditorStoreProvider.tsx";
import styles from "./Inspector.module.css";

type InspectorProps = {
  headingId: string;
};

export function Inspector({ headingId }: InspectorProps) {
  const view = useEditorStore(useShallow(selectInspectorView));
  const warnings = useEditorStore(selectDiagramWarnings);

  return (
    <div className={styles.body} data-testid="inspector">
      <h2 id={headingId} className={styles.heading}>
        Inspector
      </h2>
      <InspectorBody view={view} />
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
}: {
  view: ReturnType<typeof selectInspectorView>;
}) {
  if (view.status === "empty") {
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
    return (
      <div className={styles.fields}>
        <TypeField label={view.typeLabel} />
        <EndpointField
          label="Origen"
          value={view.sourceLabel}
          testId="inspector-source"
        />
        <EndpointField
          label="Destino"
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
