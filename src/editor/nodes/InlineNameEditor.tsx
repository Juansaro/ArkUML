import { ElementNameField } from "../interactions/ElementNameField.tsx";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../store/EditorStoreProvider.tsx";

type InlineNameEditorProps = {
  id: string;
  name: string;
  className: string;
};

export function InlineNameEditor({
  id,
  name,
  className,
}: InlineNameEditorProps) {
  const store = useEditorStoreApi();
  const editing = useEditorStore((state) => state.ui.editingElementId === id);

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

  return (
    <ElementNameField
      elementId={id}
      name={name}
      className={`${className} nodrag nopan`}
      autoFocus
      ariaLabel="Nombre del elemento"
      onCommitted={close}
      onCancel={close}
      onInvalidBlur={close}
    />
  );
}
