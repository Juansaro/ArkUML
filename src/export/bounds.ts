import type {
  DiagramDocument,
  DiagramElement,
  Geometry,
} from "../domain/diagram/model.ts";
import { isLifeline, isSequenceMessage } from "../domain/diagram/model.ts";

export const EXPORT_PADDING = 32;
export const MAX_EXPORT_SIDE = 4096;
export const MAX_EXPORT_PIXELS = 16_000_000;
export const EXPORT_SCALES = [1, 2] as const;
const SELF_MESSAGE_EXTENT_X = 40;
const SELF_MESSAGE_EXTENT_Y = 24;

export type ExportScale = (typeof EXPORT_SCALES)[number];

export type ExportBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExportScaleCheck = {
  width: number;
  height: number;
  allowed: boolean;
  suggestScale: 1 | undefined;
};

export function diagramContentBounds(document: DiagramDocument): ExportBounds {
  if (document.elements.length === 0 && document.relationships.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let found = false;

  function includeBox(box: Geometry): void {
    found = true;
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }

  for (const element of document.elements) {
    includeBox(absoluteElementGeometry(element, document));
  }

  for (const relationship of document.relationships) {
    if (!isSequenceMessage(relationship)) {
      continue;
    }
    const source = document.elements.find(
      (element) => element.id === relationship.sourceId,
    );
    if (source === undefined || !isLifeline(source)) {
      includeBox({ x: 0, y: relationship.y, width: 0, height: 0 });
      continue;
    }
    const stemX = source.geometry.x + source.geometry.width / 2;
    if (relationship.sourceId === relationship.targetId) {
      includeBox({
        x: stemX,
        y: relationship.y,
        width: SELF_MESSAGE_EXTENT_X,
        height: SELF_MESSAGE_EXTENT_Y,
      });
      continue;
    }
    const target = document.elements.find(
      (element) => element.id === relationship.targetId,
    );
    if (target === undefined || !isLifeline(target)) {
      includeBox({ x: stemX, y: relationship.y, width: 0, height: 0 });
      continue;
    }
    const targetX = target.geometry.x + target.geometry.width / 2;
    includeBox({
      x: Math.min(stemX, targetX),
      y: relationship.y,
      width: Math.abs(targetX - stemX),
      height: 0,
    });
  }

  if (!found) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function paddedExportBounds(
  bounds: ExportBounds,
  padding = EXPORT_PADDING,
): ExportBounds {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

export function exportViewportTransform(bounds: ExportBounds): {
  x: number;
  y: number;
  zoom: number;
} {
  return {
    x: -bounds.x,
    y: -bounds.y,
    zoom: 1,
  };
}

export function rasterDimensions(
  bounds: ExportBounds,
  scale: ExportScale,
): { width: number; height: number } {
  return {
    width: Math.round(bounds.width * scale),
    height: Math.round(bounds.height * scale),
  };
}

export function isWithinExportLimits(width: number, height: number): boolean {
  return (
    width <= MAX_EXPORT_SIDE &&
    height <= MAX_EXPORT_SIDE &&
    width * height <= MAX_EXPORT_PIXELS
  );
}

export function evaluateExportScale(
  bounds: ExportBounds,
  scale: ExportScale,
): ExportScaleCheck {
  const { width, height } = rasterDimensions(bounds, scale);
  if (isWithinExportLimits(width, height)) {
    return { width, height, allowed: true, suggestScale: undefined };
  }

  const scale1 = rasterDimensions(bounds, 1);
  const suggestScale =
    scale !== 1 && isWithinExportLimits(scale1.width, scale1.height)
      ? 1
      : undefined;

  return { width, height, allowed: false, suggestScale };
}

function absoluteElementGeometry(
  element: DiagramElement,
  document: DiagramDocument,
): Geometry {
  if (isLifeline(element)) {
    return {
      x: element.geometry.x,
      y: element.geometry.y,
      width: element.geometry.width,
      height: element.geometry.height + element.stemLength,
    };
  }

  if (element.kind !== "use-case" || element.parentId === undefined) {
    return copyGeometry(element.geometry);
  }

  const parent = document.elements.find(
    (candidate) => candidate.id === element.parentId,
  );
  if (parent === undefined) {
    return copyGeometry(element.geometry);
  }

  return {
    x: parent.geometry.x + element.geometry.x,
    y: parent.geometry.y + element.geometry.y,
    width: element.geometry.width,
    height: element.geometry.height,
  };
}

function copyGeometry(geometry: Geometry): Geometry {
  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  };
}
