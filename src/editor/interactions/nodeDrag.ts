import type { DiagramDocument } from "../../domain/diagram/model.ts";
import type { ElementMove } from "../../domain/diagram/operations.ts";
import type { EditorStoreApi } from "../store/editorStore.ts";

export type DraggedNodePosition = {
  id: string;
  position: { x: number; y: number };
};

export function movesFromDraggedNodes(
  document: DiagramDocument,
  nodes: readonly DraggedNodePosition[],
): ElementMove[] {
  const byId = new Map(
    document.elements.map((element) => [element.id, element]),
  );
  const moves: ElementMove[] = [];

  for (const node of nodes) {
    const element = byId.get(node.id);
    if (element === undefined) {
      continue;
    }
    if (
      element.geometry.x === node.position.x &&
      element.geometry.y === node.position.y
    ) {
      continue;
    }
    moves.push({ id: node.id, x: node.position.x, y: node.position.y });
  }

  return moves;
}

export function startNodeDrag(store: EditorStoreApi): void {
  store.getState().endRename();
  store.getState().beginTransaction();
}

export function updateNodeDrag(
  store: EditorStoreApi,
  nodes: readonly DraggedNodePosition[],
): void {
  const moves = movesFromDraggedNodes(store.getState().document, nodes);
  if (moves.length === 0) {
    return;
  }
  store.getState().commitMove(moves);
}

export function stopNodeDrag(
  store: EditorStoreApi,
  nodes: readonly DraggedNodePosition[],
): void {
  updateNodeDrag(store, nodes);
  store.getState().commitTransaction();
}
