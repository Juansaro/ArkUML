import { useCallback, useEffect } from "react";
import type { NodeMouseHandler } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { selectInspectorView } from "../store/selectors.ts";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";
import { isCreateElementTool } from "../tools/createElementTool.ts";
import { isRelationshipTool } from "../tools/relationshipTool.ts";
import { isRenameShortcutBlocked, isTypingTarget } from "./rename.ts";

export function useElementRename() {
  const store = useEditorStoreApi();

  const onNodeDoubleClick = useCallback<NodeMouseHandler<DiagramNode>>(
    (_event, node) => {
      if (
        isCreateElementTool(store.getState().tool) ||
        isRelationshipTool(store.getState().tool)
      ) {
        return;
      }
      store.getState().beginRename(node.id);
    },
    [store],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      const editingId = store.getState().ui.editingElementId;
      if (event.key === "Escape" && editingId !== undefined) {
        event.preventDefault();
        event.stopImmediatePropagation();
        store.getState().endRename();
        return;
      }

      if (event.key !== "F2" && event.key !== "Enter") {
        return;
      }
      if (isRenameShortcutBlocked(event.target)) {
        return;
      }
      if (editingId !== undefined) {
        return;
      }

      const view = selectInspectorView(store.getState());
      if (view.status !== "element") {
        return;
      }

      event.preventDefault();
      store.getState().beginRename(view.id);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [store]);

  return { onNodeDoubleClick };
}
