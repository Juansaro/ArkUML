import {
  DEFAULT_ACTION_GEOMETRY,
  DEFAULT_ACTIVITY_DOCUMENT_TITLE,
  DEFAULT_ACTIVITY_FINAL_GEOMETRY,
  DEFAULT_ARTIFACT_GEOMETRY,
  DEFAULT_ATTRIBUTE_GEOMETRY,
  DEFAULT_BOUNDARY_GEOMETRY,
  DEFAULT_CLASS_DOCUMENT_TITLE,
  DEFAULT_CLASS_GEOMETRY,
  DEFAULT_COMPONENT_DOCUMENT_TITLE,
  DEFAULT_COMPONENT_GEOMETRY,
  DEFAULT_DECISION_NODE_GEOMETRY,
  DEFAULT_DEPLOYMENT_DOCUMENT_TITLE,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_ENTITY_GEOMETRY,
  DEFAULT_ER_DOCUMENT_TITLE,
  DEFAULT_ER_RELATIONSHIP_GEOMETRY,
  DEFAULT_FORK_NODE_GEOMETRY,
  DEFAULT_INITIAL_NODE_GEOMETRY,
  DEFAULT_INTERACTION_OVERVIEW_DOCUMENT_TITLE,
  DEFAULT_INTERACTION_OCCURRENCE_GEOMETRY,
  DEFAULT_LIFELINE_GEOMETRY,
  DEFAULT_NODE_GEOMETRY,
  DEFAULT_SEQUENCE_DOCUMENT_TITLE,
  DEFAULT_VIEWPORT,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} from "./defaults.ts";
import {
  parseDocumentFile,
  parseDocumentFileText,
  serializeDocumentFile,
  type ArkUmlDocumentFile,
} from "./documentFile.ts";
import {
  createDiagramDocument,
  createEmptyActivityDocument,
  createEmptyClassDocument,
  createEmptyComponentDocument,
  createEmptyDeploymentDocument,
  createEmptyErDocument,
  createEmptyInteractionOverviewDocument,
  createEmptySequenceDocument,
} from "./factories.ts";
import {
  err,
  isClassAssociation,
  isComponentRelationship,
  isControlFlow,
  isDeploymentRelationship,
  isErLink,
  isGeneralization,
  isSequenceMessage,
  isUmlClass,
  isUseCaseRelationship,
  ok,
  type Anchor,
  type AssociationMultiplicity,
  type DiagramDocument,
  type DiagramElement,
  type DocumentKind,
  type ErCardinality,
  type Geometry,
  type Relationship,
  type RelationshipKind,
  type Result,
  type Viewport,
} from "./model.ts";
import {
  createAction,
  createActivityFinal,
  createArtifact,
  createAttribute,
  createClass,
  createComponent,
  createDecisionNode,
  createElement as createUseCaseElement,
  createEntity,
  createErRelationship,
  createForkNode,
  createInitialNode,
  createInteractionOccurrence,
  createJoinNode,
  createLifeline,
  createMergeNode,
  createNode,
  createRelationship as createDomainRelationship,
  deleteElements,
  deleteRelationships,
  moveElements,
  renameElement,
  renameRelationship,
  reparentUseCase,
  resizeBoundary,
  resizeElement,
  resizeLifelineStem,
  setAssociationEnds,
  setAttributeKey,
  setClassMembers,
  setControlFlowGuard,
  setErCardinality,
  moveMessage,
  reconnectRelationship,
  type CreateRelationshipInput,
  type OperationDeps,
} from "./operations.ts";
import { parseDiagramDocument } from "./schema.ts";
import { collectWarnings, type DiagramWarning } from "./validation.ts";

const INVALID_NAME_MESSAGE = "El nombre debe tener entre 1 y 80 caracteres.";
const UNKNOWN_DOCUMENT_KIND_MESSAGE = "kind de documento no soportado.";
const UNKNOWN_ELEMENT_KIND_MESSAGE =
  "Tipo de elemento no soportado en este documento.";
const UNKNOWN_RELATIONSHIP_KIND_MESSAGE =
  "Tipo de relación no soportado en este documento.";
const INVALID_DOCUMENT_MESSAGE = "El documento no es un snapshot válido.";

