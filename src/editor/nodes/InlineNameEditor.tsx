import { ElementNameField } from "../interactions/ElementNameField.tsx";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";

type InlineNameEditorProps = {
  id: string;
  name: string;
  className: string | undefined;
  editing: boolean;
};

export function InlineNameEditor({
  id,
  name,
  className,
  editing,
}: InlineNameEditorProps) {
  const store = useEditorStoreApi();

  if (!editing) {
    return (
      <span className={className} data-testid="element-name">
        {name}
      </span>
    );
  }

  function close() {
    store.getState().endRename();
  }

  const fieldClassName =
    className === undefined ? "nodrag nopan" : `${className} nodrag nopan`;

  return (
    <ElementNameField
      elementId={id}
      name={name}
      className={fieldClassName}
      autoFocus
      ariaLabel="Nombre del elemento"
      onCommitted={close}
      onCancel={close}
      onInvalidBlur={close}
    />
  );
}
