import { SCHEMA_VERSION, SCHEMA_VERSION_V1 } from "./defaults.ts";
import type {
  DiagramDocument,
  DiagramDocumentV1,
  Result,
  UseCaseElement,
  UseCaseRelationship,
} from "./model.ts";
import { parseDiagramDocument, parseDiagramDocumentV1 } from "./schema.ts";

const UNSUPPORTED_VERSION_MESSAGE =
  "schemaVersion no soportado. Solo se migran documentos 1→2.";

export function migrateDocument(input: unknown): Result<DiagramDocument> {
  const schemaVersion = inspectSchemaVersion(input);
  if (schemaVersion === SCHEMA_VERSION) {
    return parseDiagramDocument(input);
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

  return parseDiagramDocument(copyUseCaseDocumentToV2(parsed.value));
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

function copyUseCaseDocumentToV2(document: DiagramDocumentV1): DiagramDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
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