const ELEMENT_KINDS = [
  "actor",
  "use-case",
  "system-boundary",
  "lifeline",
  "class",
  "component",
  "node",
  "artifact",
  "entity",
  "attribute",
  "er-relationship",
  "action",
  "initial-node",
  "activity-final",
  "decision-node",
  "merge-node",
  "fork-node",
  "join-node",
  "interaction-occurrence",
] as const satisfies readonly DiagramElement["kind"][];

const RELATIONSHIP_KINDS = [
  "association",
  "include",
  "extend",
  "sync-message",
  "reply-message",
  "class-association",
  "aggregation",
  "composition",
  "generalization",
  "component-usage",
  "assembly-connector",
  "communication-path",
  "deploy",
  "er-link",
  "control-flow",
] as const satisfies readonly RelationshipKind[];

export type KindCatalogEntry = {
  kind: DocumentKind;
  defaultTitle: string;
  elements: readonly string[];
  relationships: readonly string[];
  rules: string;
};

const KIND_CATALOG: readonly KindCatalogEntry[] = [
  {
    kind: "use-case",
    defaultTitle: DEFAULT_DOCUMENT_TITLE,
    elements: ["actor", "use-case", "system-boundary"],
    relationships: ["association", "include", "extend"],
    rules:
      "Asociación entre actor y caso de uso (se normaliza actor → caso). Include y extend solo entre casos de uso. Un SystemBoundary no es extremo. Un elemento consigo mismo es SELF_RELATIONSHIP. La misma tupla de tipo y extremos es DUPLICATE_RELATIONSHIP.",
  },
  {
    kind: "sequence",
    defaultTitle: DEFAULT_SEQUENCE_DOCUMENT_TITLE,
    elements: ["lifeline"],
    relationships: ["sync-message", "reply-message"],
    rules:
      "sync-message y reply-message solo entre lifelines. El self-message está permitido. name de 0 a 80 caracteres. y no puede quedar dentro de la cabeza de origen ni de destino.",
  },
  {
    kind: "class",
    defaultTitle: DEFAULT_CLASS_DOCUMENT_TITLE,
    elements: ["class"],
    relationships: [
      "class-association",
      "aggregation",
      "composition",
      "generalization",
    ],
    rules:
      "class-association, aggregation, composition y generalization solo entre clases distintas. Un elemento consigo mismo es SELF_RELATIONSHIP. Multiplicidad 0..1, 1, 0..* o 1..* en asociación, agregación y composición. Generalization no admite multiplicidades. name de 0 a 80 caracteres.",
  },
  {
    kind: "component",
    defaultTitle: DEFAULT_COMPONENT_DOCUMENT_TITLE,
    elements: ["component"],
    relationships: ["component-usage", "assembly-connector"],
    rules:
      "component-usage y assembly-connector solo entre componentes distintos. Un elemento consigo mismo es SELF_RELATIONSHIP. name de 0 a 80 caracteres.",
  },
  {
    kind: "deployment",
    defaultTitle: DEFAULT_DEPLOYMENT_DOCUMENT_TITLE,
    elements: ["node", "artifact"],
    relationships: ["communication-path", "deploy"],
    rules:
      "communication-path solo entre nodos. deploy solo de artefacto a nodo. Un elemento consigo mismo es SELF_RELATIONSHIP. name de 0 a 80 caracteres.",
  },
  {
    kind: "entity-relationship",
    defaultTitle: DEFAULT_ER_DOCUMENT_TITLE,
    elements: ["entity", "attribute", "er-relationship"],
    relationships: ["er-link"],
    rules:
      "er-link entre atributo y entidad, o entre entidad y rombo. Un atributo solo admite un enlace. Cardinalidad 1 o N solo en entidad–rombo; prohibida en atributo–entidad. Un elemento consigo mismo es SELF_RELATIONSHIP.",
  },
  {
    kind: "activity",
    defaultTitle: DEFAULT_ACTIVITY_DOCUMENT_TITLE,
    elements: [
      "action",
      "initial-node",
      "activity-final",
      "decision-node",
      "merge-node",
      "fork-node",
      "join-node",
    ],
    relationships: ["control-flow"],
    rules:
      "control-flow entre nodos de actividad distintos. initial-node no es destino. activity-final no es origen. guard de 0 a 80 caracteres. Un elemento consigo mismo es SELF_RELATIONSHIP.",
  },
  {
    kind: "interaction-overview",
    defaultTitle: DEFAULT_INTERACTION_OVERVIEW_DOCUMENT_TITLE,
    elements: [
      "interaction-occurrence",
      "initial-node",
      "activity-final",
      "decision-node",
      "merge-node",
      "fork-node",
      "join-node",
    ],
    relationships: ["control-flow"],
    rules:
      "control-flow entre ocurrencias de interacción o nodos de control, distintos. initial-node no es destino. activity-final no es origen. No admite action. guard de 0 a 80 caracteres. El name de interaction-occurrence es la referencia (1–80), no un id de documento. Un elemento consigo mismo es SELF_RELATIONSHIP.",
  },
];

