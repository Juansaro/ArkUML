import {
  DUPLICATE_OFFSET,
  MIN_BOUNDARY_HEIGHT,
  MIN_BOUNDARY_WIDTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} from "./defaults.ts";
import {
  createActor,
  createRelationship as buildRelationship,
  createSystemBoundary,
  createUseCase,
  type DiagramFactoryDeps,
} from "./factories.ts";
import {
  err,
  ok,
  type Anchor,
  type DiagramDocument,
  type DiagramElement,
  type Geometry,
  type RelationshipKind,
  type Result,
  type SystemBoundary,
  type UseCase,
} from "./model.ts";
import { canConnect } from "./rules.ts";

export type OperationDeps = DiagramFactoryDeps;

export type CreateElementInput =
  | { kind: "actor"; name: string; geometry: Geometry }
  | { kind: "use-case"; name: string; geometry: Geometry; parentId?: string }
  | { kind: "system-boundary"; name: string; geometry: Geometry };

export type ElementMove = {
  id: string;
  x: number;
  y: number;
};

export type CreateRelationshipInput = {
  kind: RelationshipKind;
  sourceId: string;
  targetId: string;
  sourceAnchor: Anchor;
  targetAnchor: Anchor;
};

const INVALID_NAME_MESSAGE = "El nombre debe tener entre 1 y 80 caracteres.";
const BOUNDARY_EXISTS_MESSAGE = "El documento ya tiene un SystemBoundary.";
const UNKNOWN_ELEMENT_MESSAGE = "No existe el elemento.";
const INVALID_PARENT_MESSAGE =
  "El padre debe ser un SystemBoundary del documento.";
const INVALID_GEOMETRY_MESSAGE = "La geometría debe usar números finitos.";
const BOUNDARY_SIZE_MESSAGE = "El SystemBoundary debe medir al menos 320×240.";
const UNKNOWN_RELATIONSHIP_MESSAGE = "No existe la relación.";
const RESIZE_TARGET_MESSAGE = "Solo se puede redimensionar un SystemBoundary.";
const REPARENT_TARGET_MESSAGE = "Solo se puede reparentar un caso de uso.";

export function createElement(
  document: DiagramDocument,
  input: CreateElementInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }
  if (!isFiniteGeometry(input.geometry)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }

  if (input.kind === "system-boundary") {
    if (findBoundary(document) !== undefined) {
      return err("BOUNDARY_EXISTS", BOUNDARY_EXISTS_MESSAGE);
    }
    const sizeError = boundarySizeError(input.geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
    return commit(
      document,
      {
        elements: [
          ...document.elements,
          createSystemBoundary(
            { name: name.value, geometry: input.geometry },
            deps,
          ),
        ],
      },
      deps,
    );
  }

  if (input.kind === "actor") {
    return commit(
      document,
      {
        elements: [
          ...document.elements,
          createActor({ name: name.value, geometry: input.geometry }, deps),
        ],
      },
      deps,
    );
  }

  const parentId = input.parentId;
  if (parentId !== undefined) {
    const parent = findElement(document, parentId);
    if (parent === undefined || parent.kind !== "system-boundary") {
      return err("INVALID_PARENT", INVALID_PARENT_MESSAGE);
    }
    return commit(
      document,
      {
        elements: [
          ...document.elements,
          createUseCase(
            { name: name.value, geometry: input.geometry, parentId },
            deps,
          ),
        ],
      },
      deps,
    );
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        createUseCase({ name: name.value, geometry: input.geometry }, deps),
      ],
    },
    deps,
  );
}

