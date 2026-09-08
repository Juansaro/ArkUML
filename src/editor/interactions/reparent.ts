import type {
  DiagramDocument,
  DiagramElement,
  Geometry,
  SystemBoundary,
  UseCase,
} from "../../domain/diagram/model.ts";
import type { EditorStoreApi } from "../store/editorStore.ts";

export type ReparentDecision =
  | { action: "keep" }
  | { action: "attach"; parentId: string }
  | { action: "detach" };

export function absoluteGeometry(
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

export function decideUseCaseReparent(
  document: DiagramDocument,
  useCaseId: string,
): ReparentDecision {
  const element = document.elements.find(
    (candidate) => candidate.id === useCaseId,
  );
  if (element === undefined || element.kind !== "use-case") {
    return { action: "keep" };
  }

  const boundary = findBoundary(document);
  const absolute = absoluteGeometry(element, document);
  const inside =
    boundary !== undefined && containsCenter(boundary.geometry, absolute);

  if (inside) {
    if (element.parentId === boundary.id) {
      return { action: "keep" };
    }
    return { action: "attach", parentId: boundary.id };
  }

  if (element.parentId === undefined) {
    return { action: "keep" };
  }
  return { action: "detach" };
}

export function applyReparentOnDrop(
  store: EditorStoreApi,
  draggedIds: readonly string[],
): void {
  const document = store.getState().document;
  const byId = new Map(
    document.elements.map((element) => [element.id, element]),
  );

  for (const id of draggedIds) {
    const element = byId.get(id);
    if (element === undefined || element.kind !== "use-case") {
      continue;
    }
    applyDecision(store, element, decideUseCaseReparent(document, id));
  }
}

function applyDecision(
  store: EditorStoreApi,
  useCase: UseCase,
  decision: ReparentDecision,
): void {
  if (decision.action === "keep") {
    return;
  }
  if (decision.action === "detach") {
    store.getState().reparentUseCase(useCase.id, undefined);
    return;
  }
  store.getState().reparentUseCase(useCase.id, decision.parentId);
}

function findBoundary(document: DiagramDocument): SystemBoundary | undefined {
  return document.elements.find(
    (element): element is SystemBoundary => element.kind === "system-boundary",
  );
}

function containsCenter(rect: Geometry, geometry: Geometry): boolean {
  const x = geometry.x + geometry.width / 2;
  const y = geometry.y + geometry.height / 2;
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

function copyGeometry(geometry: Geometry): Geometry {
  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  };
}