export type AgentGeometryInput = {
  x?: number | undefined;
  y?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
};

export type AgentCreateElementInput = {
  kind: string;
  name?: string | undefined;
  geometry?: AgentGeometryInput | undefined;
  parentId?: string | undefined;
  stemLength?: number | undefined;
  isKey?: boolean | undefined;
  attributes?: readonly string[] | undefined;
  operations?: readonly string[] | undefined;
};

export type AgentElementUpdate = {
  id: string;
  name?: string | undefined;
  geometry?: AgentGeometryInput | undefined;
  parentId?: string | null | undefined;
  stemLength?: number | undefined;
  attributes?: readonly string[] | undefined;
  operations?: readonly string[] | undefined;
  isKey?: boolean | undefined;
};

export type AgentCreateRelationshipInput = {
  kind: string;
  sourceId: string;
  targetId: string;
  name?: string | undefined;
  sourceAnchor?: Anchor | undefined;
  targetAnchor?: Anchor | undefined;
  sourceMultiplicity?: AssociationMultiplicity | undefined;
  targetMultiplicity?: AssociationMultiplicity | undefined;
  cardinality?: ErCardinality | undefined;
  guard?: string | undefined;
  y?: number | undefined;
};

export type AgentRelationshipUpdate = {
  id: string;
  name?: string;
  sourceId?: string;
  targetId?: string;
  sourceAnchor?: Anchor;
  targetAnchor?: Anchor;
  sourceMultiplicity?: AssociationMultiplicity;
  targetMultiplicity?: AssociationMultiplicity;
  cardinality?: ErCardinality;
  guard?: string;
  y?: number;
};

export type AgentElementSummary = {
  id: string;
  kind: DiagramElement["kind"];
  name: string;
  geometry: Geometry;
  parentId?: string;
  stemLength?: number;
  attributes?: readonly string[];
  operations?: readonly string[];
  isKey?: boolean;
};

export type AgentRelationshipSummary = {
  id: string;
  kind: RelationshipKind;
  sourceId: string;
  targetId: string;
  name?: string;
  sourceAnchor?: Anchor;
  targetAnchor?: Anchor;
  y?: number;
  sourceMultiplicity?: AssociationMultiplicity;
  targetMultiplicity?: AssociationMultiplicity;
  cardinality?: ErCardinality;
  guard?: string;
};

export type AgentDocumentSummary = {
  id: string;
  kind: DocumentKind;
  title: string;
  elements: AgentElementSummary[];
  relationships: AgentRelationshipSummary[];
};

export type AgentValidation = {
  document: DiagramDocument;
  warnings: readonly DiagramWarning[];
};

type DocumentStep = (document: DiagramDocument) => Result<DiagramDocument>;

export function listKinds(): readonly KindCatalogEntry[] {
  return KIND_CATALOG;
}

export function describeRules(kind: string): Result<KindCatalogEntry> {
  const entry = KIND_CATALOG.find((candidate) => candidate.kind === kind);
  if (entry === undefined) {
    return err("UNKNOWN_KIND", UNKNOWN_DOCUMENT_KIND_MESSAGE);
  }
  return ok(entry);
}

export function createDocument(
  kind: string,
  input: { title?: string } = {},
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (!isDocumentKind(kind)) {
    return err("UNKNOWN_KIND", UNKNOWN_DOCUMENT_KIND_MESSAGE);
  }

  const title = input.title?.trim();
  if (title !== undefined && !isValidTitle(title)) {
    return err("INVALID_NAME", INVALID_NAME_MESSAGE);
  }

  const document = emptyDocument(kind, deps);
  if (title === undefined) {
    return ok(document);
  }

  return ok({
    ...document,
    metadata: {
      ...document.metadata,
      title,
    },
  });
}

