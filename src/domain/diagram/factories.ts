import {
  CLASS_DOCUMENT_KIND,
  COMPONENT_DOCUMENT_KIND,
  DEFAULT_ASSOCIATION_MULTIPLICITY,
  DEFAULT_ARTIFACT_GEOMETRY,
  DEFAULT_BOUNDARY_GEOMETRY,
  DEFAULT_BOUNDARY_NAME,
  DEFAULT_CLASS_DOCUMENT_TITLE,
  DEFAULT_CLASS_GEOMETRY,
  DEFAULT_COMPONENT_DOCUMENT_TITLE,
  DEFAULT_COMPONENT_GEOMETRY,
  DEFAULT_DEPLOYMENT_DOCUMENT_TITLE,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_LIFELINE_GEOMETRY,
  DEFAULT_LIFELINE_STEM_LENGTH,
  DEFAULT_NODE_GEOMETRY,
  DEFAULT_SEQUENCE_DOCUMENT_TITLE,
  DEFAULT_VIEWPORT,
  DEPLOYMENT_DOCUMENT_KIND,
  DOCUMENT_KIND,
  SCHEMA_VERSION,
  SEQUENCE_DOCUMENT_KIND,
  STORAGE_VERSION,
} from "./defaults.ts";
import type {
  Actor,
  Anchor,
  Artifact,
  AssociationMultiplicity,
  ClassRelationship,
  ClassRelationshipKind,
  ComponentRelationship,
  ComponentRelationshipKind,
  DeploymentNode,
  DeploymentRelationship,
  DeploymentRelationshipKind,
  DiagramDocument,
  DocumentMetadata,
  Geometry,
  Lifeline,
  SequenceMessage,
  SequenceMessageKind,
  SystemBoundary,
  UmlClass,
  UmlComponent,
  UseCase,
  UseCaseRelationship,
  UseCaseRelationshipKind,
  Viewport,
  WorkspaceSnapshot,
} from "./model.ts";

export type IdFactory = () => string;
export type Clock = () => Date;

export type DiagramFactoryDeps = {
  createId?: IdFactory;
  now?: Clock;
};

export function createUuid(): string {
  return crypto.randomUUID();
}

function resolveCreateId(deps: DiagramFactoryDeps | undefined): IdFactory {
  return deps?.createId ?? createUuid;
}

function resolveIsoTimestamp(deps: DiagramFactoryDeps | undefined): string {
  const instant = deps?.now ? deps.now() : new Date();
  return instant.toISOString();
}

function copyGeometry(geometry: Geometry): Geometry {
  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  };
}

function copyMembers(members: readonly string[] | undefined): string[] {
  if (members === undefined) {
    return [];
  }
  return members
    .map((member) => member.trim())
    .filter((member) => member.length > 0);
}

export function createActor(
  input: { name: string; geometry: Geometry },
  deps?: DiagramFactoryDeps,
): Actor {
  return {
    id: resolveCreateId(deps)(),
    kind: "actor",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry),
  };
}

export function createUseCase(
  input: { name: string; geometry: Geometry; parentId?: string },
  deps?: DiagramFactoryDeps,
): UseCase {
  const useCase: UseCase = {
    id: resolveCreateId(deps)(),
    kind: "use-case",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry),
  };

  if (input.parentId !== undefined) {
    useCase.parentId = input.parentId;
  }

  return useCase;
}

export function createSystemBoundary(
  input: { name: string; geometry: Geometry },
  deps?: DiagramFactoryDeps,
): SystemBoundary {
  return {
    id: resolveCreateId(deps)(),
    kind: "system-boundary",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry),
  };
}

export function createLifeline(
  input: {
    name: string;
    geometry?: Geometry;
    stemLength?: number;
  },
  deps?: DiagramFactoryDeps,
): Lifeline {
  return {
    id: resolveCreateId(deps)(),
    kind: "lifeline",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry ?? DEFAULT_LIFELINE_GEOMETRY),
    stemLength: input.stemLength ?? DEFAULT_LIFELINE_STEM_LENGTH,
  };
}

export function createRelationship(
  input: {
    kind: UseCaseRelationshipKind;
    sourceId: string;
    targetId: string;
    sourceAnchor: Anchor;
    targetAnchor: Anchor;
  },
  deps?: DiagramFactoryDeps,
): UseCaseRelationship {
  return {
    id: resolveCreateId(deps)(),
    kind: input.kind,
    sourceId: input.sourceId,
    targetId: input.targetId,
    sourceAnchor: input.sourceAnchor,
    targetAnchor: input.targetAnchor,
  };
}

export function createSequenceMessage(
  input: {
    kind: SequenceMessageKind;
    sourceId: string;
    targetId: string;
    name?: string;
    y: number;
  },
  deps?: DiagramFactoryDeps,
): SequenceMessage {
  return {
    id: resolveCreateId(deps)(),
    kind: input.kind,
    sourceId: input.sourceId,
    targetId: input.targetId,
    name: input.name?.trim() ?? "",
    y: input.y,
  };
}

export function createClass(
  input: {
    name: string;
    geometry?: Geometry;
    attributes?: readonly string[];
    operations?: readonly string[];
  },
  deps?: DiagramFactoryDeps,
): UmlClass {
  return {
    id: resolveCreateId(deps)(),
    kind: "class",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry ?? DEFAULT_CLASS_GEOMETRY),
    attributes: copyMembers(input.attributes),
    operations: copyMembers(input.operations),
  };
}

