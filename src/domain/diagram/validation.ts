import type {
  DiagramDocument,
  Geometry,
  RelationshipKind,
  SystemBoundary,
  UseCase,
} from "./model.ts";

export type DiagramWarningCode =
  | "ACTOR_INSIDE_BOUNDARY"
  | "USE_CASE_OUTSIDE_BOUNDARY"
  | "INCLUDE_CYCLE"
  | "EXTEND_CYCLE";

export type DiagramWarning = {
  code: DiagramWarningCode;
  elementId: string;
  message: string;
};

const ACTOR_INSIDE_MESSAGE =
  "El centro del actor está dentro del SystemBoundary.";
const USE_CASE_OUTSIDE_MESSAGE =
  "El centro del caso de uso está fuera de su SystemBoundary.";
const INCLUDE_CYCLE_MESSAGE = "Participa en un ciclo de Include.";
const EXTEND_CYCLE_MESSAGE = "Participa en un ciclo de Extend.";

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

  const includeCycleIds = cyclicUseCaseIds(document, "include");
  const extendCycleIds = cyclicUseCaseIds(document, "extend");

  for (const element of document.elements) {
    if (element.kind !== "use-case") {
      continue;
    }
    if (includeCycleIds.has(element.id)) {
      warnings.push({
        code: "INCLUDE_CYCLE",
        elementId: element.id,
        message: INCLUDE_CYCLE_MESSAGE,
      });
    }
    if (extendCycleIds.has(element.id)) {
      warnings.push({
        code: "EXTEND_CYCLE",
        elementId: element.id,
        message: EXTEND_CYCLE_MESSAGE,
      });
    }
  }

  return warnings;
}

function cyclicUseCaseIds(
  document: DiagramDocument,
  kind: Extract<RelationshipKind, "include" | "extend">,
): ReadonlySet<string> {
  const adjacency = new Map<string, string[]>();
  const nodeIds: string[] = [];
  const seen = new Set<string>();

  function addNode(id: string): void {
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    nodeIds.push(id);
    adjacency.set(id, []);
  }

  for (const relationship of document.relationships) {
    if (relationship.kind !== kind) {
      continue;
    }
    if (relationship.sourceId === relationship.targetId) {
      continue;
    }
    addNode(relationship.sourceId);
    addNode(relationship.targetId);
    const successors = adjacency.get(relationship.sourceId);
    if (successors === undefined) {
      continue;
    }
    successors.push(relationship.targetId);
  }

  return stronglyConnectedCycleIds(nodeIds, adjacency);
}

function stronglyConnectedCycleIds(
  nodeIds: readonly string[],
  adjacency: ReadonlyMap<string, readonly string[]>,
): ReadonlySet<string> {
  let nextIndex = 0;
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const cyclic = new Set<string>();

  function strongconnect(node: string): void {
    index.set(node, nextIndex);
    lowlink.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const successor of adjacency.get(node) ?? []) {
      if (!index.has(successor)) {
        strongconnect(successor);
        const nodeLow = lowlink.get(node);
        const successorLow = lowlink.get(successor);
        if (nodeLow !== undefined && successorLow !== undefined) {
          lowlink.set(node, Math.min(nodeLow, successorLow));
        }
        continue;
      }
      if (!onStack.has(successor)) {
        continue;
      }
      const nodeLow = lowlink.get(node);
      const successorIndex = index.get(successor);
      if (nodeLow !== undefined && successorIndex !== undefined) {
        lowlink.set(node, Math.min(nodeLow, successorIndex));
      }
    }

    if (lowlink.get(node) !== index.get(node)) {
      return;
    }

    const component: string[] = [];
    let member: string | undefined;
    do {
      member = stack.pop();
      if (member === undefined) {
        break;
      }
      onStack.delete(member);
      component.push(member);
    } while (member !== node);

    if (component.length < 2) {
      return;
    }
    for (const id of component) {
      cyclic.add(id);
    }
  }

  for (const id of nodeIds) {
    if (!index.has(id)) {
      strongconnect(id);
    }
  }

  return cyclic;
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