export function loadDocument(input: unknown): Result<ArkUmlDocumentFile> {
  if (typeof input === "string") {
    return parseDocumentFileText(input);
  }
  return parseDocumentFile(input);
}

export function saveDocument(
  document: DiagramDocument,
  view: Viewport = DEFAULT_VIEWPORT,
): string {
  return serializeDocumentFile(document, view);
}

export function validateDocument(input: unknown): Result<AgentValidation> {
  const decoded = decodeJson(input);
  if (!decoded.ok) {
    return decoded;
  }

  const parsed = parseDiagramDocument(decoded.value);
  if (!parsed.ok) {
    return parsed;
  }

  return ok({
    document: parsed.value,
    warnings: collectWarnings(parsed.value),
  });
}

export function listElements(document: DiagramDocument): AgentDocumentSummary {
  return {
    id: document.id,
    kind: document.kind,
    title: document.metadata.title,
    elements: document.elements.map(summarizeElement),
    relationships: document.relationships.map(summarizeRelationship),
  };
}

export function createElement(
  document: DiagramDocument,
  input: AgentCreateElementInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (!isElementKind(input.kind)) {
    return err("UNKNOWN_KIND", UNKNOWN_ELEMENT_KIND_MESSAGE);
  }

  const geometry = explicitGeometry(input.kind, input.geometry);
  const name = input.name ?? "";

  switch (input.kind) {
    case "actor":
      return createUseCaseElement(
        document,
        {
          kind: "actor",
          name,
          geometry: geometryOrDefault(input.kind, geometry),
        },
        deps,
      );
    case "use-case":
      return createUseCaseElement(
        document,
        input.parentId === undefined
          ? {
              kind: "use-case",
              name,
              geometry: geometryOrDefault(input.kind, geometry),
            }
          : {
              kind: "use-case",
              name,
              geometry: geometryOrDefault(input.kind, geometry),
              parentId: input.parentId,
            },
        deps,
      );
    case "system-boundary":
      return createUseCaseElement(
        document,
        {
          kind: "system-boundary",
          name,
          geometry: geometryOrDefault(input.kind, geometry),
        },
        deps,
      );
    case "lifeline":
      return createLifeline(
        document,
        {
          name,
          ...(geometry === undefined ? {} : { geometry }),
          ...(input.stemLength === undefined
            ? {}
            : { stemLength: input.stemLength }),
        },
        deps,
      );
    case "class":
      return createClassElement(document, name, geometry, input, deps);
    case "component":
      return createComponent(
        document,
        { name, ...(geometry === undefined ? {} : { geometry }) },
        deps,
      );
    case "node":
      return createNode(
        document,
        { name, ...(geometry === undefined ? {} : { geometry }) },
        deps,
      );
    case "artifact":
      return createArtifact(
        document,
        { name, ...(geometry === undefined ? {} : { geometry }) },
        deps,
      );
    case "entity":
      return createEntity(
        document,
        { name, ...(geometry === undefined ? {} : { geometry }) },
        deps,
      );
    case "attribute":
      return createAttribute(
        document,
        {
          name,
          ...(geometry === undefined ? {} : { geometry }),
          ...(input.isKey === true ? { isKey: true } : {}),
        },
        deps,
      );
    case "er-relationship":
      return createErRelationship(
        document,
        { name, ...(geometry === undefined ? {} : { geometry }) },
        deps,
      );
    case "action":
      return createAction(
        document,
        { name, ...(geometry === undefined ? {} : { geometry }) },
        deps,
      );
    case "interaction-occurrence":
      return createInteractionOccurrence(
        document,
        { name, ...(geometry === undefined ? {} : { geometry }) },
        deps,
      );
    case "initial-node":
      return createInitialNode(
        document,
        controlNodeInput(input, geometry),
        deps,
      );
    case "activity-final":
      return createActivityFinal(
        document,
        controlNodeInput(input, geometry),
        deps,
      );
    case "decision-node":
      return createDecisionNode(
        document,
        controlNodeInput(input, geometry),
        deps,
      );
    case "merge-node":
      return createMergeNode(document, controlNodeInput(input, geometry), deps);
    case "fork-node":
      return createForkNode(document, controlNodeInput(input, geometry), deps);
    case "join-node":
      return createJoinNode(document, controlNodeInput(input, geometry), deps);
    default: {
      const unexpected: never = input.kind;
      return unexpected;
    }
  }
}

