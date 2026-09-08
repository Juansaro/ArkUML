import {
  err,
  ok,
  type DiagramDocument,
  type DiagramElement,
  type RelationshipKind,
  type Result,
} from "./model.ts";

export const INCLUDE_STEREOTYPE = "«include»";
export const EXTEND_STEREOTYPE = "«extend»";

export type ConnectInput = {
  kind: RelationshipKind;
  sourceId: string;
  targetId: string;
};

export type AllowedConnection = {
  kind: RelationshipKind;
  sourceId: string;
  targetId: string;
};

const UNKNOWN_ELEMENT_MESSAGE = "No existe el elemento.";
const SELF_RELATIONSHIP_MESSAGE =
  "No se permite una relación de un elemento consigo mismo.";
const DUPLICATE_RELATIONSHIP_MESSAGE =
  "Ya existe una relación con el mismo tipo y extremos.";
const BOUNDARY_ENDPOINT_MESSAGE =
  "Un SystemBoundary no puede ser extremo de una relación.";
const ASSOCIATION_TYPES_MESSAGE =
  "Una asociación solo puede unir un actor y un caso de uso.";
const INCLUDE_EXTEND_TYPES_MESSAGE =
  "Include y extend solo se permiten entre casos de uso.";

export function relationshipLabel(kind: RelationshipKind): string | undefined {
  if (kind === "include") {
    return INCLUDE_STEREOTYPE;
  }
  if (kind === "extend") {
    return EXTEND_STEREOTYPE;
  }
  return undefined;
}

export function canConnect(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  const byId = indexElements(document);
  const source = byId.get(input.sourceId);
  const target = byId.get(input.targetId);

  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  if (source.id === target.id) {
    return err("SELF_RELATIONSHIP", SELF_RELATIONSHIP_MESSAGE);
  }

  const typeError = connectionTypeError(input.kind, source, target);
  if (typeError !== undefined) {
    return typeError;
  }

  const endpoints = normalizeEndpoints(input.kind, source, target);
  const duplicate = document.relationships.some(
    (relationship) =>
      relationship.kind === input.kind &&
      relationship.sourceId === endpoints.sourceId &&
      relationship.targetId === endpoints.targetId,
  );

  if (duplicate) {
    return err("DUPLICATE_RELATIONSHIP", DUPLICATE_RELATIONSHIP_MESSAGE);
  }

  return ok({
    kind: input.kind,
    sourceId: endpoints.sourceId,
    targetId: endpoints.targetId,
  });
}

function indexElements(document: DiagramDocument): Map<string, DiagramElement> {
  return new Map(document.elements.map((element) => [element.id, element]));
}

function connectionTypeError(
  kind: RelationshipKind,
  source: DiagramElement,
  target: DiagramElement,
): Result<never> | undefined {
  if (source.kind === "system-boundary" || target.kind === "system-boundary") {
    return err("INVALID_CONNECTION", BOUNDARY_ENDPOINT_MESSAGE);
  }

  if (kind === "association") {
    const actorToUseCase =
      source.kind === "actor" && target.kind === "use-case";
    const useCaseToActor =
      source.kind === "use-case" && target.kind === "actor";
    if (actorToUseCase || useCaseToActor) {
      return undefined;
    }
    return err("INVALID_CONNECTION", ASSOCIATION_TYPES_MESSAGE);
  }

  if (source.kind === "use-case" && target.kind === "use-case") {
    return undefined;
  }

  return err("INVALID_CONNECTION", INCLUDE_EXTEND_TYPES_MESSAGE);
}

function normalizeEndpoints(
  kind: RelationshipKind,
  source: DiagramElement,
  target: DiagramElement,
): { sourceId: string; targetId: string } {
  if (
    kind === "association" &&
    source.kind === "use-case" &&
    target.kind === "actor"
  ) {
    return { sourceId: target.id, targetId: source.id };
  }

  return { sourceId: source.id, targetId: target.id };
}
