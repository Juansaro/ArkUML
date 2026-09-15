import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_V1,
  SCHEMA_VERSION_V2,
} from "./defaults.ts";
import type {
  DiagramDocument,
  DiagramDocumentV1,
  DiagramDocumentV2,
  Lifeline,
  Result,
  SequenceMessage,
  UseCaseElement,
  UseCaseRelationship,
} from "./model.ts";
import { isSequenceMessage } from "./model.ts";
import {
  parseDiagramDocument,
  parseDiagramDocumentV1,
  parseDiagramDocumentV2,
} from "./schema.ts";

const UNSUPPORTED_VERSION_MESSAGE =
  "schemaVersion no soportado. Solo se migran documentos 1→2→3.";

export function migrateDocument(input: unknown): Result<DiagramDocument> {
  const schemaVersion = inspectSchemaVersion(input);
  if (schemaVersion === SCHEMA_VERSION) {
    return parseDiagramDocument(input);
  }
  if (schemaVersion === SCHEMA_VERSION_V2) {
    const parsed = parseDiagramDocumentV2(input);
    if (!parsed.ok) {
      return parsed;
    }
    return parseDiagramDocument(copyDocumentToV3(parsed.value));
  }
  if (schemaVersion !== SCHEMA_VERSION_V1) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_KIND",
        message: UNSUPPORTED_VERSION_MESSAGE,
      },
    };
  }

  const parsed = parseDiagramDocumentV1(input);
  if (!parsed.ok) {
    return parsed;
  }

  const v2 = parseDiagramDocumentV2(copyUseCaseDocumentToV2(parsed.value));
  if (!v2.ok) {
    return v2;
  }
  return parseDiagramDocument(copyDocumentToV3(v2.value));
}

function inspectSchemaVersion(input: unknown): number | undefined {
  if (typeof input !== "object" || input === null) {
    return undefined;
  }
  if (!("schemaVersion" in input)) {
    return undefined;
  }
  const value = input.schemaVersion;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function copyUseCaseDocumentToV2(
  document: DiagramDocumentV1,
): DiagramDocumentV2 {
  return {
    schemaVersion: SCHEMA_VERSION_V2,
    id: document.id,
    kind: document.kind,
    metadata: {
      title: document.metadata.title,
      createdAt: document.metadata.createdAt,
      updatedAt: document.metadata.updatedAt,
    },
    elements: document.elements.map(copyUseCaseElement),
    relationships: document.relationships.map(copyUseCaseRelationship),
  };
}

function copyDocumentToV3(document: DiagramDocumentV2): DiagramDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: document.id,
    kind: document.kind,
    metadata: {
      title: document.metadata.title,
      createdAt: document.metadata.createdAt,
      updatedAt: document.metadata.updatedAt,
    },
    elements: document.elements.map(copyV2Element),
    relationships: document.relationships.map(copyV2Relationship),
  };
}

function copyV2Element(
  element: UseCaseElement | Lifeline,
): UseCaseElement | Lifeline {
  if (element.kind === "lifeline") {
    return {
      id: element.id,
      kind: "lifeline",
      name: element.name,
      geometry: { ...element.geometry },
      stemLength: element.stemLength,
    };
  }
  return copyUseCaseElement(element);
}

function copyV2Relationship(
  relationship: UseCaseRelationship | SequenceMessage,
): UseCaseRelationship | SequenceMessage {
  if (isSequenceMessage(relationship)) {
    return {
      id: relationship.id,
      kind: relationship.kind,
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      name: relationship.name,
      y: relationship.y,
    };
  }
  return copyUseCaseRelationship(relationship);
}

function copyUseCaseElement(element: UseCaseElement): UseCaseElement {
  if (element.kind === "use-case") {
    const copy: UseCaseElement = {
      id: element.id,
      kind: "use-case",
      name: element.name,
      geometry: { ...element.geometry },
    };
    if (element.parentId !== undefined) {
      copy.parentId = element.parentId;
    }
    return copy;
  }

  return {
    id: element.id,
    kind: element.kind,
    name: element.name,
    geometry: { ...element.geometry },
  };
}

function copyUseCaseRelationship(
  relationship: UseCaseRelationship,
): UseCaseRelationship {
  return {
    id: relationship.id,
    kind: relationship.kind,
    sourceId: relationship.sourceId,
    targetId: relationship.targetId,
    sourceAnchor: relationship.sourceAnchor,
    targetAnchor: relationship.targetAnchor,
  };
}