export function updateElement(
  document: DiagramDocument,
  input: AgentElementUpdate,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const steps: DocumentStep[] = [];
  const name = input.name;
  if (name !== undefined) {
    steps.push((current) => renameElement(current, input.id, name, deps));
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    steps.push((current) =>
      applyGeometryUpdate(current, input.id, geometry, deps),
    );
  }

  const parentId = input.parentId;
  if (parentId !== undefined) {
    steps.push((current) =>
      reparentUseCase(
        current,
        input.id,
        parentId === null ? undefined : parentId,
        deps,
      ),
    );
  }

  const stemLength = input.stemLength;
  if (stemLength !== undefined) {
    steps.push((current) =>
      resizeLifelineStem(current, { id: input.id, stemLength }, deps),
    );
  }

  const attributes = input.attributes;
  const operations = input.operations;
  if (attributes !== undefined || operations !== undefined) {
    steps.push((current) =>
      applyClassMembers(current, input.id, attributes, operations, deps),
    );
  }

  const isKey = input.isKey;
  if (isKey !== undefined) {
    steps.push((current) =>
      setAttributeKey(current, { id: input.id, isKey }, deps),
    );
  }

  return applySteps(document, steps);
}

export function deleteElement(
  document: DiagramDocument,
  elementId: string,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return deleteElements(document, [elementId], deps);
}

export function createRelationship(
  document: DiagramDocument,
  input: AgentCreateRelationshipInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (!isRelationshipKind(input.kind)) {
    return err("UNKNOWN_KIND", UNKNOWN_RELATIONSHIP_KIND_MESSAGE);
  }

  return createDomainRelationship(
    document,
    toRelationshipInput(document, { ...input, kind: input.kind }),
    deps,
  );
}

export function updateRelationship(
  document: DiagramDocument,
  input: AgentRelationshipUpdate,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const steps: DocumentStep[] = [];
  const name = input.name;
  if (name !== undefined) {
    steps.push((current) => renameRelationship(current, input.id, name, deps));
  }

  const y = input.y;
  if (y !== undefined) {
    steps.push((current) => moveMessage(current, { id: input.id, y }, deps));
  }

  if (
    input.sourceMultiplicity !== undefined ||
    input.targetMultiplicity !== undefined
  ) {
    steps.push((current) => applyAssociationEnds(current, input, deps));
  }

  const cardinality = input.cardinality;
  if (cardinality !== undefined) {
    steps.push((current) =>
      setErCardinality(current, { id: input.id, cardinality }, deps),
    );
  }

  const guard = input.guard;
  if (guard !== undefined) {
    steps.push((current) =>
      setControlFlowGuard(current, { id: input.id, guard }, deps),
    );
  }

  if (
    input.sourceId !== undefined ||
    input.targetId !== undefined ||
    input.sourceAnchor !== undefined ||
    input.targetAnchor !== undefined
  ) {
    steps.push((current) => applyReconnect(current, input, deps));
  }

  return applySteps(document, steps);
}

export function deleteRelationship(
  document: DiagramDocument,
  relationshipId: string,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return deleteRelationships(document, [relationshipId], deps);
}

