import type {
  DiagramDocument,
  DiagramElement,
} from "../../domain/diagram/model.ts";
import { absoluteGeometry } from "./reparent.ts";

export const SNAP_THRESHOLD_PX = 8;
export const SNAP_GRID_PX = 16;

export type SnapRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SnapDelta = {
  x: number;
  y: number;
};

export type SnapNodePosition = {
  id: string;
  position: { x: number; y: number };
};

const ZERO_DELTA: SnapDelta = { x: 0, y: 0 };

export function snapGroupDelta(
  dragged: readonly SnapRect[],
  others: readonly SnapRect[],
  threshold = SNAP_THRESHOLD_PX,
  grid = SNAP_GRID_PX,
): SnapDelta {
  if (dragged.length === 0) {
    return ZERO_DELTA;
  }

  const bounds = groupBounds(dragged);
  return {
    x: axisDelta(
      bounds.minX,
      bounds.maxX,
      others.flatMap(verticalRefs),
      threshold,
      grid,
    ),
    y: axisDelta(
      bounds.minY,
      bounds.maxY,
      others.flatMap(horizontalRefs),
      threshold,
      grid,
    ),
  };
}

export function snapDraggedPositions(
  document: DiagramDocument,
  nodes: readonly SnapNodePosition[],
): SnapNodePosition[] {
  if (nodes.length === 0) {
    return [];
  }

  const byId = new Map(
    document.elements.map((element) => [element.id, element]),
  );
  const draggedIds = new Set(nodes.map((node) => node.id));
  const incoming = new Map(nodes.map((node) => [node.id, node.position]));
  const draggedRects: SnapRect[] = [];

  for (const node of nodes) {
    const element = byId.get(node.id);
    if (element === undefined) {
      continue;
    }
    const absolute = absolutePosition(element, incoming, byId, draggedIds);
    draggedRects.push({
      x: absolute.x,
      y: absolute.y,
      width: element.geometry.width,
      height: element.geometry.height,
    });
  }

  const otherRects: SnapRect[] = [];
  for (const element of document.elements) {
    if (draggedIds.has(element.id)) {
      continue;
    }
    if (isChildOfDraggedParent(element, draggedIds)) {
      continue;
    }
    const geometry = absoluteGeometry(element, document);
    otherRects.push({
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
    });
  }

  const delta = snapGroupDelta(draggedRects, otherRects);
  return nodes.map((node) => {
    const element = byId.get(node.id);
    if (element !== undefined && isChildOfDraggedParent(element, draggedIds)) {
      return node;
    }
    return {
      id: node.id,
      position: {
        x: node.position.x + delta.x,
        y: node.position.y + delta.y,
      },
    };
  });
}

function groupBounds(rects: readonly SnapRect[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    maxX = Math.max(maxX, rect.x + rect.width);
    minY = Math.min(minY, rect.y);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return { minX, maxX, minY, maxY };
}

function verticalRefs(rect: SnapRect): readonly number[] {
  return [rect.x, rect.x + rect.width / 2, rect.x + rect.width];
}

function horizontalRefs(rect: SnapRect): readonly number[] {
  return [rect.y, rect.y + rect.height / 2, rect.y + rect.height];
}

function axisDelta(
  start: number,
  end: number,
  otherRefs: readonly number[],
  threshold: number,
  grid: number,
): number {
  const groupRefs = [start, start + (end - start) / 2, end];
  let bestDistance = Infinity;
  let bestTarget = Infinity;
  let bestDelta = 0;
  let found = false;

  for (const groupRef of groupRefs) {
    for (const otherRef of otherRefs) {
      const distance = Math.abs(groupRef - otherRef);
      if (distance > threshold) {
        continue;
      }
      const delta = otherRef - groupRef;
      const closer =
        !found ||
        distance < bestDistance ||
        (distance === bestDistance && otherRef < bestTarget) ||
        (distance === bestDistance &&
          otherRef === bestTarget &&
          delta < bestDelta);
      if (!closer) {
        continue;
      }
      found = true;
      bestDistance = distance;
      bestTarget = otherRef;
      bestDelta = delta;
    }
  }

  if (found) {
    return bestDelta;
  }

  return Math.round(start / grid) * grid - start;
}

function absolutePosition(
  element: DiagramElement,
  incoming: ReadonlyMap<string, { x: number; y: number }>,
  byId: ReadonlyMap<string, DiagramElement>,
  draggedIds: ReadonlySet<string>,
): { x: number; y: number } {
  const position = incoming.get(element.id) ?? {
    x: element.geometry.x,
    y: element.geometry.y,
  };
  if (element.kind !== "use-case" || element.parentId === undefined) {
    return position;
  }

  const parent = byId.get(element.parentId);
  if (parent === undefined) {
    return position;
  }

  const parentPosition = draggedIds.has(parent.id)
    ? absolutePosition(parent, incoming, byId, draggedIds)
    : { x: parent.geometry.x, y: parent.geometry.y };
  return {
    x: parentPosition.x + position.x,
    y: parentPosition.y + position.y,
  };
}

function isChildOfDraggedParent(
  element: DiagramElement,
  draggedIds: ReadonlySet<string>,
): boolean {
  return (
    element.kind === "use-case" &&
    element.parentId !== undefined &&
    draggedIds.has(element.parentId)
  );
}