export function renameElement(
  document: DiagramDocument,
  elementId: string,
  name: string,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const element = findElement(document, elementId);
  if (element === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  const normalized = normalizeName(name);
  if (!normalized.ok) {
    return normalized;
  }
  if (element.name === normalized.value) {
    return ok(document);
  }

  return commit(
    document,
    {
      elements: document.elements.map((candidate) =>
        candidate.id === elementId
          ? { ...candidate, name: normalized.value }
          : candidate,
      ),
    },
    deps,
  );
}

export function moveElements(
  document: DiagramDocument,
  moves: readonly ElementMove[],
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (moves.length === 0) {
    return ok(document);
  }

  const byId = indexElements(document);
  const nextPositions = new Map<string, { x: number; y: number }>();

  for (const move of moves) {
    if (byId.get(move.id) === undefined) {
      return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
    }
    if (!Number.isFinite(move.x) || !Number.isFinite(move.y)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    nextPositions.set(move.id, { x: move.x, y: move.y });
  }

  return commit(
    document,
    {
      elements: document.elements.map((element) => {
        const position = nextPositions.get(element.id);
        if (position === undefined) {
          return element;
        }
        return {
          ...element,
          geometry: {
            ...copyGeometry(element.geometry),
            x: position.x,
            y: position.y,
          },
        };
      }),
    },
    deps,
  );
}

export function resizeBoundary(
  document: DiagramDocument,
  input: { id: string; geometry: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const element = findElement(document, input.id);
  if (element === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }
  if (element.kind !== "system-boundary") {
    return err("INVALID_GEOMETRY", RESIZE_TARGET_MESSAGE);
  }
  if (!isFiniteGeometry(input.geometry)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }
  const sizeError = boundarySizeError(input.geometry);
  if (sizeError !== undefined) {
    return sizeError;
  }

  return commit(
    document,
    {
      elements: document.elements.map((candidate) =>
        candidate.id === input.id
          ? { ...candidate, geometry: copyGeometry(input.geometry) }
          : candidate,
      ),
    },
    deps,
  );
}

export function reparentUseCase(
  document: DiagramDocument,
  useCaseId: string,
  parentId: string | undefined,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const element = findElement(document, useCaseId);
  if (element === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }
  if (element.kind !== "use-case") {
    return err("INVALID_PARENT", REPARENT_TARGET_MESSAGE);
  }

  const byId = indexElements(document);
  const absolute = absoluteGeometry(element, byId);
  if (!absolute.ok) {
    return absolute;
  }

  if (parentId === undefined) {
    if (element.parentId === undefined) {
      return ok(document);
    }
    const detached: UseCase = {
      id: element.id,
      kind: "use-case",
      name: element.name,
      geometry: absolute.value,
    };
    return commit(
      document,
      {
        elements: replaceElement(document.elements, detached),
      },
      deps,
    );
  }

  const parent = byId.get(parentId);
  if (parent === undefined || parent.kind !== "system-boundary") {
    return err("INVALID_PARENT", INVALID_PARENT_MESSAGE);
  }
  if (!isFiniteGeometry(parent.geometry)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }

  const attached: UseCase = {
    id: element.id,
    kind: "use-case",
    name: element.name,
    parentId,
    geometry: relativeTo(absolute.value, parent.geometry),
  };

  return commit(
    document,
    {
      elements: replaceElement(document.elements, attached),
    },
    deps,
  );
}

export function deleteElements(
  document: DiagramDocument,
  elementIds: readonly string[],
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (elementIds.length === 0) {
    return ok(document);
  }

  const byId = indexElements(document);
  const deleted = new Set<string>();

  for (const id of elementIds) {
    if (byId.get(id) === undefined) {
      return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
    }
    deleted.add(id);
  }

  const nextElements: DiagramElement[] = [];

  for (const element of document.elements) {
    if (deleted.has(element.id)) {
      continue;
    }

    if (element.kind !== "use-case" || element.parentId === undefined) {
      nextElements.push(element);
      continue;
    }

    if (!deleted.has(element.parentId)) {
      nextElements.push(element);
      continue;
    }

    const parent = byId.get(element.parentId);
    if (parent === undefined || parent.kind !== "system-boundary") {
      return err("INVALID_PARENT", INVALID_PARENT_MESSAGE);
    }
    const absolute = absoluteGeometry(element, byId);
    if (!absolute.ok) {
      return absolute;
    }

    const detached: UseCase = {
      id: element.id,
      kind: "use-case",
      name: element.name,
      geometry: absolute.value,
    };
    nextElements.push(detached);
  }

  return commit(
    document,
    {
      elements: nextElements,
      relationships: document.relationships.filter(
        (relationship) =>
          !deleted.has(relationship.sourceId) &&
          !deleted.has(relationship.targetId),
      ),
    },
    deps,
  );
}

export function duplicateElements(
  document: DiagramDocument,
  elementIds: readonly string[],
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (elementIds.length === 0) {
    return ok(document);
  }

  const byId = indexElements(document);
  const copies: DiagramElement[] = [];

  for (const id of elementIds) {
    const element = byId.get(id);
    if (element === undefined) {
      return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
    }
    if (element.kind === "system-boundary") {
      continue;
    }
    if (!isFiniteGeometry(element.geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }

    const geometry = offsetGeometry(element.geometry, DUPLICATE_OFFSET);
    if (element.kind === "actor") {
      copies.push(createActor({ name: element.name, geometry }, deps));
      continue;
    }

    if (element.parentId !== undefined) {
      copies.push(
        createUseCase(
          { name: element.name, geometry, parentId: element.parentId },
          deps,
        ),
      );
    } else {
      copies.push(createUseCase({ name: element.name, geometry }, deps));
    }
  }

  if (copies.length === 0) {
    return ok(document);
  }

  return commit(
    document,
    {
      elements: [...document.elements, ...copies],
    },
    deps,
  );
}

export function createRelationship(
  document: DiagramDocument,
  input: CreateRelationshipInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const allowed = canConnect(document, input);
  if (!allowed.ok) {
    return allowed;
  }

  const swapped =
    allowed.value.sourceId !== input.sourceId ||
    allowed.value.targetId !== input.targetId;
  const sourceAnchor = swapped ? input.targetAnchor : input.sourceAnchor;
  const targetAnchor = swapped ? input.sourceAnchor : input.targetAnchor;

  return commit(
    document,
    {
      relationships: [
        ...document.relationships,
        buildRelationship(
          {
            kind: allowed.value.kind,
            sourceId: allowed.value.sourceId,
            targetId: allowed.value.targetId,
            sourceAnchor,
            targetAnchor,
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function deleteRelationships(
  document: DiagramDocument,
  relationshipIds: readonly string[],
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (relationshipIds.length === 0) {
    return ok(document);
  }

  const existing = new Set(
    document.relationships.map((relationship) => relationship.id),
  );
  for (const id of relationshipIds) {
    if (!existing.has(id)) {
      return err("UNKNOWN_RELATIONSHIP", UNKNOWN_RELATIONSHIP_MESSAGE);
    }
  }

  const removed = new Set(relationshipIds);
  return commit(
    document,
    {
      relationships: document.relationships.filter(
        (relationship) => !removed.has(relationship.id),
      ),
    },
    deps,
  );
}

function normalizeName(name: string): Result<string> {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    return err("INVALID_NAME", INVALID_NAME_MESSAGE);
  }
  return ok(trimmed);
}

function commit(
  document: DiagramDocument,
  patch: {
    elements?: DiagramElement[];
    relationships?: DiagramDocument["relationships"];
  },
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  return ok({
    ...document,
    elements: patch.elements ?? document.elements,
    relationships: patch.relationships ?? document.relationships,
    metadata: {
      ...document.metadata,
      updatedAt: nextTimestamp(deps),
    },
  });
}

function nextTimestamp(deps: OperationDeps | undefined): string {
  return (deps?.now ?? (() => new Date()))().toISOString();
}

function findElement(
  document: DiagramDocument,
  id: string,
): DiagramElement | undefined {
  return document.elements.find((element) => element.id === id);
}

function findBoundary(document: DiagramDocument): SystemBoundary | undefined {
  return document.elements.find(
    (element): element is SystemBoundary => element.kind === "system-boundary",
  );
}

function indexElements(document: DiagramDocument): Map<string, DiagramElement> {
  return new Map(document.elements.map((element) => [element.id, element]));
}

function replaceElement(
  elements: readonly DiagramElement[],
  next: DiagramElement,
): DiagramElement[] {
  return elements.map((element) => (element.id === next.id ? next : element));
}

function absoluteGeometry(
  element: UseCase,
  byId: Map<string, DiagramElement>,
): Result<Geometry> {
  if (!isFiniteGeometry(element.geometry)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }

  if (element.parentId === undefined) {
    return ok(copyGeometry(element.geometry));
  }

  const parent = byId.get(element.parentId);
  if (parent === undefined || parent.kind !== "system-boundary") {
    return err("INVALID_PARENT", INVALID_PARENT_MESSAGE);
  }
  if (!isFiniteGeometry(parent.geometry)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }

  return ok({
    x: parent.geometry.x + element.geometry.x,
    y: parent.geometry.y + element.geometry.y,
    width: element.geometry.width,
    height: element.geometry.height,
  });
}

function relativeTo(absolute: Geometry, parent: Geometry): Geometry {
  return {
    x: absolute.x - parent.x,
    y: absolute.y - parent.y,
    width: absolute.width,
    height: absolute.height,
  };
}

function offsetGeometry(geometry: Geometry, offset: number): Geometry {
  return {
    x: geometry.x + offset,
    y: geometry.y + offset,
    width: geometry.width,
    height: geometry.height,
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

function isFiniteGeometry(geometry: Geometry): boolean {
  return (
    Number.isFinite(geometry.x) &&
    Number.isFinite(geometry.y) &&
    Number.isFinite(geometry.width) &&
    Number.isFinite(geometry.height)
  );
}

function boundarySizeError(geometry: Geometry): Result<never> | undefined {
  if (
    geometry.width < MIN_BOUNDARY_WIDTH ||
    geometry.height < MIN_BOUNDARY_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", BOUNDARY_SIZE_MESSAGE);
  }
  return undefined;
}