function emptyDocument(
  kind: DocumentKind,
  deps: OperationDeps | undefined,
): DiagramDocument {
  switch (kind) {
    case "use-case":
      return createDiagramDocument(deps);
    case "sequence":
      return createEmptySequenceDocument(deps);
    case "class":
      return createEmptyClassDocument(deps);
    case "component":
      return createEmptyComponentDocument(deps);
    case "deployment":
      return createEmptyDeploymentDocument(deps);
    case "entity-relationship":
      return createEmptyErDocument(deps);
    case "activity":
      return createEmptyActivityDocument(deps);
    case "interaction-overview":
      return createEmptyInteractionOverviewDocument(deps);
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

function createClassElement(
  document: DiagramDocument,
  name: string,
  geometry: Geometry | undefined,
  input: AgentCreateElementInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const created = createClass(
    document,
    { name, ...(geometry === undefined ? {} : { geometry }) },
    deps,
  );
  if (!created.ok) {
    return created;
  }
  if (input.attributes === undefined && input.operations === undefined) {
    return created;
  }

  const id = addedElementId(document, created.value);
  if (id === undefined) {
    return err("UNKNOWN_ELEMENT", "No existe el elemento.");
  }

  return setClassMembers(
    created.value,
    {
      id,
      attributes: input.attributes ?? [],
      operations: input.operations ?? [],
    },
    deps,
  );
}

function controlNodeInput(
  input: AgentCreateElementInput,
  geometry: Geometry | undefined,
): { name?: string; geometry?: Geometry } {
  return {
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(geometry === undefined ? {} : { geometry }),
  };
}

function applyGeometryUpdate(
  document: DiagramDocument,
  id: string,
  input: AgentGeometryInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const element = document.elements.find((candidate) => candidate.id === id);
  if (element === undefined) {
    return moveElements(
      document,
      [{ id, x: input.x ?? 0, y: input.y ?? 0 }],
      deps,
    );
  }

  const next: Geometry = {
    x: input.x ?? element.geometry.x,
    y: input.y ?? element.geometry.y,
    width: input.width ?? element.geometry.width,
    height: input.height ?? element.geometry.height,
  };
  const sizeChanged =
    next.width !== element.geometry.width ||
    next.height !== element.geometry.height;
  const positionChanged =
    next.x !== element.geometry.x || next.y !== element.geometry.y;

  if (!sizeChanged && !positionChanged) {
    return ok(document);
  }
  if (sizeChanged && element.kind === "system-boundary") {
    return resizeBoundary(document, { id, geometry: next }, deps);
  }
  if (sizeChanged) {
    return resizeElement(document, { id, geometry: next }, deps);
  }
  return moveElements(document, [{ id, x: next.x, y: next.y }], deps);
}

function applyClassMembers(
  document: DiagramDocument,
  id: string,
  attributes: readonly string[] | undefined,
  operations: readonly string[] | undefined,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const element = document.elements.find((candidate) => candidate.id === id);
  if (element !== undefined && isUmlClass(element)) {
    return setClassMembers(
      document,
      {
        id,
        attributes: attributes ?? element.attributes,
        operations: operations ?? element.operations,
      },
      deps,
    );
  }

  return setClassMembers(
    document,
    {
      id,
      attributes: attributes ?? [],
      operations: operations ?? [],
    },
    deps,
  );
}

function applyAssociationEnds(
  document: DiagramDocument,
  input: AgentRelationshipUpdate,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === input.id,
  );
  if (existing !== undefined && isClassAssociation(existing)) {
    const sourceMultiplicity =
      input.sourceMultiplicity ?? existing.sourceMultiplicity;
    const targetMultiplicity =
      input.targetMultiplicity ?? existing.targetMultiplicity;
    return setAssociationEnds(
      document,
      {
        id: input.id,
        sourceMultiplicity,
        targetMultiplicity,
      },
      deps,
    );
  }

  return setAssociationEnds(
    document,
    {
      id: input.id,
      sourceMultiplicity: input.sourceMultiplicity ?? "1",
      targetMultiplicity: input.targetMultiplicity ?? "1",
    },
    deps,
  );
}

function applyReconnect(
  document: DiagramDocument,
  input: AgentRelationshipUpdate,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === input.id,
  );
  if (existing !== undefined && isUseCaseRelationship(existing)) {
    return reconnectRelationship(
      document,
      {
        id: input.id,
        kind: existing.kind,
        sourceId: input.sourceId ?? existing.sourceId,
        targetId: input.targetId ?? existing.targetId,
        sourceAnchor: input.sourceAnchor ?? existing.sourceAnchor,
        targetAnchor: input.targetAnchor ?? existing.targetAnchor,
      },
      deps,
    );
  }

  return reconnectRelationship(
    document,
    {
      id: input.id,
      kind: "association",
      sourceId: input.sourceId ?? existing?.sourceId ?? input.id,
      targetId: input.targetId ?? existing?.targetId ?? input.id,
      sourceAnchor: input.sourceAnchor ?? "right",
      targetAnchor: input.targetAnchor ?? "left",
    },
    deps,
  );
}

