export const DOMAIN_ERROR_CODES = [
  "INVALID_NAME",
  "BOUNDARY_EXISTS",
  "UNKNOWN_ELEMENT",
  "UNKNOWN_KIND",
  "INVALID_PARENT",
  "INVALID_GEOMETRY",
  "INVALID_CONNECTION",
  "DUPLICATE_RELATIONSHIP",
  "SELF_RELATIONSHIP",
  "UNKNOWN_RELATIONSHIP",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export type DomainError = {
  code: DomainErrorCode;
  message: string;
};

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: DomainError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(
  code: DomainErrorCode,
  message: string,
): Result<T> {
  return { ok: false, error: { code, message } };
}

export type Anchor = "top" | "right" | "bottom" | "left";

export type Geometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Actor = {
  id: string;
  kind: "actor";
  name: string;
  geometry: Geometry;
};

export type UseCase = {
  id: string;
  kind: "use-case";
  name: string;
  geometry: Geometry;
  parentId?: string;
};

export type SystemBoundary = {
  id: string;
  kind: "system-boundary";
  name: string;
  geometry: Geometry;
};

export type Lifeline = {
  id: string;
  kind: "lifeline";
  name: string;
  geometry: Geometry;
  stemLength: number;
};

export type UseCaseElement = Actor | UseCase | SystemBoundary;

export type DiagramElement = UseCaseElement | Lifeline;

export type UseCaseRelationshipKind = "association" | "include" | "extend";

export type SequenceMessageKind = "sync-message" | "reply-message";

export type RelationshipKind = UseCaseRelationshipKind | SequenceMessageKind;

export type UseCaseRelationship = {
  id: string;
  kind: UseCaseRelationshipKind;
  sourceId: string;
  targetId: string;
  sourceAnchor: Anchor;
  targetAnchor: Anchor;
};

export type SequenceMessage = {
  id: string;
  kind: SequenceMessageKind;
  sourceId: string;
  targetId: string;
  name: string;
  y: number;
};

export type Relationship = UseCaseRelationship | SequenceMessage;

export type DocumentMetadata = {
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentKind = "use-case" | "sequence";

export type DiagramDocumentV1 = {
  schemaVersion: 1;
  id: string;
  kind: "use-case";
  metadata: DocumentMetadata;
  elements: UseCaseElement[];
  relationships: UseCaseRelationship[];
};

export type DiagramDocument = {
  schemaVersion: 2;
  id: string;
  kind: DocumentKind;
  metadata: DocumentMetadata;
  elements: DiagramElement[];
  relationships: Relationship[];
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type WorkspaceDocumentEntry = {
  document: DiagramDocument;
  view: Viewport;
};

export type WorkspaceSnapshotV1 = {
  storageVersion: 1;
  document: DiagramDocument | DiagramDocumentV1;
  view: Viewport;
};

export type WorkspaceSnapshot = {
  storageVersion: 2;
  activeDocumentId: string;
  documents: WorkspaceDocumentEntry[];
};

export function activeWorkspaceEntry(
  snapshot: WorkspaceSnapshot,
): WorkspaceDocumentEntry | undefined {
  return snapshot.documents.find(
    (entry) => entry.document.id === snapshot.activeDocumentId,
  );
}

export function isLifeline(element: DiagramElement): element is Lifeline {
  return element.kind === "lifeline";
}

export function isUseCaseRelationship(
  relationship: Relationship,
): relationship is UseCaseRelationship {
  return (
    relationship.kind === "association" ||
    relationship.kind === "include" ||
    relationship.kind === "extend"
  );
}

export function isSequenceMessage(
  relationship: Relationship,
): relationship is SequenceMessage {
  return (
    relationship.kind === "sync-message" ||
    relationship.kind === "reply-message"
  );
}
