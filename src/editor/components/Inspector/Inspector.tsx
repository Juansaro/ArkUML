import { useShallow } from "zustand/react/shallow";
import { ElementNameField } from "../../interactions/ElementNameField.tsx";
import { selectInspectorView } from "../../store/selectors.ts";
import { useEditorStore } from "../../store/EditorStoreProvider.tsx";
import styles from "./Inspector.module.css";

type InspectorProps = {
  headingId: string;
};

export function Inspector({ headingId }: InspectorProps) {
  const view = useEditorStore(useShallow(selectInspectorView));

  return (
    <div className={styles.body} data-testid="inspector">
      <h2 id={headingId} className={styles.heading}>
        Inspector
      </h2>
      <InspectorBody view={view} />
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
    return <TypeField label={view.typeLabel} />;
  }

  return (
    <div className={styles.fields}>
      <TypeField label={view.typeLabel} />
      <label className={styles.field}>
        <span className={styles.label}>Nombre</span>
        <ElementNameField
          elementId={view.id}
          name={view.name}
          ariaLabel="Nombre"
          showError
        />
      </label>
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