function toRelationshipInput(
  document: DiagramDocument,
  input: AgentCreateRelationshipInput & { kind: RelationshipKind },
): CreateRelationshipInput {
  const kind = input.kind;
  if (kind === "association" || kind === "include" || kind === "extend") {
    return {
      kind,
      sourceId: input.sourceId,
      targetId: input.targetId,
      sourceAnchor: input.sourceAnchor ?? "right",
      targetAnchor: input.targetAnchor ?? "left",
    };
  }
  if (kind === "sync-message" || kind === "reply-message") {
    return {
      kind,
      sourceId: input.sourceId,
      targetId: input.targetId,
      ...(input.name === undefined ? {} : { name: input.name }),
      y: input.y ?? defaultMessageY(document, input.sourceId, input.targetId),
    };
  }
  if (
    kind === "class-association" ||
    kind === "aggregation" ||
    kind === "composition" ||
    kind === "generalization"
  ) {
    return {
      kind,
      sourceId: input.sourceId,
      targetId: input.targetId,
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.sourceMultiplicity === undefined
        ? {}
        : { sourceMultiplicity: input.sourceMultiplicity }),
      ...(input.targetMultiplicity === undefined
        ? {}
        : { targetMultiplicity: input.targetMultiplicity }),
    };
  }
  if (kind === "component-usage" || kind === "assembly-connector") {
    return {
      kind,
      sourceId: input.sourceId,
      targetId: input.targetId,
      ...(input.name === undefined ? {} : { name: input.name }),
    };
  }
  if (kind === "communication-path" || kind === "deploy") {
    return {
      kind,
      sourceId: input.sourceId,
      targetId: input.targetId,
      ...(input.name === undefined ? {} : { name: input.name }),
    };
  }
  if (kind === "er-link") {
    return {
      kind,
      sourceId: input.sourceId,
      targetId: input.targetId,
      ...(input.cardinality === undefined
        ? {}
        : { cardinality: input.cardinality }),
    };
  }

  return {
    kind,
    sourceId: input.sourceId,
    targetId: input.targetId,
    ...(input.guard === undefined ? {} : { guard: input.guard }),
  };
}

function defaultMessageY(
  document: DiagramDocument,
  sourceId: string,
  targetId: string,
): number {
  const source = document.elements.find((element) => element.id === sourceId);
  const target = document.elements.find((element) => element.id === targetId);
  if (source === undefined || target === undefined) {
    return 0;
  }
  return Math.max(
    source.geometry.y + source.geometry.height,
    target.geometry.y + target.geometry.height,
  );
}

function summarizeElement(element: DiagramElement): AgentElementSummary {
  const summary: AgentElementSummary = {
    id: element.id,
    kind: element.kind,
    name: element.name,
    geometry: copyGeometry(element.geometry),
  };
  if (element.kind === "use-case" && element.parentId !== undefined) {
    summary.parentId = element.parentId;
  }
  if (element.kind === "lifeline") {
    summary.stemLength = element.stemLength;
  }
  if (element.kind === "class") {
    summary.attributes = [...element.attributes];
    summary.operations = [...element.operations];
  }
  if (element.kind === "attribute" && element.isKey === true) {
    summary.isKey = true;
  }
  return summary;
}

function summarizeRelationship(
  relationship: Relationship,
): AgentRelationshipSummary {
  const summary: AgentRelationshipSummary = {
    id: relationship.id,
    kind: relationship.kind,
    sourceId: relationship.sourceId,
    targetId: relationship.targetId,
  };
  if (isUseCaseRelationship(relationship)) {
    summary.sourceAnchor = relationship.sourceAnchor;
    summary.targetAnchor = relationship.targetAnchor;
    return summary;
  }
  if (isSequenceMessage(relationship)) {
    summary.name = relationship.name;
    summary.y = relationship.y;
    return summary;
  }
  if (isClassAssociation(relationship)) {
    summary.name = relationship.name;
    summary.sourceMultiplicity = relationship.sourceMultiplicity;
    summary.targetMultiplicity = relationship.targetMultiplicity;
    return summary;
  }
  if (
    isGeneralization(relationship) ||
    isComponentRelationship(relationship) ||
    isDeploymentRelationship(relationship)
  ) {
    summary.name = relationship.name;
    return summary;
  }
  if (isErLink(relationship)) {
    if (relationship.cardinality !== undefined) {
      summary.cardinality = relationship.cardinality;
    }
    return summary;
  }
  if (isControlFlow(relationship)) {
    summary.guard = relationship.guard;
  }
  return summary;
}

