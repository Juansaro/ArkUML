import {
  DEFAULT_BOUNDARY_GEOMETRY,
  DEFAULT_BOUNDARY_NAME,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_LIFELINE_GEOMETRY,
  DEFAULT_LIFELINE_STEM_LENGTH,
  DEFAULT_SEQUENCE_DOCUMENT_TITLE,
  DEFAULT_VIEWPORT,
  DOCUMENT_KIND,
  SCHEMA_VERSION,
  SEQUENCE_DOCUMENT_KIND,
  STORAGE_VERSION,
} from "./defaults.ts";
import type {
  Actor,
  Anchor,
  DiagramDocument,
  DocumentMetadata,
  Geometry,
  Lifeline,
  SequenceMessage,
  SequenceMessageKind,
  SystemBoundary,
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

export function createWorkspaceSnapshot(
  deps?: DiagramFactoryDeps,
): WorkspaceSnapshot {
  return {
    storageVersion: STORAGE_VERSION,
    document: createDiagramDocument(deps),
    view: createViewport(),
  };
}
