import type { DiagramDocument } from "../../domain/diagram/model.ts";
import { absoluteGeometry } from "./reparent.ts";

export const ALIGNMENT_THRESHOLD_PX = 4;

export type AlignmentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AlignmentGuides = {
  vertical: readonly number[];
  horizontal: readonly number[];
};

export const EMPTY_ALIGNMENT_GUIDES: AlignmentGuides = {
  vertical: [],
  horizontal: [],
};

export function computeAlignmentGuides(
  dragged: readonly AlignmentRect[],
  others: readonly AlignmentRect[],
  threshold = ALIGNMENT_THRESHOLD_PX,
): AlignmentGuides {
  if (dragged.length === 0 || others.length === 0) {
    return EMPTY_ALIGNMENT_GUIDES;
  }

  return {
    vertical: collectMatches(dragged, others, verticalRefs, threshold),
    horizontal: collectMatches(dragged, others, horizontalRefs, threshold),
  };
}

export function computeAlignmentGuidesForDocument(
  document: DiagramDocument,
  draggedIds: readonly string[],
  threshold = ALIGNMENT_THRESHOLD_PX,
): AlignmentGuides {
  if (draggedIds.length === 0) {
    return EMPTY_ALIGNMENT_GUIDES;
  }

  const draggedSet = new Set(draggedIds);
  const draggedRects: AlignmentRect[] = [];
  const otherRects: AlignmentRect[] = [];

  for (const element of document.elements) {
    const geometry = absoluteGeometry(element, document);
    const rect: AlignmentRect = {
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
    };

    if (draggedSet.has(element.id)) {
      draggedRects.push(rect);
      continue;
    }

    if (
      element.kind === "use-case" &&
      element.parentId !== undefined &&
      draggedSet.has(element.parentId)
    ) {
      continue;
    }

    otherRects.push(rect);
  }

  return computeAlignmentGuides(draggedRects, otherRects, threshold);
}

export function sameAlignmentGuides(
  left: AlignmentGuides,
  right: AlignmentGuides,
): boolean {
  return (
    sameNumbers(left.vertical, right.vertical) &&
    sameNumbers(left.horizontal, right.horizontal)
  );
}

function verticalRefs(rect: AlignmentRect): readonly number[] {
  return [rect.x, rect.x + rect.width / 2, rect.x + rect.width];
}

function horizontalRefs(rect: AlignmentRect): readonly number[] {
  return [rect.y, rect.y + rect.height / 2, rect.y + rect.height];
}

function collectMatches(
  dragged: readonly AlignmentRect[],
  others: readonly AlignmentRect[],
  refs: (rect: AlignmentRect) => readonly number[],
  threshold: number,
): readonly number[] {
  const matches = new Set<number>();

  for (const draggedRect of dragged) {
    for (const draggedRef of refs(draggedRect)) {
      for (const otherRect of others) {
        for (const otherRef of refs(otherRect)) {
          if (Math.abs(draggedRef - otherRef) <= threshold) {
            matches.add(otherRef);
          }
        }
      }
    }
  }

  return [...matches].sort((left, right) => left - right);
}

function sameNumbers(
  left: readonly number[],
  right: readonly number[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}
