import type {
  DiagramDocument,
  Geometry,
  SystemBoundary,
  UseCase,
} from "./model.ts";

export type DiagramWarningCode =
  "ACTOR_INSIDE_BOUNDARY" | "USE_CASE_OUTSIDE_BOUNDARY";

export type DiagramWarning = {
  code: DiagramWarningCode;
  elementId: string;
  message: string;
};

const ACTOR_INSIDE_MESSAGE =
  "El centro del actor está dentro del SystemBoundary.";
const USE_CASE_OUTSIDE_MESSAGE =
  "El centro del caso de uso está fuera de su SystemBoundary.";

export function collectWarnings(
  document: DiagramDocument,
): readonly DiagramWarning[] {
  const boundary = document.elements.find(
    (element): element is SystemBoundary => element.kind === "system-boundary",
  );
  const warnings: DiagramWarning[] = [];

  for (const element of document.elements) {
    if (element.kind === "actor") {
      if (
        boundary !== undefined &&
        containsCenter(boundary.geometry, element.geometry)
      ) {
        warnings.push({
          code: "ACTOR_INSIDE_BOUNDARY",
          elementId: element.id,
          message: ACTOR_INSIDE_MESSAGE,
        });
      }
      continue;
    }

    if (element.kind !== "use-case") {
      continue;
    }

    if (isUseCaseOutside(element, boundary, document)) {
      warnings.push({
        code: "USE_CASE_OUTSIDE_BOUNDARY",
        elementId: element.id,
        message: USE_CASE_OUTSIDE_MESSAGE,
      });
    }
  }

  return warnings;
}

function isUseCaseOutside(
  useCase: UseCase,
  boundary: SystemBoundary | undefined,
  document: DiagramDocument,
): boolean {
  if (useCase.parentId !== undefined) {
    const parent = document.elements.find(
      (element) => element.id === useCase.parentId,
    );
    if (parent === undefined || parent.kind !== "system-boundary") {
      return false;
    }
    const localParent: Geometry = {
      x: 0,
      y: 0,
      width: parent.geometry.width,
      height: parent.geometry.height,
    };
    return !containsCenter(localParent, useCase.geometry);
  }

  if (boundary === undefined) {
    return false;
  }

  return !containsCenter(boundary.geometry, useCase.geometry);
}

function containsCenter(rect: Geometry, geometry: Geometry): boolean {
  const center = centerOf(geometry);
  return rectContains(rect, center.x, center.y);
}

function centerOf(geometry: Geometry): { x: number; y: number } {
  return {
    x: geometry.x + geometry.width / 2,
    y: geometry.y + geometry.height / 2,
  };
}

function rectContains(rect: Geometry, x: number, y: number): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}
