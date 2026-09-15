import {
  STORAGE_VERSION,
  STORAGE_VERSION_V1,
} from "../domain/diagram/defaults.ts";
import { migrateDocument } from "../domain/diagram/migrate.ts";
import type { WorkspaceSnapshot } from "../domain/diagram/model.ts";
import {
  parseWorkspaceSnapshot,
  parseWorkspaceSnapshotV1,
} from "../domain/diagram/schema.ts";
import {
  persistenceErr,
  persistenceOk,
  type MigratedWorkspace,
  type PersistenceResult,
} from "./diagramRepository.ts";

const UNSUPPORTED_STORAGE_MESSAGE =
  "storageVersion no soportado. Solo se migran workspaces 1→2.";

export function migrateWorkspace(
  input: unknown,
): PersistenceResult<MigratedWorkspace> {
  const storageVersion = inspectStorageVersion(input);
  if (storageVersion === STORAGE_VERSION) {
    const parsed = parseWorkspaceSnapshot(input);
    if (parsed.ok) {
      return persistenceOk({ snapshot: parsed.value, migratedFromV1: false });
    }
    const recovered = wrapSingleDocumentWorkspace(input);
    if (recovered.ok) {
      return recovered;
    }
    const upgraded = upgradeStorageV2Documents(input);
    if (upgraded !== undefined) {
      return upgraded;
    }
    return persistenceErr("PARSE_INVALID", parsed.error.message);
  }

  if (storageVersion === STORAGE_VERSION_V1) {
    return wrapSingleDocumentWorkspace(input);
  }

  const recovered = wrapSingleDocumentWorkspace(input);
  if (recovered.ok) {
    return recovered;
  }

  return persistenceErr("PARSE_INVALID", UNSUPPORTED_STORAGE_MESSAGE);
}

function wrapSingleDocumentWorkspace(
  input: unknown,
): PersistenceResult<MigratedWorkspace> {
  if (typeof input !== "object" || input === null) {
    return persistenceErr("PARSE_INVALID", "El workspace no es un objeto.");
  }

  const record = input as Record<string, unknown>;
  if (Array.isArray(record.documents)) {
    return persistenceErr(
      "PARSE_INVALID",
      "El envelope de un documento no incluye documents[].",
    );
  }
  if (!("document" in record) || !("view" in record)) {
    return persistenceErr(
      "PARSE_INVALID",
      "Faltan document y view para envolver el workspace.",
    );
  }

  const parsedV1 = parseWorkspaceSnapshotV1({
    storageVersion: STORAGE_VERSION_V1,
    document: record.document,
    view: record.view,
  });
  if (!parsedV1.ok) {
    return persistenceErr("PARSE_INVALID", parsedV1.error.message);
  }

  const migratedDocument = migrateDocument(parsedV1.value.document);
  if (!migratedDocument.ok) {
    return persistenceErr("PARSE_INVALID", migratedDocument.error.message);
  }

  const wrapped: WorkspaceSnapshot = {
    storageVersion: STORAGE_VERSION,
    activeDocumentId: migratedDocument.value.id,
    documents: [
      {
        document: migratedDocument.value,
        view: {
          x: parsedV1.value.view.x,
          y: parsedV1.value.view.y,
          zoom: parsedV1.value.view.zoom,
        },
      },
    ],
  };

  const parsedV2 = parseWorkspaceSnapshot(wrapped);
  if (!parsedV2.ok) {
    return persistenceErr("PARSE_INVALID", parsedV2.error.message);
  }

  return persistenceOk({ snapshot: parsedV2.value, migratedFromV1: true });
}

function upgradeStorageV2Documents(
  input: unknown,
): PersistenceResult<MigratedWorkspace> | undefined {
  if (typeof input !== "object" || input === null) {
    return undefined;
  }
  const record = input as Record<string, unknown>;
  if (!Array.isArray(record.documents)) {
    return undefined;
  }

  const documents: WorkspaceSnapshot["documents"] = [];
  for (const entry of record.documents) {
    if (typeof entry !== "object" || entry === null) {
      return undefined;
    }
    const row = entry as Record<string, unknown>;
    const migrated = migrateDocument(row.document);
    if (!migrated.ok) {
      return persistenceErr("PARSE_INVALID", migrated.error.message);
    }
    if (
      typeof row.view !== "object" ||
      row.view === null ||
      !("x" in row.view) ||
      !("y" in row.view) ||
      !("zoom" in row.view)
    ) {
      return undefined;
    }
    const view = row.view as Record<string, unknown>;
    if (
      typeof view.x !== "number" ||
      typeof view.y !== "number" ||
      typeof view.zoom !== "number"
    ) {
      return undefined;
    }
    documents.push({
      document: migrated.value,
      view: { x: view.x, y: view.y, zoom: view.zoom },
    });
  }

  if (typeof record.activeDocumentId !== "string") {
    return undefined;
  }

  const wrapped: WorkspaceSnapshot = {
    storageVersion: STORAGE_VERSION,
    activeDocumentId: record.activeDocumentId,
    documents,
  };
  const parsed = parseWorkspaceSnapshot(wrapped);
  if (!parsed.ok) {
    return persistenceErr("PARSE_INVALID", parsed.error.message);
  }
  return persistenceOk({ snapshot: parsed.value, migratedFromV1: false });
}

function inspectStorageVersion(input: unknown): number | undefined {
  if (typeof input !== "object" || input === null) {
    return undefined;
  }
  if (!("storageVersion" in input)) {
    return undefined;
  }
  const value = input.storageVersion;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}
