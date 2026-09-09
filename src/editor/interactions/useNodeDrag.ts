import { useCallback, useState } from "react";
import type {
  NodeChange,
  OnNodeDrag,
  OnNodesChange,
  SelectionDragHandler,
} from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import type { EditorStoreApi } from "../store/editorStore.ts";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";
import {
  computeAlignmentGuidesForDocument,
  EMPTY_ALIGNMENT_GUIDES,
  sameAlignmentGuides,
  type AlignmentGuides,
} from "./alignmentGuides.ts";
import { isBoundaryResizing } from "./boundaryResize.ts";
import {
  startNodeDrag,
  stopNodeDrag,
  updateNodeDrag,
  type DraggedNodePosition,
} from "./nodeDrag.ts";

export function useNodeDrag() {
  const store = useEditorStoreApi();
  const [guides, setGuides] = useState<AlignmentGuides>(EMPTY_ALIGNMENT_GUIDES);

  const showGuides = useCallback(
    (ids: readonly string[]) => {
      const next = computeAlignmentGuidesForDocument(
        store.getState().document,
        ids,
      );
      setGuides((current) =>
        sameAlignmentGuides(current, next) ? current : next,
      );
    },
    [store],
  );

  const hideGuides = useCallback(() => {
    setGuides((current) =>
      sameAlignmentGuides(current, EMPTY_ALIGNMENT_GUIDES)
        ? current
        : EMPTY_ALIGNMENT_GUIDES,
    );
  }, []);

  const onNodeDragStart = useCallback<OnNodeDrag<DiagramNode>>(
    (_event, _node, nodes) => {
      startNodeDrag(store);
      showGuides(idsOf(nodes));
    },
    [showGuides, store],
  );

  const onNodeDrag = useCallback<OnNodeDrag<DiagramNode>>(
    (_event, _node, nodes) => {
      updateNodeDrag(store, nodes);
      showGuides(idsOf(nodes));
    },
    [showGuides, store],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<DiagramNode>>(
    (_event, _node, nodes) => {
      stopNodeDrag(store, nodes);
      hideGuides();
    },
    [hideGuides, store],
  );

  const onSelectionDragStart = useCallback<SelectionDragHandler<DiagramNode>>(
    (_event, nodes) => {
      startNodeDrag(store);
      showGuides(idsOf(nodes));
    },
    [showGuides, store],
  );

  const onSelectionDrag = useCallback<SelectionDragHandler<DiagramNode>>(
    (_event, nodes) => {
      updateNodeDrag(store, nodes);
      showGuides(idsOf(nodes));
    },
    [showGuides, store],
  );

  const onSelectionDragStop = useCallback<SelectionDragHandler<DiagramNode>>(
    (_event, nodes) => {
      stopNodeDrag(store, nodes);
      hideGuides();
    },
    [hideGuides, store],
  );

  const onNodesChange = useCallback<OnNodesChange<DiagramNode>>(
    (changes) => {
      applyNodeSelectionChanges(store, changes);
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
        hideGuides();
      } else {
        showGuides(idsOf(moves));
      }
    },
    [hideGuides, showGuides, store],
  );

  return {
    guides,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onSelectionDragStart,
    onSelectionDrag,
    onSelectionDragStop,
    onNodesChange,
  };
}

function idsOf(nodes: readonly { id: string }[]): string[] {
  return nodes.map((node) => node.id);
}

function applyNodeSelectionChanges(
  store: EditorStoreApi,
  changes: readonly NodeChange<DiagramNode>[],
): void {
  let mutated = false;
  const elementIds = new Set(store.getState().selection.elementIds);

  for (const change of changes) {
    if (change.type !== "select") {
      continue;
    }
    mutated = true;
    if (change.selected) {
      elementIds.add(change.id);
    } else {
      elementIds.delete(change.id);
    }
  }

  if (!mutated) {
    return;
  }

  const next = [...elementIds];
  const current = store.getState().selection;
  if (sameIds(current.elementIds, next)) {
    return;
  }

  store.getState().setSelection({
    elementIds: next,
    relationshipIds: current.relationshipIds,
  });
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}
