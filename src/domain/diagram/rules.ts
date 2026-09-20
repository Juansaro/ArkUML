import {
  err,
  isArtifact,
  isDeploymentNode,
  isErAttribute,
  isErEntity,
  isErLink,
  isErRelationshipElement,
  isLifeline,
  isUmlClass,
  isUmlComponent,
  ok,
  type ClassRelationshipKind,
  type ComponentRelationshipKind,
  type DeploymentRelationshipKind,
  type DiagramDocument,
  type DiagramElement,
  type RelationshipKind,
  type Result,
  type SequenceMessageKind,
} from "./model.ts";

export const INCLUDE_STEREOTYPE = "«include»";
export const EXTEND_STEREOTYPE = "«extend»";
export const USE_STEREOTYPE = "«use»";
export const DEPLOY_STEREOTYPE = "«deploy»";

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
const SEQUENCE_ENDPOINT_MESSAGE = "Un mensaje solo puede unir lifelines.";
const SEQUENCE_KIND_MESSAGE =
  "Este documento solo admite mensajes síncronos y reply.";
const USE_CASE_KIND_MESSAGE =
  "Este documento solo admite association, include y extend.";
const CLASS_KIND_MESSAGE =
  "Este documento solo admite asociación, agregación, composición y generalization.";
const CLASS_ENDPOINT_MESSAGE = "Una relación de clases solo puede unir clases.";
const COMPONENT_KIND_MESSAGE =
  "Este documento solo admite uso y ensamblaje entre componentes.";
const COMPONENT_ENDPOINT_MESSAGE =
  "Una relación de componentes solo puede unir componentes.";
const DEPLOYMENT_KIND_MESSAGE =
  "Este documento solo admite camino de comunicación y deploy.";
const COMMUNICATION_PATH_ENDPOINT_MESSAGE =
  "Un camino de comunicación solo puede unir nodos.";
const DEPLOY_ENDPOINT_MESSAGE =
  "Deploy solo puede ir de un artefacto a un nodo.";
const ER_KIND_MESSAGE = "Este documento solo admite enlaces entidad-relación.";
const ER_ENDPOINT_MESSAGE =
  "Un enlace solo puede unir atributo–entidad o entidad–relación.";
const ATTRIBUTE_ALREADY_LINKED_MESSAGE =
  "Un atributo solo puede enlazar a una entidad.";

export function relationshipLabel(kind: RelationshipKind): string | undefined {
  if (kind === "include") {
    return INCLUDE_STEREOTYPE;
  }
  if (kind === "extend") {
    return EXTEND_STEREOTYPE;
  }
  if (kind === "component-usage") {
    return USE_STEREOTYPE;
  }
  if (kind === "deploy") {
    return DEPLOY_STEREOTYPE;
  }
  return undefined;
}

export function canConnect(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  if (document.kind === "sequence") {
    return canConnectSequence(document, input);
  }
  if (document.kind === "class") {
    return canConnectClass(document, input);
  }
  if (document.kind === "component") {
    return canConnectComponent(document, input);
  }
  if (document.kind === "deployment") {
    return canConnectDeployment(document, input);
  }
  if (document.kind === "entity-relationship") {
    return canConnectEr(document, input);
  }
  return canConnectUseCase(document, input);
}

function canConnectSequence(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  if (!isSequenceMessageKind(input.kind)) {
    return err("INVALID_CONNECTION", SEQUENCE_KIND_MESSAGE);
  }

  const byId = indexElements(document);
  const source = byId.get(input.sourceId);
  const target = byId.get(input.targetId);

  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  if (!isLifeline(source) || !isLifeline(target)) {
    return err("INVALID_CONNECTION", SEQUENCE_ENDPOINT_MESSAGE);
  }

  return ok({
    kind: input.kind,
    sourceId: source.id,
    targetId: target.id,
  });
}

function canConnectClass(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  if (!isClassRelationshipKind(input.kind)) {
    return err("INVALID_CONNECTION", CLASS_KIND_MESSAGE);
  }

  const byId = indexElements(document);
  const source = byId.get(input.sourceId);
  const target = byId.get(input.targetId);

  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  if (source.id === target.id) {
    return err("SELF_RELATIONSHIP", SELF_RELATIONSHIP_MESSAGE);
  }

  if (!isUmlClass(source) || !isUmlClass(target)) {
    return err("INVALID_CONNECTION", CLASS_ENDPOINT_MESSAGE);
  }

  return ok({
    kind: input.kind,
    sourceId: source.id,
    targetId: target.id,
  });
}