export function createClassRelationship(
  input: {
    kind: ClassRelationshipKind;
    sourceId: string;
    targetId: string;
    name?: string;
    sourceMultiplicity?: AssociationMultiplicity;
    targetMultiplicity?: AssociationMultiplicity;
  },
  deps?: DiagramFactoryDeps,
): ClassRelationship {
  const shared = {
    id: resolveCreateId(deps)(),
    sourceId: input.sourceId,
    targetId: input.targetId,
    name: input.name?.trim() ?? "",
  };

  if (input.kind === "generalization") {
    return {
      ...shared,
      kind: "generalization",
    };
  }

  return {
    ...shared,
    kind: input.kind,
    sourceMultiplicity:
      input.sourceMultiplicity ?? DEFAULT_ASSOCIATION_MULTIPLICITY,
    targetMultiplicity:
      input.targetMultiplicity ?? DEFAULT_ASSOCIATION_MULTIPLICITY,
  };
}

export function createComponent(
  input: {
    name: string;
    geometry?: Geometry;
  },
  deps?: DiagramFactoryDeps,
): UmlComponent {
  return {
    id: resolveCreateId(deps)(),
    kind: "component",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry ?? DEFAULT_COMPONENT_GEOMETRY),
  };
}

export function createComponentRelationship(
  input: {
    kind: ComponentRelationshipKind;
    sourceId: string;
    targetId: string;
    name?: string;
  },
  deps?: DiagramFactoryDeps,
): ComponentRelationship {
  return {
    id: resolveCreateId(deps)(),
    kind: input.kind,
    sourceId: input.sourceId,
    targetId: input.targetId,
    name: input.name?.trim() ?? "",
  };
}

export function createNode(
  input: {
    name: string;
    geometry?: Geometry;
  },
  deps?: DiagramFactoryDeps,
): DeploymentNode {
  return {
    id: resolveCreateId(deps)(),
    kind: "node",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry ?? DEFAULT_NODE_GEOMETRY),
  };
}

export function createArtifact(
  input: {
    name: string;
    geometry?: Geometry;
  },
  deps?: DiagramFactoryDeps,
): Artifact {
  return {
    id: resolveCreateId(deps)(),
    kind: "artifact",
    name: input.name.trim(),
    geometry: copyGeometry(input.geometry ?? DEFAULT_ARTIFACT_GEOMETRY),
  };
}

export function createDeploymentRelationship(
  input: {
    kind: DeploymentRelationshipKind;
    sourceId: string;
    targetId: string;
    name?: string;
  },
  deps?: DiagramFactoryDeps,
): DeploymentRelationship {
  return {
    id: resolveCreateId(deps)(),
    kind: input.kind,
    sourceId: input.sourceId,
    targetId: input.targetId,
    name: input.name?.trim() ?? "",
  };
}

export function createDocumentMetadata(
  input: { title?: string } = {},
  deps?: DiagramFactoryDeps,
): DocumentMetadata {
  const timestamp = resolveIsoTimestamp(deps);
  const title = input.title?.trim() ?? DEFAULT_DOCUMENT_TITLE;

  return {
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createViewport(input: Viewport = DEFAULT_VIEWPORT): Viewport {
  return {
    x: input.x,
    y: input.y,
    zoom: input.zoom,
  };
}

export function createDiagramDocument(
  deps?: DiagramFactoryDeps,
): DiagramDocument {
  const createId = resolveCreateId(deps);

  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId(),
    kind: DOCUMENT_KIND,
    metadata: createDocumentMetadata({}, deps),
    elements: [
      createSystemBoundary(
        {
          name: DEFAULT_BOUNDARY_NAME,
          geometry: DEFAULT_BOUNDARY_GEOMETRY,
        },
        { createId },
      ),
    ],
    relationships: [],
  };
}

export function createEmptySequenceDocument(
  deps?: DiagramFactoryDeps,
): DiagramDocument {
  const createId = resolveCreateId(deps);

  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId(),
    kind: SEQUENCE_DOCUMENT_KIND,
    metadata: createDocumentMetadata(
      { title: DEFAULT_SEQUENCE_DOCUMENT_TITLE },
      deps,
    ),
    elements: [],
    relationships: [],
  };
}

export function createEmptyClassDocument(
  deps?: DiagramFactoryDeps,
): DiagramDocument {
  const createId = resolveCreateId(deps);

  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId(),
    kind: CLASS_DOCUMENT_KIND,
    metadata: createDocumentMetadata(
      { title: DEFAULT_CLASS_DOCUMENT_TITLE },
      deps,
    ),
    elements: [],
    relationships: [],
  };
}

export function createEmptyComponentDocument(
  deps?: DiagramFactoryDeps,
): DiagramDocument {
  const createId = resolveCreateId(deps);

  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId(),
    kind: COMPONENT_DOCUMENT_KIND,
    metadata: createDocumentMetadata(
      { title: DEFAULT_COMPONENT_DOCUMENT_TITLE },
      deps,
    ),
    elements: [],
    relationships: [],
  };
}

export function createEmptyDeploymentDocument(
  deps?: DiagramFactoryDeps,
): DiagramDocument {
  const createId = resolveCreateId(deps);

  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId(),
    kind: DEPLOYMENT_DOCUMENT_KIND,
    metadata: createDocumentMetadata(
      { title: DEFAULT_DEPLOYMENT_DOCUMENT_TITLE },
      deps,
    ),
    elements: [],
    relationships: [],
  };
}

export function createWorkspaceSnapshot(
  deps?: DiagramFactoryDeps,
): WorkspaceSnapshot {
  const document = createDiagramDocument(deps);
  return {
    storageVersion: STORAGE_VERSION,
    activeDocumentId: document.id,
    documents: [{ document, view: createViewport() }],
  };
}
