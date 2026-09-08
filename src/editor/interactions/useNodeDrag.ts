import { useCallback } from "react";
import type {
  OnNodeDrag,
  OnNodesChange,
  SelectionDragHandler,
} from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";
import { isBoundaryResizing } from "./boundaryResize.ts";
import {
  startNodeDrag,
  stopNodeDrag,
  updateNodeDrag,
  type DraggedNodePosition,
} from "./nodeDrag.ts";

export function useNodeDrag() {
  const store = useEditorStoreApi();

  const onNodeDragStart = useCallback<OnNodeDrag<DiagramNode>>(() => {
    startNodeDrag(store);
  }, [store]);

  const onNodeDrag = useCallback<OnNodeDrag<DiagramNode>>(
    (_event, _node, nodes) => {
      updateNodeDrag(store, nodes);
    },
    [store],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<DiagramNode>>(
    (_event, _node, nodes) => {
      stopNodeDrag(store, nodes);
    },
    [store],
  );

  const onSelectionDragStart = useCallback<
    SelectionDragHandler<DiagramNode>
  >(() => {
    startNodeDrag(store);
  }, [store]);

  const onSelectionDrag = useCallback<SelectionDragHandler<DiagramNode>>(
    (_event, nodes) => {
      updateNodeDrag(store, nodes);
    },
    [store],
  );

  const onSelectionDragStop = useCallback<SelectionDragHandler<DiagramNode>>(
    (_event, nodes) => {
      stopNodeDrag(store, nodes);
    },
    [store],
  );

  const onNodesChange = useCallback<OnNodesChange<DiagramNode>>(
    (changes) => {
      if (isBoundaryResizing(store)) {
        return;
      }

      const moves: DraggedNodePosition[] = [];
      let dragging = false;
      let dragEnded = false;

      for (const change of changes) {
        if (change.type !== "position" || change.position === undefined) {
          continue;
        }
        if (change.dragging !== true && change.dragging !== false) {
          continue;
        }
        moves.push({ id: change.id, position: change.position });
        if (change.dragging === true) {
          dragging = true;
        }
        if (change.dragging === false) {
          dragEnded = true;
        }
      }

      if (moves.length === 0) {
        return;
      }

      if (dragging) {
        startNodeDrag(store);
      }
      updateNodeDrag(store, moves);
      if (dragEnded) {
        stopNodeDrag(store, moves);
      }
    },
    [store],
  );

  return {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onSelectionDragStart,
    onSelectionDrag,
    onSelectionDragStop,
    onNodesChange,
  };
}
