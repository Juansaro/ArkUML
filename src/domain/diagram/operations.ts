import {
  DEFAULT_ASSOCIATION_MULTIPLICITY,
  DEFAULT_ER_CARDINALITY,
  DUPLICATE_OFFSET,
  MIN_ACTION_HEIGHT,
  MIN_ACTION_WIDTH,
  MIN_ACTIVITY_FINAL_HEIGHT,
  MIN_ACTIVITY_FINAL_WIDTH,
  MIN_ARTIFACT_HEIGHT,
  MIN_ARTIFACT_WIDTH,
  MIN_ATTRIBUTE_HEIGHT,
  MIN_ATTRIBUTE_WIDTH,
  MIN_BOUNDARY_HEIGHT,
  MIN_BOUNDARY_WIDTH,
  MIN_CLASS_HEIGHT,
  MIN_CLASS_WIDTH,
  MIN_COMPONENT_HEIGHT,
  MIN_COMPONENT_WIDTH,
  MIN_DECISION_NODE_HEIGHT,
  MIN_DECISION_NODE_WIDTH,
  MIN_ENTITY_HEIGHT,
  MIN_ENTITY_WIDTH,
  MIN_ER_RELATIONSHIP_HEIGHT,
  MIN_ER_RELATIONSHIP_WIDTH,
  MIN_FORK_NODE_HEIGHT,
  MIN_FORK_NODE_WIDTH,
  MIN_INITIAL_NODE_HEIGHT,
  MIN_INITIAL_NODE_WIDTH,
  MIN_LIFELINE_HEIGHT,
  MIN_LIFELINE_STEM_LENGTH,
  MIN_LIFELINE_WIDTH,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} from "./defaults.ts";
