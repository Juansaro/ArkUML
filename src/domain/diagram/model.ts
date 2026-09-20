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

export type UmlClass = {
  id: string;
  kind: "class";
  name: string;
  geometry: Geometry;
  attributes: string[];
  operations: string[];
};

export type UmlComponent = {
  id: string;
  kind: "component";
  name: string;
  geometry: Geometry;
};

export type UseCaseElement = Actor | UseCase | SystemBoundary;

export type SequenceElement = Lifeline;

export type ClassElement = UmlClass;

export type ComponentElement = UmlComponent;

export type DiagramElement =
  | UseCaseElement
  | SequenceElement
  | ClassElement
  | ComponentElement;

export type UseCaseRelationshipKind = "association" | "include" | "extend";

export type SequenceMessageKind = "sync-message" | "reply-message";

export type ClassAssociationKind =
  "class-association" | "aggregation" | "composition";

export type ClassRelationshipKind = ClassAssociationKind | "generalization";

export type ComponentRelationshipKind =
  "component-usage" | "assembly-connector";

export type RelationshipKind =
  | UseCaseRelationshipKind
  | SequenceMessageKind
  | ClassRelationshipKind
  | ComponentRelationshipKind;

export const ASSOCIATION_MULTIPLICITIES = [
  "0..1",
  "1",
  "0..*",
  "1..*",
] as const;

export type AssociationMultiplicity =
  (typeof ASSOCIATION_MULTIPLICITIES)[number];

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

export type ClassAssociation = {
  id: string;
  kind: ClassAssociationKind;
  sourceId: string;
  targetId: string;
  name: string;
  sourceMultiplicity: AssociationMultiplicity;
  targetMultiplicity: AssociationMultiplicity;
};

export type Generalization = {
  id: string;
  kind: "generalization";
  sourceId: string;
  targetId: string;
  name: string;
};

export type ClassRelationship = ClassAssociation | Generalization;

export type ComponentRelationship = {
  id: string;
  kind: ComponentRelationshipKind;
  sourceId: string;
  targetId: string;
  name: string;
};

export type Relationship =
  | UseCaseRelationship
  | SequenceMessage
  | ClassRelationship
  | ComponentRelationship;

export type DocumentMetadata = {
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentKindV2 = "use-case" | "sequence";

export type DocumentKind = DocumentKindV2 | "class" | "component";

export type DiagramDocumentV1 = {
  schemaVersion: 1;
  id: string;
  kind: "use-case";
  metadata: DocumentMetadata;
  elements: UseCaseElement[];
  relationships: UseCaseRelationship[];
};

export type DiagramDocumentV2 = {
  schemaVersion: 2;
  id: string;
  kind: DocumentKindV2;
  metadata: DocumentMetadata;
  elements: Array<UseCaseElement | Lifeline>;
  relationships: Array<UseCaseRelationship | SequenceMessage>;
};

export type DiagramDocument = {
  schemaVersion: 3;
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
  document: DiagramDocument | DiagramDocumentV2 | DiagramDocumentV1;
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

export function isUmlClass(element: DiagramElement): element is UmlClass {
  return element.kind === "class";
}

export function isUmlComponent(
  element: DiagramElement,
): element is UmlComponent {
  return element.kind === "component";
}

export function isClassRelationship(
  relationship: Relationship,
): relationship is ClassRelationship {
  return (
    relationship.kind === "class-association" ||
    relationship.kind === "aggregation" ||
    relationship.kind === "composition" ||
    relationship.kind === "generalization"
  );
}

export function isComponentRelationship(
  relationship: Relationship,
): relationship is ComponentRelationship {
  return (
    relationship.kind === "component-usage" ||
    relationship.kind === "assembly-connector"
  );
}

export function isClassAssociation(
  relationship: Relationship,
): relationship is ClassAssociation {
  return (
    relationship.kind === "class-association" ||
    relationship.kind === "aggregation" ||
    relationship.kind === "composition"
  );
}

export function isGeneralization(
  relationship: Relationship,
): relationship is Generalization {
  return relationship.kind === "generalization";
}

export function isAssociationMultiplicity(
  value: string,
): value is AssociationMultiplicity {
  return (ASSOCIATION_MULTIPLICITIES as readonly string[]).includes(value);
}
