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

export type DiagramElement = Actor | UseCase | SystemBoundary;

export type RelationshipKind = "association" | "include" | "extend";

export type Relationship = {
  id: string;
  kind: RelationshipKind;
  sourceId: string;
  targetId: string;
  sourceAnchor: Anchor;
  targetAnchor: Anchor;
};

export type DocumentMetadata = {
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DiagramDocument = {
  schemaVersion: 1;
  id: string;
  kind: "use-case";
  metadata: DocumentMetadata;
  elements: DiagramElement[];
  relationships: Relationship[];
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type WorkspaceSnapshot = {
  storageVersion: 1;
  document: DiagramDocument;
  view: Viewport;
};