import {
  createActor,
  createAction as buildAction,
  createActivityFinal as buildActivityFinal,
  createArtifact as buildArtifact,
  createAttribute as buildAttribute,
  createClass as buildClass,
  createClassRelationship as buildClassRelationship,
  createComponent as buildComponent,
  createComponentRelationship as buildComponentRelationship,
  createControlFlow as buildControlFlow,
  createDecisionNode as buildDecisionNode,
  createDeploymentRelationship as buildDeploymentRelationship,
  createEntity as buildEntity,
  createErLink as buildErLink,
  createErRelationship as buildErRelationship,
  createForkNode as buildForkNode,
  createInitialNode as buildInitialNode,
  createJoinNode as buildJoinNode,
  createLifeline as buildLifeline,
  createMergeNode as buildMergeNode,
  createNode as buildNode,
  createRelationship as buildRelationship,
  createSequenceMessage as buildSequenceMessage,
  createSystemBoundary,
  createUseCase,
  type DiagramFactoryDeps,
} from "./factories.ts";
import {
  err,
  isActivityControlNode,
  isActivityElement,
  isArtifact,
  isAssociationMultiplicity,
  isClassAssociation,
  isClassRelationship,
  isComponentRelationship,
  isControlFlow,
  isDeploymentNode,
  isDeploymentRelationship,
  isErAttribute,
  isErCardinality,
  isErEntity,
  isErLink,
  isErRelationshipElement,
  isGeneralization,
  isLifeline,
  isSequenceMessage,
  isUmlClass,
  isUmlComponent,
  isUseCaseRelationship,
  ok,
  type ActivityControlNodeKind,
  type Anchor,
  type AssociationMultiplicity,
  type ClassRelationshipKind,
  type ComponentRelationshipKind,
  type DeploymentRelationshipKind,
  type DiagramDocument,
  type DiagramElement,
  type ErAttribute,
  type ErCardinality,
  type Geometry,
  type Lifeline,
  type Result,
  type SequenceMessageKind,
  type SystemBoundary,
  type UmlClass,
  type UseCase,
  type UseCaseRelationshipKind,
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

export type CreateUseCaseRelationshipInput = {
  kind: UseCaseRelationshipKind;
  sourceId: string;
  targetId: string;
  sourceAnchor: Anchor;
  targetAnchor: Anchor;
};

export type CreateSequenceMessageInput = {
  kind: SequenceMessageKind;
  sourceId: string;
  targetId: string;
  name?: string;
  y: number;
};

export type CreateClassRelationshipInput = {
  kind: ClassRelationshipKind;
  sourceId: string;
  targetId: string;
  name?: string;
  sourceMultiplicity?: AssociationMultiplicity;
  targetMultiplicity?: AssociationMultiplicity;
};

export type CreateComponentRelationshipInput = {
  kind: ComponentRelationshipKind;
  sourceId: string;
  targetId: string;
  name?: string;
};

export type CreateDeploymentRelationshipInput = {
  kind: DeploymentRelationshipKind;
  sourceId: string;
  targetId: string;
  name?: string;
};

export type CreateErLinkInput = {
  kind: "er-link";
  sourceId: string;
  targetId: string;
  cardinality?: ErCardinality;
};

export type CreateControlFlowInput = {
  kind: "control-flow";
  sourceId: string;
  targetId: string;
  guard?: string;
};

export type CreateRelationshipInput =
  | CreateUseCaseRelationshipInput
  | CreateSequenceMessageInput
  | CreateClassRelationshipInput
  | CreateComponentRelationshipInput
  | CreateDeploymentRelationshipInput
  | CreateErLinkInput
  | CreateControlFlowInput;

export type ReconnectRelationshipInput = CreateUseCaseRelationshipInput & {
  id: string;
};

const INVALID_NAME_MESSAGE = "El nombre debe tener entre 1 y 80 caracteres.";
const INVALID_MESSAGE_NAME_MESSAGE =
  "El nombre debe tener como máximo 80 caracteres.";
const BOUNDARY_EXISTS_MESSAGE = "El documento ya tiene un SystemBoundary.";
const UNKNOWN_ELEMENT_MESSAGE = "No existe el elemento.";
const INVALID_PARENT_MESSAGE =
  "El padre debe ser un SystemBoundary del documento.";
const INVALID_GEOMETRY_MESSAGE = "La geometría debe usar números finitos.";
const BOUNDARY_SIZE_MESSAGE = "El SystemBoundary debe medir al menos 320×240.";
const LIFELINE_SIZE_MESSAGE =
  "La cabeza del lifeline debe medir al menos 80×32.";
const LIFELINE_STEM_MESSAGE = "stemLength debe ser al menos 80.";
const MESSAGE_Y_MESSAGE =
  "y no puede quedar dentro de la cabeza de origen ni de destino.";
const UNKNOWN_RELATIONSHIP_MESSAGE = "No existe la relación.";
const RESIZE_TARGET_MESSAGE = "Solo se puede redimensionar un SystemBoundary.";
const REPARENT_TARGET_MESSAGE = "Solo se puede reparentar un caso de uso.";
const SEQUENCE_ELEMENT_MESSAGE =
  "El documento de secuencia no admite este elemento.";
const CLASS_ELEMENT_MESSAGE = "El documento de clases no admite este elemento.";
const COMPONENT_ELEMENT_MESSAGE =
  "El documento de componentes no admite este elemento.";
const DEPLOYMENT_ELEMENT_MESSAGE =
  "El documento de despliegue no admite este elemento.";
const ER_ELEMENT_MESSAGE =
  "El documento entidad-relación no admite este elemento.";
const ACTIVITY_ELEMENT_MESSAGE =
  "El documento de actividades no admite este elemento.";
const USE_CASE_LIFELINE_MESSAGE =
  "El documento de casos de uso no admite lifelines.";
const USE_CASE_CLASS_MESSAGE = "El documento de casos de uso no admite clases.";
const USE_CASE_COMPONENT_MESSAGE =
  "El documento de casos de uso no admite componentes.";
const USE_CASE_DEPLOYMENT_MESSAGE =
  "El documento de casos de uso no admite nodos ni artefactos.";
const USE_CASE_ER_MESSAGE =
  "El documento de casos de uso no admite entidades, atributos ni rombos.";
const USE_CASE_ACTIVITY_MESSAGE =
  "El documento de casos de uso no admite nodos de actividad.";
const CLASS_DOCUMENT_MESSAGE =
  "Solo un documento de clases admite este elemento.";
const COMPONENT_DOCUMENT_MESSAGE =
  "Solo un documento de componentes admite este elemento.";
const DEPLOYMENT_DOCUMENT_MESSAGE =
  "Solo un documento de despliegue admite este elemento.";
const ER_DOCUMENT_MESSAGE =
  "Solo un documento entidad-relación admite este elemento.";
const ACTIVITY_DOCUMENT_MESSAGE =
  "Solo un documento de actividades admite este elemento.";
const RENAME_RELATIONSHIP_MESSAGE =
  "Solo se puede renombrar un mensaje de secuencia o una relación de clases, componentes o despliegue.";
const CLASS_SIZE_MESSAGE = "La clase debe medir al menos 120×72.";
const COMPONENT_SIZE_MESSAGE = "El componente debe medir al menos 120×72.";
const NODE_SIZE_MESSAGE = "El nodo debe medir al menos 120×72.";
const ARTIFACT_SIZE_MESSAGE = "El artefacto debe medir al menos 96×48.";
const ENTITY_SIZE_MESSAGE = "La entidad debe medir al menos 96×48.";
const ATTRIBUTE_SIZE_MESSAGE = "El atributo debe medir al menos 80×40.";
const ER_RELATIONSHIP_SIZE_MESSAGE =
  "La relación entidad-relación debe medir al menos 80×48.";
const ACTION_SIZE_MESSAGE = "La acción debe medir al menos 96×40.";
const INITIAL_NODE_SIZE_MESSAGE =
  "El nodo inicial debe medir al menos 16×16.";
const ACTIVITY_FINAL_SIZE_MESSAGE =
  "El nodo final debe medir al menos 20×20.";
const DECISION_NODE_SIZE_MESSAGE =
  "El nodo de decisión o fusión debe medir al menos 32×32.";
const FORK_NODE_SIZE_MESSAGE =
  "La barra de fork o join debe medir al menos 48×6.";
const RESIZE_TARGET_ELEMENT_MESSAGE =
  "Solo se puede redimensionar una clase, un componente, un nodo, un artefacto, una entidad, un atributo, un rombo o un nodo de actividad.";
const GENERALIZATION_ENDS_MESSAGE = "Generalization no admite multiplicidades.";
const ASSOCIATION_ENDS_MESSAGE =
  "Solo se pueden editar extremos de asociación, agregación o composición.";
const INVALID_MULTIPLICITY_MESSAGE =
  "La multiplicidad debe ser 0..1, 1, 0..* o 1..*.";
const ER_CARDINALITY_TARGET_MESSAGE =
  "Solo se puede fijar cardinalidad en un enlace entidad–relación.";
const ATTRIBUTE_CARDINALITY_MESSAGE =
  "Un enlace atributo–entidad no admite cardinalidad.";
const INVALID_ER_CARDINALITY_MESSAGE =
  "La cardinalidad debe ser 1 o N.";
const ATTRIBUTE_KEY_TARGET_MESSAGE =
  "Solo se puede marcar isKey en un atributo.";
const CONTROL_FLOW_GUARD_TARGET_MESSAGE =
  "Solo se puede fijar la guarda en un flujo de control.";
const MOVE_MESSAGE_TARGET_MESSAGE =
  "Solo se puede mover un mensaje de secuencia.";
const RECONNECT_MESSAGE_MESSAGE =
  "No se puede reconectar un mensaje de secuencia.";
const SEQUENCE_STEM_TARGET_MESSAGE =
  "Solo se puede ajustar el stem de un lifeline.";

export function createElement(
  document: DiagramDocument,
  input: CreateElementInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind === "sequence") {
    return err("UNKNOWN_KIND", SEQUENCE_ELEMENT_MESSAGE);
  }
  if (document.kind === "class") {
    return err("UNKNOWN_KIND", CLASS_ELEMENT_MESSAGE);
  }
  if (document.kind === "component") {
    return err("UNKNOWN_KIND", COMPONENT_ELEMENT_MESSAGE);
  }
  if (document.kind === "deployment") {
    return err("UNKNOWN_KIND", DEPLOYMENT_ELEMENT_MESSAGE);
  }
  if (document.kind === "entity-relationship") {
    return err("UNKNOWN_KIND", ER_ELEMENT_MESSAGE);
  }
  if (document.kind === "activity") {
    return err("UNKNOWN_KIND", ACTIVITY_ELEMENT_MESSAGE);
  }

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

export function createLifeline(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry; stemLength?: number },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "sequence") {
    return err("UNKNOWN_KIND", USE_CASE_LIFELINE_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = lifelineHeadSizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  const stemLength = input.stemLength;
  if (stemLength !== undefined) {
    const stemError = lifelineStemError(stemLength);
    if (stemError !== undefined) {
      return stemError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildLifeline(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
            ...(stemLength === undefined ? {} : { stemLength }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function createClass(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "class") {
    return err("UNKNOWN_KIND", CLASS_DOCUMENT_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = classSizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildClass(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function createComponent(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "component") {
    return err("UNKNOWN_KIND", COMPONENT_DOCUMENT_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = componentSizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildComponent(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function createNode(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "deployment") {
    return err("UNKNOWN_KIND", DEPLOYMENT_DOCUMENT_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = nodeSizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildNode(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function createArtifact(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "deployment") {
    return err("UNKNOWN_KIND", DEPLOYMENT_DOCUMENT_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = artifactSizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildArtifact(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function createEntity(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "entity-relationship") {
    return err("UNKNOWN_KIND", ER_DOCUMENT_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = entitySizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildEntity(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function createAttribute(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry; isKey?: boolean },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "entity-relationship") {
    return err("UNKNOWN_KIND", ER_DOCUMENT_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = attributeSizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildAttribute(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
            ...(input.isKey === true ? { isKey: true } : {}),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

export function createErRelationship(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "entity-relationship") {
    return err("UNKNOWN_KIND", ER_DOCUMENT_MESSAGE);
  }

  const name = normalizeName(input.name);
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = erRelationshipSizeError(geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  return commit(
    document,
    {
      elements: [
        ...document.elements,
        buildErRelationship(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

type CreateActivityNodeInput = {
  name?: string;
  geometry?: Geometry;
};

function createActivityNode(
  document: DiagramDocument,
  kind: "action" | ActivityControlNodeKind,
  input: CreateActivityNodeInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (document.kind !== "activity") {
    return err("UNKNOWN_KIND", ACTIVITY_DOCUMENT_MESSAGE);
  }

  const name =
    kind === "action"
      ? normalizeName(input.name ?? "")
      : normalizeMessageName(input.name ?? "");
  if (!name.ok) {
    return name;
  }

  const geometry = input.geometry;
  if (geometry !== undefined) {
    if (!isFiniteGeometry(geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }
    const sizeError = activityNodeSizeError(kind, geometry);
    if (sizeError !== undefined) {
      return sizeError;
    }
  }

  const built =
    kind === "action"
      ? buildAction(
          {
            name: name.value,
            ...(geometry === undefined ? {} : { geometry }),
          },
          deps,
        )
      : kind === "initial-node"
        ? buildInitialNode(
            {
              name: name.value,
              ...(geometry === undefined ? {} : { geometry }),
            },
            deps,
          )
        : kind === "activity-final"
          ? buildActivityFinal(
              {
                name: name.value,
                ...(geometry === undefined ? {} : { geometry }),
              },
              deps,
            )
          : kind === "decision-node"
            ? buildDecisionNode(
                {
                  name: name.value,
                  ...(geometry === undefined ? {} : { geometry }),
                },
                deps,
              )
            : kind === "merge-node"
              ? buildMergeNode(
                  {
                    name: name.value,
                    ...(geometry === undefined ? {} : { geometry }),
                  },
                  deps,
                )
              : kind === "fork-node"
                ? buildForkNode(
                    {
                      name: name.value,
                      ...(geometry === undefined ? {} : { geometry }),
                    },
                    deps,
                  )
                : buildJoinNode(
                    {
                      name: name.value,
                      ...(geometry === undefined ? {} : { geometry }),
                    },
                    deps,
                  );

  return commit(
    document,
    {
      elements: [...document.elements, built],
    },
    deps,
  );
}

export function createAction(
  document: DiagramDocument,
  input: { name: string; geometry?: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return createActivityNode(document, "action", input, deps);
}

export function createInitialNode(
  document: DiagramDocument,
  input: CreateActivityNodeInput = {},
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return createActivityNode(document, "initial-node", input, deps);
}

export function createActivityFinal(
  document: DiagramDocument,
  input: CreateActivityNodeInput = {},
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return createActivityNode(document, "activity-final", input, deps);
}

export function createDecisionNode(
  document: DiagramDocument,
  input: CreateActivityNodeInput = {},
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return createActivityNode(document, "decision-node", input, deps);
}

export function createMergeNode(
  document: DiagramDocument,
  input: CreateActivityNodeInput = {},
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return createActivityNode(document, "merge-node", input, deps);
}

export function createForkNode(
  document: DiagramDocument,
  input: CreateActivityNodeInput = {},
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return createActivityNode(document, "fork-node", input, deps);
}

export function createJoinNode(
  document: DiagramDocument,
  input: CreateActivityNodeInput = {},
  deps?: OperationDeps,
): Result<DiagramDocument> {
  return createActivityNode(document, "join-node", input, deps);
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

  const normalized = isActivityControlNode(element)
    ? normalizeMessageName(name)
    : normalizeName(name);
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

export function setClassMembers(
  document: DiagramDocument,
  input: {
    id: string;
    attributes: readonly string[];
    operations: readonly string[];
  },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const element = findElement(document, input.id);
  if (element === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }
  if (!isUmlClass(element)) {
    return err("UNKNOWN_KIND", CLASS_DOCUMENT_MESSAGE);
  }

  const attributes = normalizeMembers(input.attributes);
  if (!attributes.ok) {
    return attributes;
  }
  const operations = normalizeMembers(input.operations);
  if (!operations.ok) {
    return operations;
  }

  if (
    sameMembers(element.attributes, attributes.value) &&
    sameMembers(element.operations, operations.value)
  ) {
    return ok(document);
  }

  const next: UmlClass = {
    ...element,
    attributes: attributes.value,
    operations: operations.value,
  };
  return commit(
    document,
    {
      elements: replaceElement(document.elements, next),
    },
    deps,
  );
}

export function setAttributeKey(
  document: DiagramDocument,
  input: { id: string; isKey: boolean },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const element = findElement(document, input.id);
  if (element === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }
  if (!isErAttribute(element)) {
    return err("UNKNOWN_KIND", ATTRIBUTE_KEY_TARGET_MESSAGE);
  }

  const current = element.isKey === true;
  if (current === input.isKey) {
    return ok(document);
  }

  const next: ErAttribute = {
    id: element.id,
    kind: "attribute",
    name: element.name,
    geometry: copyGeometry(element.geometry),
  };
  if (input.isKey) {
    next.isKey = true;
  }

  return commit(
    document,
    {
      elements: replaceElement(document.elements, next),
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

export function resizeLifelineStem(
  document: DiagramDocument,
  input: { id: string; stemLength: number },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const element = findElement(document, input.id);
  if (element === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }
  if (!isLifeline(element)) {
    return err("INVALID_GEOMETRY", SEQUENCE_STEM_TARGET_MESSAGE);
  }
  const stemError = lifelineStemError(input.stemLength);
  if (stemError !== undefined) {
    return stemError;
  }
  if (element.stemLength === input.stemLength) {
    return ok(document);
  }

  const next: Lifeline = {
    ...element,
    stemLength: input.stemLength,
  };
  return commit(
    document,
    {
      elements: replaceElement(document.elements, next),
    },
    deps,
  );
}

export function resizeElement(
  document: DiagramDocument,
  input: { id: string; geometry: Geometry },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const element = findElement(document, input.id);
  if (element === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }
  if (
    !isUmlClass(element) &&
    !isUmlComponent(element) &&
    !isDeploymentNode(element) &&
    !isArtifact(element) &&
    !isErEntity(element) &&
    !isErAttribute(element) &&
    !isErRelationshipElement(element) &&
    !isActivityElement(element)
  ) {
    return err("INVALID_GEOMETRY", RESIZE_TARGET_ELEMENT_MESSAGE);
  }
  if (!isFiniteGeometry(input.geometry)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }
  const sizeError = isUmlClass(element)
    ? classSizeError(input.geometry)
    : isUmlComponent(element)
      ? componentSizeError(input.geometry)
      : isDeploymentNode(element)
        ? nodeSizeError(input.geometry)
        : isArtifact(element)
          ? artifactSizeError(input.geometry)
          : isErEntity(element)
            ? entitySizeError(input.geometry)
            : isErAttribute(element)
              ? attributeSizeError(input.geometry)
              : isErRelationshipElement(element)
                ? erRelationshipSizeError(input.geometry)
                : activityNodeSizeError(element.kind, input.geometry);
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

export type ElementCopy =
  | { kind: "actor"; name: string; geometry: Geometry }
  | { kind: "use-case"; name: string; geometry: Geometry; parentId?: string }
  | { kind: "lifeline"; name: string; geometry: Geometry; stemLength: number }
  | {
      kind: "class";
      name: string;
      geometry: Geometry;
      attributes: string[];
      operations: string[];
    }
  | { kind: "component"; name: string; geometry: Geometry }
  | { kind: "node"; name: string; geometry: Geometry }
  | { kind: "artifact"; name: string; geometry: Geometry }
  | { kind: "entity"; name: string; geometry: Geometry }
  | { kind: "attribute"; name: string; geometry: Geometry; isKey: boolean }
  | { kind: "er-relationship"; name: string; geometry: Geometry }
  | { kind: "action"; name: string; geometry: Geometry }
  | { kind: "initial-node"; name: string; geometry: Geometry }
  | { kind: "activity-final"; name: string; geometry: Geometry }
  | { kind: "decision-node"; name: string; geometry: Geometry }
  | { kind: "merge-node"; name: string; geometry: Geometry }
  | { kind: "fork-node"; name: string; geometry: Geometry }
  | { kind: "join-node"; name: string; geometry: Geometry };

export function snapshotDuplicableElements(
  document: DiagramDocument,
  elementIds: readonly string[],
): Result<readonly ElementCopy[]> {
  if (elementIds.length === 0) {
    return ok([]);
  }

  const byId = indexElements(document);
  const copies: ElementCopy[] = [];

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

    const geometry = copyGeometry(element.geometry);
    if (element.kind === "actor") {
      copies.push({ kind: "actor", name: element.name, geometry });
      continue;
    }
    if (element.kind === "lifeline") {
      copies.push({
        kind: "lifeline",
        name: element.name,
        geometry,
        stemLength: element.stemLength,
      });
      continue;
    }
    if (element.kind === "class") {
      copies.push({
        kind: "class",
        name: element.name,
        geometry,
        attributes: [...element.attributes],
        operations: [...element.operations],
      });
      continue;
    }
    if (element.kind === "component") {
      copies.push({
        kind: "component",
        name: element.name,
        geometry,
      });
      continue;
    }
    if (element.kind === "node") {
      copies.push({
        kind: "node",
        name: element.name,
        geometry,
      });
      continue;
    }
    if (element.kind === "artifact") {
      copies.push({
        kind: "artifact",
        name: element.name,
        geometry,
      });
      continue;
    }
    if (element.kind === "entity") {
      copies.push({
        kind: "entity",
        name: element.name,
        geometry,
      });
      continue;
    }
    if (element.kind === "attribute") {
      copies.push({
        kind: "attribute",
        name: element.name,
        geometry,
        isKey: element.isKey === true,
      });
      continue;
    }
    if (element.kind === "er-relationship") {
      copies.push({
        kind: "er-relationship",
        name: element.name,
        geometry,
      });
      continue;
    }
    if (isActivityElement(element)) {
      copies.push({
        kind: element.kind,
        name: element.name,
        geometry,
      });
      continue;
    }

    if (element.parentId !== undefined) {
      copies.push({
        kind: "use-case",
        name: element.name,
        geometry,
        parentId: element.parentId,
      });
    } else {
      copies.push({ kind: "use-case", name: element.name, geometry });
    }
  }

  return ok(copies);
}

export function insertElementCopies(
  document: DiagramDocument,
  copies: readonly ElementCopy[],
  offset: number,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (copies.length === 0) {
    return ok(document);
  }

  const created: DiagramElement[] = [];

  for (const copy of copies) {
    if (document.kind === "sequence" && copy.kind !== "lifeline") {
      return err("UNKNOWN_KIND", SEQUENCE_ELEMENT_MESSAGE);
    }
    if (document.kind === "class" && copy.kind !== "class") {
      return err("UNKNOWN_KIND", CLASS_ELEMENT_MESSAGE);
    }
    if (document.kind === "component" && copy.kind !== "component") {
      return err("UNKNOWN_KIND", COMPONENT_ELEMENT_MESSAGE);
    }
    if (
      document.kind === "deployment" &&
      copy.kind !== "node" &&
      copy.kind !== "artifact"
    ) {
      return err("UNKNOWN_KIND", DEPLOYMENT_ELEMENT_MESSAGE);
    }
    if (
      document.kind === "entity-relationship" &&
      copy.kind !== "entity" &&
      copy.kind !== "attribute" &&
      copy.kind !== "er-relationship"
    ) {
      return err("UNKNOWN_KIND", ER_ELEMENT_MESSAGE);
    }
    if (
      document.kind === "activity" &&
      copy.kind !== "action" &&
      copy.kind !== "initial-node" &&
      copy.kind !== "activity-final" &&
      copy.kind !== "decision-node" &&
      copy.kind !== "merge-node" &&
      copy.kind !== "fork-node" &&
      copy.kind !== "join-node"
    ) {
      return err("UNKNOWN_KIND", ACTIVITY_ELEMENT_MESSAGE);
    }
    if (
      document.kind === "use-case" &&
      copy.kind !== "actor" &&
      copy.kind !== "use-case"
    ) {
      return err(
        "UNKNOWN_KIND",
        copy.kind === "class"
          ? USE_CASE_CLASS_MESSAGE
          : copy.kind === "component"
            ? USE_CASE_COMPONENT_MESSAGE
            : copy.kind === "node" || copy.kind === "artifact"
              ? USE_CASE_DEPLOYMENT_MESSAGE
              : copy.kind === "entity" ||
                  copy.kind === "attribute" ||
                  copy.kind === "er-relationship"
                ? USE_CASE_ER_MESSAGE
                : copy.kind === "action" ||
                    copy.kind === "initial-node" ||
                    copy.kind === "activity-final" ||
                    copy.kind === "decision-node" ||
                    copy.kind === "merge-node" ||
                    copy.kind === "fork-node" ||
                    copy.kind === "join-node"
                  ? USE_CASE_ACTIVITY_MESSAGE
                  : USE_CASE_LIFELINE_MESSAGE,
      );
    }
    if (!isFiniteGeometry(copy.geometry)) {
      return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
    }

    const geometry = offsetGeometry(copy.geometry, offset);
    if (copy.kind === "actor") {
      created.push(createActor({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "lifeline") {
      created.push(
        buildLifeline(
          { name: copy.name, geometry, stemLength: copy.stemLength },
          deps,
        ),
      );
      continue;
    }
    if (copy.kind === "class") {
      created.push(
        buildClass(
          {
            name: copy.name,
            geometry,
            attributes: copy.attributes,
            operations: copy.operations,
          },
          deps,
        ),
      );
      continue;
    }
    if (copy.kind === "component") {
      created.push(
        buildComponent({ name: copy.name, geometry }, deps),
      );
      continue;
    }
    if (copy.kind === "node") {
      created.push(buildNode({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "artifact") {
      created.push(buildArtifact({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "entity") {
      created.push(buildEntity({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "attribute") {
      created.push(
        buildAttribute(
          {
            name: copy.name,
            geometry,
            ...(copy.isKey ? { isKey: true } : {}),
          },
          deps,
        ),
      );
      continue;
    }
    if (copy.kind === "er-relationship") {
      created.push(buildErRelationship({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "action") {
      created.push(buildAction({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "initial-node") {
      created.push(buildInitialNode({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "activity-final") {
      created.push(buildActivityFinal({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "decision-node") {
      created.push(buildDecisionNode({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "merge-node") {
      created.push(buildMergeNode({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "fork-node") {
      created.push(buildForkNode({ name: copy.name, geometry }, deps));
      continue;
    }
    if (copy.kind === "join-node") {
      created.push(buildJoinNode({ name: copy.name, geometry }, deps));
      continue;
    }

    const parentId = copy.parentId;
    if (parentId !== undefined) {
      const parent = findElement(document, parentId);
      if (parent !== undefined && parent.kind === "system-boundary") {
        created.push(
          createUseCase({ name: copy.name, geometry, parentId }, deps),
        );
        continue;
      }
    }

    created.push(createUseCase({ name: copy.name, geometry }, deps));
  }

  return commit(
    document,
    {
      elements: [...document.elements, ...created],
    },
    deps,
  );
}

export function duplicateElements(
  document: DiagramDocument,
  elementIds: readonly string[],
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const snapshot = snapshotDuplicableElements(document, elementIds);
  if (!snapshot.ok) {
    return snapshot;
  }
  return insertElementCopies(document, snapshot.value, DUPLICATE_OFFSET, deps);
}

export function createRelationship(
  document: DiagramDocument,
  input: CreateRelationshipInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  if (isClassRelationshipInput(input)) {
    return createClassDiagramRelationship(document, input, deps);
  }
  if (isComponentRelationshipInput(input)) {
    return createComponentDiagramRelationship(document, input, deps);
  }
  if (isDeploymentRelationshipInput(input)) {
    return createDeploymentDiagramRelationship(document, input, deps);
  }
  if (isErLinkInput(input)) {
    return createErDiagramLink(document, input, deps);
  }
  if (isControlFlowInput(input)) {
    return createActivityControlFlow(document, input, deps);
  }
  if (isSequenceMessageInput(input)) {
    return createSequenceRelationship(document, input, deps);
  }

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
            kind: input.kind,
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

export function reconnectRelationship(
  document: DiagramDocument,
  input: ReconnectRelationshipInput,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === input.id,
  );
  if (existing === undefined) {
    return err("UNKNOWN_RELATIONSHIP", UNKNOWN_RELATIONSHIP_MESSAGE);
  }
  if (!isUseCaseRelationship(existing)) {
    return err("INVALID_CONNECTION", RECONNECT_MESSAGE_MESSAGE);
  }

  const withoutCurrent: DiagramDocument = {
    ...document,
    relationships: document.relationships.filter(
      (relationship) => relationship.id !== input.id,
    ),
  };
  const allowed = canConnect(withoutCurrent, {
    kind: existing.kind,
    sourceId: input.sourceId,
    targetId: input.targetId,
  });
  if (!allowed.ok) {
    return allowed;
  }

  const swapped =
    allowed.value.sourceId !== input.sourceId ||
    allowed.value.targetId !== input.targetId;
  const sourceAnchor = swapped ? input.targetAnchor : input.sourceAnchor;
  const targetAnchor = swapped ? input.sourceAnchor : input.targetAnchor;

  if (
    existing.sourceId === allowed.value.sourceId &&
    existing.targetId === allowed.value.targetId &&
    existing.sourceAnchor === sourceAnchor &&
    existing.targetAnchor === targetAnchor
  ) {
    return ok(document);
  }

  return commit(
    document,
    {
      relationships: document.relationships.map((relationship) => {
        if (relationship.id !== input.id) {
          return relationship;
        }
        return {
          ...relationship,
          sourceId: allowed.value.sourceId,
          targetId: allowed.value.targetId,
          sourceAnchor,
          targetAnchor,
        };
      }),
    },
    deps,
  );
}

export function setAssociationEnds(
  document: DiagramDocument,
  input: {
    id: string;
    sourceMultiplicity: AssociationMultiplicity;
    targetMultiplicity: AssociationMultiplicity;
  },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === input.id,
  );
  if (existing === undefined) {
    return err("UNKNOWN_RELATIONSHIP", UNKNOWN_RELATIONSHIP_MESSAGE);
  }
  if (isGeneralization(existing)) {
    return err("INVALID_CONNECTION", GENERALIZATION_ENDS_MESSAGE);
  }
  if (!isClassAssociation(existing)) {
    return err("INVALID_CONNECTION", ASSOCIATION_ENDS_MESSAGE);
  }
  if (
    !isAssociationMultiplicity(input.sourceMultiplicity) ||
    !isAssociationMultiplicity(input.targetMultiplicity)
  ) {
    return err("INVALID_CONNECTION", INVALID_MULTIPLICITY_MESSAGE);
  }
  if (
    existing.sourceMultiplicity === input.sourceMultiplicity &&
    existing.targetMultiplicity === input.targetMultiplicity
  ) {
    return ok(document);
  }

  return commit(
    document,
    {
      relationships: document.relationships.map((relationship) =>
        relationship.id === input.id
          ? {
              ...existing,
              sourceMultiplicity: input.sourceMultiplicity,
              targetMultiplicity: input.targetMultiplicity,
            }
          : relationship,
      ),
    },
    deps,
  );
}

export function setErCardinality(
  document: DiagramDocument,
  input: { id: string; cardinality: ErCardinality },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === input.id,
  );
  if (existing === undefined) {
    return err("UNKNOWN_RELATIONSHIP", UNKNOWN_RELATIONSHIP_MESSAGE);
  }
  if (!isErLink(existing)) {
    return err("INVALID_CONNECTION", ER_CARDINALITY_TARGET_MESSAGE);
  }
  if (!isErCardinality(input.cardinality)) {
    return err("INVALID_CONNECTION", INVALID_ER_CARDINALITY_MESSAGE);
  }

  const byId = indexElements(document);
  const source = byId.get(existing.sourceId);
  const target = byId.get(existing.targetId);
  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  const attributeEntity =
    (isErAttribute(source) && isErEntity(target)) ||
    (isErEntity(source) && isErAttribute(target));
  if (attributeEntity) {
    return err("INVALID_CONNECTION", ATTRIBUTE_CARDINALITY_MESSAGE);
  }

  const entityRombo =
    (isErEntity(source) && isErRelationshipElement(target)) ||
    (isErRelationshipElement(source) && isErEntity(target));
  if (!entityRombo) {
    return err("INVALID_CONNECTION", ER_CARDINALITY_TARGET_MESSAGE);
  }

  if (existing.cardinality === input.cardinality) {
    return ok(document);
  }

  return commit(
    document,
    {
      relationships: document.relationships.map((relationship) =>
        relationship.id === input.id
          ? { ...existing, cardinality: input.cardinality }
          : relationship,
      ),
    },
    deps,
  );
}

export function setControlFlowGuard(
  document: DiagramDocument,
  input: { id: string; guard: string },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === input.id,
  );
  if (existing === undefined) {
    return err("UNKNOWN_RELATIONSHIP", UNKNOWN_RELATIONSHIP_MESSAGE);
  }
  if (!isControlFlow(existing)) {
    return err("INVALID_CONNECTION", CONTROL_FLOW_GUARD_TARGET_MESSAGE);
  }

  const guard = normalizeMessageName(input.guard);
  if (!guard.ok) {
    return guard;
  }
  if (existing.guard === guard.value) {
    return ok(document);
  }

  return commit(
    document,
    {
      relationships: document.relationships.map((relationship) =>
        relationship.id === input.id
          ? { ...existing, guard: guard.value }
          : relationship,
      ),
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

export function renameRelationship(
  document: DiagramDocument,
  relationshipId: string,
  name: string,
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === relationshipId,
  );
  if (existing === undefined) {
    return err("UNKNOWN_RELATIONSHIP", UNKNOWN_RELATIONSHIP_MESSAGE);
  }
  if (isClassRelationship(existing)) {
    const normalized = normalizeMessageName(name);
    if (!normalized.ok) {
      return normalized;
    }
    if (existing.name === normalized.value) {
      return ok(document);
    }
    return commit(
      document,
      {
        relationships: document.relationships.map((relationship) =>
          relationship.id === relationshipId
            ? { ...existing, name: normalized.value }
            : relationship,
        ),
      },
      deps,
    );
  }
  if (isComponentRelationship(existing)) {
    const normalized = normalizeMessageName(name);
    if (!normalized.ok) {
      return normalized;
    }
    if (existing.name === normalized.value) {
      return ok(document);
    }
    return commit(
      document,
      {
        relationships: document.relationships.map((relationship) =>
          relationship.id === relationshipId
            ? { ...existing, name: normalized.value }
            : relationship,
        ),
      },
      deps,
    );
  }
  if (isDeploymentRelationship(existing)) {
    const normalized = normalizeMessageName(name);
    if (!normalized.ok) {
      return normalized;
    }
    if (existing.name === normalized.value) {
      return ok(document);
    }
    return commit(
      document,
      {
        relationships: document.relationships.map((relationship) =>
          relationship.id === relationshipId
            ? { ...existing, name: normalized.value }
            : relationship,
        ),
      },
      deps,
    );
  }
  if (!isSequenceMessage(existing)) {
    return err("UNKNOWN_KIND", RENAME_RELATIONSHIP_MESSAGE);
  }

  const normalized = normalizeMessageName(name);
  if (!normalized.ok) {
    return normalized;
  }
  if (existing.name === normalized.value) {
    return ok(document);
  }

  return commit(
    document,
    {
      relationships: document.relationships.map((relationship) =>
        relationship.id === relationshipId
          ? { ...existing, name: normalized.value }
          : relationship,
      ),
    },
    deps,
  );
}

export function moveMessage(
  document: DiagramDocument,
  input: { id: string; y: number },
  deps?: OperationDeps,
): Result<DiagramDocument> {
  const existing = document.relationships.find(
    (relationship) => relationship.id === input.id,
  );
  if (existing === undefined) {
    return err("UNKNOWN_RELATIONSHIP", UNKNOWN_RELATIONSHIP_MESSAGE);
  }
  if (!isSequenceMessage(existing)) {
    return err("INVALID_GEOMETRY", MOVE_MESSAGE_TARGET_MESSAGE);
  }

  const yError = messageYError(
    document,
    existing.sourceId,
    existing.targetId,
    input.y,
  );
  if (yError !== undefined) {
    return yError;
  }
  if (existing.y === input.y) {
    return ok(document);
  }

  return commit(
    document,
    {
      relationships: document.relationships.map((relationship) =>
        relationship.id === input.id
          ? { ...existing, y: input.y }
          : relationship,
      ),
    },
    deps,
  );
}

function createSequenceRelationship(
  document: DiagramDocument,
  input: CreateSequenceMessageInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const name = normalizeMessageName(input.name ?? "");
  if (!name.ok) {
    return name;
  }

  const allowed = canConnect(document, input);
  if (!allowed.ok) {
    return allowed;
  }

  const yError = messageYError(
    document,
    allowed.value.sourceId,
    allowed.value.targetId,
    input.y,
  );
  if (yError !== undefined) {
    return yError;
  }

  return commit(
    document,
    {
      relationships: [
        ...document.relationships,
        buildSequenceMessage(
          {
            kind: input.kind,
            sourceId: allowed.value.sourceId,
            targetId: allowed.value.targetId,
            name: name.value,
            y: input.y,
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

function isSequenceMessageInput(
  input: CreateRelationshipInput,
): input is CreateSequenceMessageInput {
  return input.kind === "sync-message" || input.kind === "reply-message";
}

function isClassRelationshipInput(
  input: CreateRelationshipInput,
): input is CreateClassRelationshipInput {
  return (
    input.kind === "class-association" ||
    input.kind === "aggregation" ||
    input.kind === "composition" ||
    input.kind === "generalization"
  );
}

function isComponentRelationshipInput(
  input: CreateRelationshipInput,
): input is CreateComponentRelationshipInput {
  return (
    input.kind === "component-usage" || input.kind === "assembly-connector"
  );
}

function isDeploymentRelationshipInput(
  input: CreateRelationshipInput,
): input is CreateDeploymentRelationshipInput {
  return input.kind === "communication-path" || input.kind === "deploy";
}

function isErLinkInput(
  input: CreateRelationshipInput,
): input is CreateErLinkInput {
  return input.kind === "er-link";
}

function isControlFlowInput(
  input: CreateRelationshipInput,
): input is CreateControlFlowInput {
  return input.kind === "control-flow";
}

function createClassDiagramRelationship(
  document: DiagramDocument,
  input: CreateClassRelationshipInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const name = normalizeMessageName(input.name ?? "");
  if (!name.ok) {
    return name;
  }

  if (input.kind === "generalization") {
    if (
      input.sourceMultiplicity !== undefined ||
      input.targetMultiplicity !== undefined
    ) {
      return err("INVALID_CONNECTION", GENERALIZATION_ENDS_MESSAGE);
    }
  } else {
    if (
      (input.sourceMultiplicity !== undefined &&
        !isAssociationMultiplicity(input.sourceMultiplicity)) ||
      (input.targetMultiplicity !== undefined &&
        !isAssociationMultiplicity(input.targetMultiplicity))
    ) {
      return err("INVALID_CONNECTION", INVALID_MULTIPLICITY_MESSAGE);
    }
  }

  const allowed = canConnect(document, input);
  if (!allowed.ok) {
    return allowed;
  }

  return commit(
    document,
    {
      relationships: [
        ...document.relationships,
        buildClassRelationship(
          {
            kind: input.kind,
            sourceId: allowed.value.sourceId,
            targetId: allowed.value.targetId,
            name: name.value,
            ...(input.kind === "generalization"
              ? {}
              : {
                  sourceMultiplicity:
                    input.sourceMultiplicity ??
                    DEFAULT_ASSOCIATION_MULTIPLICITY,
                  targetMultiplicity:
                    input.targetMultiplicity ??
                    DEFAULT_ASSOCIATION_MULTIPLICITY,
                }),
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

function createComponentDiagramRelationship(
  document: DiagramDocument,
  input: CreateComponentRelationshipInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const name = normalizeMessageName(input.name ?? "");
  if (!name.ok) {
    return name;
  }

  const allowed = canConnect(document, input);
  if (!allowed.ok) {
    return allowed;
  }

  return commit(
    document,
    {
      relationships: [
        ...document.relationships,
        buildComponentRelationship(
          {
            kind: input.kind,
            sourceId: allowed.value.sourceId,
            targetId: allowed.value.targetId,
            name: name.value,
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

function createDeploymentDiagramRelationship(
  document: DiagramDocument,
  input: CreateDeploymentRelationshipInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const name = normalizeMessageName(input.name ?? "");
  if (!name.ok) {
    return name;
  }

  const allowed = canConnect(document, input);
  if (!allowed.ok) {
    return allowed;
  }

  return commit(
    document,
    {
      relationships: [
        ...document.relationships,
        buildDeploymentRelationship(
          {
            kind: input.kind,
            sourceId: allowed.value.sourceId,
            targetId: allowed.value.targetId,
            name: name.value,
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

function createErDiagramLink(
  document: DiagramDocument,
  input: CreateErLinkInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const allowed = canConnect(document, input);
  if (!allowed.ok) {
    return allowed;
  }

  const byId = indexElements(document);
  const source = byId.get(allowed.value.sourceId);
  const target = byId.get(allowed.value.targetId);
  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }

  const attributeEntity =
    (isErAttribute(source) && isErEntity(target)) ||
    (isErEntity(source) && isErAttribute(target));
  const entityRombo =
    (isErEntity(source) && isErRelationshipElement(target)) ||
    (isErRelationshipElement(source) && isErEntity(target));

  if (attributeEntity) {
    if (input.cardinality !== undefined) {
      return err("INVALID_CONNECTION", ATTRIBUTE_CARDINALITY_MESSAGE);
    }
    return commit(
      document,
      {
        relationships: [
          ...document.relationships,
          buildErLink(
            {
              sourceId: allowed.value.sourceId,
              targetId: allowed.value.targetId,
            },
            deps,
          ),
        ],
      },
      deps,
    );
  }

  if (!entityRombo) {
    return err("INVALID_CONNECTION", ER_CARDINALITY_TARGET_MESSAGE);
  }

  if (
    input.cardinality !== undefined &&
    !isErCardinality(input.cardinality)
  ) {
    return err("INVALID_CONNECTION", INVALID_ER_CARDINALITY_MESSAGE);
  }

  return commit(
    document,
    {
      relationships: [
        ...document.relationships,
        buildErLink(
          {
            sourceId: allowed.value.sourceId,
            targetId: allowed.value.targetId,
            cardinality: input.cardinality ?? DEFAULT_ER_CARDINALITY,
          },
          deps,
        ),
      ],
    },
    deps,
  );
}

function createActivityControlFlow(
  document: DiagramDocument,
  input: CreateControlFlowInput,
  deps: OperationDeps | undefined,
): Result<DiagramDocument> {
  const guard = normalizeMessageName(input.guard ?? "");
  if (!guard.ok) {
    return guard;
  }

  const allowed = canConnect(document, input);
  if (!allowed.ok) {
    return allowed;
  }

  return commit(
    document,
    {
      relationships: [
        ...document.relationships,
        buildControlFlow(
          {
            sourceId: allowed.value.sourceId,
            targetId: allowed.value.targetId,
            guard: guard.value,
          },
          deps,
        ),
      ],
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

function normalizeMessageName(name: string): Result<string> {
  const trimmed = name.trim();
  if (trimmed.length > NAME_MAX_LENGTH) {
    return err("INVALID_NAME", INVALID_MESSAGE_NAME_MESSAGE);
  }
  return ok(trimmed);
}

function normalizeMembers(members: readonly string[]): Result<string[]> {
  const next: string[] = [];
  for (const member of members) {
    const trimmed = member.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      return err("INVALID_NAME", INVALID_MESSAGE_NAME_MESSAGE);
    }
    next.push(trimmed);
  }
  return ok(next);
}

function sameMembers(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
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

function lifelineHeadSizeError(geometry: Geometry): Result<never> | undefined {
  if (
    geometry.width < MIN_LIFELINE_WIDTH ||
    geometry.height < MIN_LIFELINE_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", LIFELINE_SIZE_MESSAGE);
  }
  return undefined;
}

function classSizeError(geometry: Geometry): Result<never> | undefined {
  if (geometry.width < MIN_CLASS_WIDTH || geometry.height < MIN_CLASS_HEIGHT) {
    return err("INVALID_GEOMETRY", CLASS_SIZE_MESSAGE);
  }
  return undefined;
}

function componentSizeError(geometry: Geometry): Result<never> | undefined {
  if (
    geometry.width < MIN_COMPONENT_WIDTH ||
    geometry.height < MIN_COMPONENT_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", COMPONENT_SIZE_MESSAGE);
  }
  return undefined;
}

function nodeSizeError(geometry: Geometry): Result<never> | undefined {
  if (geometry.width < MIN_NODE_WIDTH || geometry.height < MIN_NODE_HEIGHT) {
    return err("INVALID_GEOMETRY", NODE_SIZE_MESSAGE);
  }
  return undefined;
}

function artifactSizeError(geometry: Geometry): Result<never> | undefined {
  if (
    geometry.width < MIN_ARTIFACT_WIDTH ||
    geometry.height < MIN_ARTIFACT_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", ARTIFACT_SIZE_MESSAGE);
  }
  return undefined;
}

function entitySizeError(geometry: Geometry): Result<never> | undefined {
  if (
    geometry.width < MIN_ENTITY_WIDTH ||
    geometry.height < MIN_ENTITY_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", ENTITY_SIZE_MESSAGE);
  }
  return undefined;
}

function attributeSizeError(geometry: Geometry): Result<never> | undefined {
  if (
    geometry.width < MIN_ATTRIBUTE_WIDTH ||
    geometry.height < MIN_ATTRIBUTE_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", ATTRIBUTE_SIZE_MESSAGE);
  }
  return undefined;
}

function erRelationshipSizeError(
  geometry: Geometry,
): Result<never> | undefined {
  if (
    geometry.width < MIN_ER_RELATIONSHIP_WIDTH ||
    geometry.height < MIN_ER_RELATIONSHIP_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", ER_RELATIONSHIP_SIZE_MESSAGE);
  }
  return undefined;
}

function activityNodeSizeError(
  kind: "action" | ActivityControlNodeKind,
  geometry: Geometry,
): Result<never> | undefined {
  if (kind === "action") {
    if (
      geometry.width < MIN_ACTION_WIDTH ||
      geometry.height < MIN_ACTION_HEIGHT
    ) {
      return err("INVALID_GEOMETRY", ACTION_SIZE_MESSAGE);
    }
    return undefined;
  }
  if (kind === "initial-node") {
    if (
      geometry.width < MIN_INITIAL_NODE_WIDTH ||
      geometry.height < MIN_INITIAL_NODE_HEIGHT
    ) {
      return err("INVALID_GEOMETRY", INITIAL_NODE_SIZE_MESSAGE);
    }
    return undefined;
  }
  if (kind === "activity-final") {
    if (
      geometry.width < MIN_ACTIVITY_FINAL_WIDTH ||
      geometry.height < MIN_ACTIVITY_FINAL_HEIGHT
    ) {
      return err("INVALID_GEOMETRY", ACTIVITY_FINAL_SIZE_MESSAGE);
    }
    return undefined;
  }
  if (kind === "decision-node" || kind === "merge-node") {
    if (
      geometry.width < MIN_DECISION_NODE_WIDTH ||
      geometry.height < MIN_DECISION_NODE_HEIGHT
    ) {
      return err("INVALID_GEOMETRY", DECISION_NODE_SIZE_MESSAGE);
    }
    return undefined;
  }
  if (
    geometry.width < MIN_FORK_NODE_WIDTH ||
    geometry.height < MIN_FORK_NODE_HEIGHT
  ) {
    return err("INVALID_GEOMETRY", FORK_NODE_SIZE_MESSAGE);
  }
  return undefined;
}

function lifelineStemError(stemLength: number): Result<never> | undefined {
  if (!Number.isFinite(stemLength)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }
  if (stemLength < MIN_LIFELINE_STEM_LENGTH) {
    return err("INVALID_GEOMETRY", LIFELINE_STEM_MESSAGE);
  }
  return undefined;
}

function messageYError(
  document: DiagramDocument,
  sourceId: string,
  targetId: string,
  y: number,
): Result<never> | undefined {
  if (!Number.isFinite(y)) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }

  const source = findElement(document, sourceId);
  const target = findElement(document, targetId);
  if (source === undefined || target === undefined) {
    return err("UNKNOWN_ELEMENT", UNKNOWN_ELEMENT_MESSAGE);
  }
  if (!isLifeline(source) || !isLifeline(target)) {
    return err("INVALID_CONNECTION", SEQUENCE_ELEMENT_MESSAGE);
  }
  if (
    !isFiniteGeometry(source.geometry) ||
    !isFiniteGeometry(target.geometry)
  ) {
    return err("INVALID_GEOMETRY", INVALID_GEOMETRY_MESSAGE);
  }

  const sourceBottom = source.geometry.y + source.geometry.height;
  const targetBottom = target.geometry.y + target.geometry.height;
  if (y < sourceBottom || y < targetBottom) {
    return err("INVALID_GEOMETRY", MESSAGE_Y_MESSAGE);
  }
  return undefined;
}
