import type {
  DiagramDocument,
  DiagramElement,
  Geometry,
} from "../domain/diagram/model.ts";

export const EXPORT_PADDING = 32;
export const MAX_EXPORT_SIDE = 4096;
export const MAX_EXPORT_PIXELS = 16_000_000;
export const EXPORT_SCALES = [1, 2] as const;

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
  if (document.elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const element of document.elements) {
    const box = absoluteElementGeometry(element, document);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
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