function explicitGeometry(
  kind: DiagramElement["kind"],
  input: AgentGeometryInput | undefined,
): Geometry | undefined {
  if (input === undefined) {
    return undefined;
  }
  const base = defaultGeometry(kind);
  return {
    x: input.x ?? base.x,
    y: input.y ?? base.y,
    width: input.width ?? base.width,
    height: input.height ?? base.height,
  };
}

function geometryOrDefault(
  kind: DiagramElement["kind"],
  geometry: Geometry | undefined,
): Geometry {
  return geometry ?? defaultGeometry(kind);
}

function defaultGeometry(kind: DiagramElement["kind"]): Geometry {
  switch (kind) {
    case "actor":
      // Paleta: actor 72×112 y caso 160×80. Esos factories exigen geometría.
      return { x: 0, y: 0, width: 72, height: 112 };
    case "use-case":
      return { x: 0, y: 0, width: 160, height: 80 };
    case "system-boundary":
      return copyGeometry(DEFAULT_BOUNDARY_GEOMETRY);
    case "lifeline":
      return copyGeometry(DEFAULT_LIFELINE_GEOMETRY);
    case "class":
      return copyGeometry(DEFAULT_CLASS_GEOMETRY);
    case "component":
      return copyGeometry(DEFAULT_COMPONENT_GEOMETRY);
    case "node":
      return copyGeometry(DEFAULT_NODE_GEOMETRY);
    case "artifact":
      return copyGeometry(DEFAULT_ARTIFACT_GEOMETRY);
    case "entity":
      return copyGeometry(DEFAULT_ENTITY_GEOMETRY);
    case "attribute":
      return copyGeometry(DEFAULT_ATTRIBUTE_GEOMETRY);
    case "er-relationship":
      return copyGeometry(DEFAULT_ER_RELATIONSHIP_GEOMETRY);
    case "action":
      return copyGeometry(DEFAULT_ACTION_GEOMETRY);
    case "interaction-occurrence":
      return copyGeometry(DEFAULT_INTERACTION_OCCURRENCE_GEOMETRY);
    case "initial-node":
      return copyGeometry(DEFAULT_INITIAL_NODE_GEOMETRY);
    case "activity-final":
      return copyGeometry(DEFAULT_ACTIVITY_FINAL_GEOMETRY);
    case "decision-node":
    case "merge-node":
      return copyGeometry(DEFAULT_DECISION_NODE_GEOMETRY);
    case "fork-node":
    case "join-node":
      return copyGeometry(DEFAULT_FORK_NODE_GEOMETRY);
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

function copyGeometry(geometry: Geometry): Geometry {
  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  };
}

function addedElementId(
  before: DiagramDocument,
  after: DiagramDocument,
): string | undefined {
  const ids = new Set(before.elements.map((element) => element.id));
  return after.elements.find((element) => !ids.has(element.id))?.id;
}

function applySteps(
  document: DiagramDocument,
  steps: readonly DocumentStep[],
): Result<DiagramDocument> {
  let current = document;
  for (const step of steps) {
    const next = step(current);
    if (!next.ok) {
      return next;
    }
    current = next.value;
  }
  return ok(current);
}

function decodeJson(input: unknown): Result<unknown> {
  if (typeof input !== "string") {
    return ok(input);
  }
  try {
    return ok(JSON.parse(input) as unknown);
  } catch {
    return err("UNKNOWN_KIND", INVALID_DOCUMENT_MESSAGE);
  }
}

function isValidTitle(title: string): boolean {
  return title.length >= NAME_MIN_LENGTH && title.length <= NAME_MAX_LENGTH;
}

function isDocumentKind(kind: string): kind is DocumentKind {
  return KIND_CATALOG.some((entry) => entry.kind === kind);
}

function isElementKind(kind: string): kind is DiagramElement["kind"] {
  return (ELEMENT_KINDS as readonly string[]).includes(kind);
}

function isRelationshipKind(kind: string): kind is RelationshipKind {
  return (RELATIONSHIP_KINDS as readonly string[]).includes(kind);
}
