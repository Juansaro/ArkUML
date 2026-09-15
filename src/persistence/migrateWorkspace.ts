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
    if (!parsed.ok) {
      return persistenceErr("PARSE_INVALID", parsed.error.message);
    }
    return persistenceOk({ snapshot: parsed.value, migratedFromV1: false });
  }

  if (storageVersion !== STORAGE_VERSION_V1) {
    return persistenceErr("PARSE_INVALID", UNSUPPORTED_STORAGE_MESSAGE);
  }

  const parsedV1 = parseWorkspaceSnapshotV1(input);
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