function canConnectComponent(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  if (!isComponentRelationshipKind(input.kind)) {
    return err("INVALID_CONNECTION", COMPONENT_KIND_MESSAGE);
  }

  const byId = indexElements(document);
  const source = byId.get(input.sourceId);
  const target = byId.get(input.targetId);

  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  if (source.id === target.id) {
    return err("SELF_RELATIONSHIP", SELF_RELATIONSHIP_MESSAGE);
  }

  if (!isUmlComponent(source) || !isUmlComponent(target)) {
    return err("INVALID_CONNECTION", COMPONENT_ENDPOINT_MESSAGE);
  }

  return ok({
    kind: input.kind,
    sourceId: source.id,
    targetId: target.id,
  });
}

function canConnectDeployment(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  if (!isDeploymentRelationshipKind(input.kind)) {
    return err("INVALID_CONNECTION", DEPLOYMENT_KIND_MESSAGE);
  }

  const byId = indexElements(document);
  const source = byId.get(input.sourceId);
  const target = byId.get(input.targetId);

  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  if (source.id === target.id) {
    return err("SELF_RELATIONSHIP", SELF_RELATIONSHIP_MESSAGE);
  }

  if (input.kind === "communication-path") {
    if (!isDeploymentNode(source) || !isDeploymentNode(target)) {
      return err("INVALID_CONNECTION", COMMUNICATION_PATH_ENDPOINT_MESSAGE);
    }
  } else if (!isArtifact(source) || !isDeploymentNode(target)) {
    return err("INVALID_CONNECTION", DEPLOY_ENDPOINT_MESSAGE);
  }

  return ok({
    kind: input.kind,
    sourceId: source.id,
    targetId: target.id,
  });
}

function canConnectEr(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  if (input.kind !== "er-link") {
    return err("INVALID_CONNECTION", ER_KIND_MESSAGE);
  }

  const byId = indexElements(document);
  const source = byId.get(input.sourceId);
  const target = byId.get(input.targetId);

  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  if (source.id === target.id) {
    return err("SELF_RELATIONSHIP", SELF_RELATIONSHIP_MESSAGE);
  }

  const attributeEntity =
    (isErAttribute(source) && isErEntity(target)) ||
    (isErEntity(source) && isErAttribute(target));
  const entityRombo =
    (isErEntity(source) && isErRelationshipElement(target)) ||
    (isErRelationshipElement(source) && isErEntity(target));

  if (!attributeEntity && !entityRombo) {
    return err("INVALID_CONNECTION", ER_ENDPOINT_MESSAGE);
  }

  if (attributeEntity) {
    const attributeId = isErAttribute(source) ? source.id : target.id;
    const alreadyLinked = document.relationships.some(
      (relationship) =>
        isErLink(relationship) &&
        (relationship.sourceId === attributeId ||
          relationship.targetId === attributeId),
    );
    if (alreadyLinked) {
      return err("INVALID_CONNECTION", ATTRIBUTE_ALREADY_LINKED_MESSAGE);
    }
  }

  return ok({
    kind: input.kind,
    sourceId: source.id,
    targetId: target.id,
  });
}

function canConnectUseCase(
  document: DiagramDocument,
  input: ConnectInput,
): Result<AllowedConnection> {
  if (!isUseCaseRelationshipKind(input.kind)) {
    return err("INVALID_CONNECTION", USE_CASE_KIND_MESSAGE);
  }

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

function isSequenceMessageKind(
  kind: RelationshipKind,
): kind is SequenceMessageKind {
  return kind === "sync-message" || kind === "reply-message";
}

function isUseCaseRelationshipKind(
  kind: RelationshipKind,
): kind is "association" | "include" | "extend" {
  return kind === "association" || kind === "include" || kind === "extend";
}

function isClassRelationshipKind(
  kind: RelationshipKind,
): kind is ClassRelationshipKind {
  return (
    kind === "class-association" ||
    kind === "aggregation" ||
    kind === "composition" ||
    kind === "generalization"
  );
}

function isComponentRelationshipKind(
  kind: RelationshipKind,
): kind is ComponentRelationshipKind {
  return kind === "component-usage" || kind === "assembly-connector";
}

function isDeploymentRelationshipKind(
  kind: RelationshipKind,
): kind is DeploymentRelationshipKind {
  return kind === "communication-path" || kind === "deploy";
}

function indexElements(document: DiagramDocument): Map<string, DiagramElement> {
  return new Map(document.elements.map((element) => [element.id, element]));
}

function connectionTypeError(
  kind: "association" | "include" | "extend",
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
  kind: "association" | "include" | "extend",
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
