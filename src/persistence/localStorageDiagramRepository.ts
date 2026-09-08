import type { WorkspaceSnapshot } from "../domain/diagram/model.ts";
import { parseWorkspaceSnapshot } from "../domain/diagram/schema.ts";
import {
  persistenceErr,
  persistenceOk,
  WORKSPACE_STORAGE_KEY,
  type DiagramRepository,
  type KeyValueStorage,
  type PersistenceError,
  type PersistenceResult,
} from "./diagramRepository.ts";

export type LocalStorageDiagramRepositoryOptions = {
  storage?: KeyValueStorage;
};

export function createLocalStorageDiagramRepository(
  options: LocalStorageDiagramRepositoryOptions = {},
): DiagramRepository {
  const storage = options.storage ?? readGlobalLocalStorage();

  return {
    load() {
      return Promise.resolve(loadSnapshot(storage));
    },
    save(snapshot) {
      return Promise.resolve(saveSnapshot(storage, snapshot));
    },
    clear() {
      return Promise.resolve(clearSnapshot(storage));
    },
  };
}

function loadSnapshot(
  storage: KeyValueStorage | undefined,
): PersistenceResult<WorkspaceSnapshot | undefined> {
  const rawResult = readRaw(storage);
  if (!rawResult.ok) {
    return rawResult;
  }

  const raw = rawResult.value;
  if (raw === null) {
    return persistenceOk(undefined);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return persistenceErr(
      "PARSE_INVALID",
      "El documento guardado no es JSON válido.",
    );
  }

  const snapshot = parseWorkspaceSnapshot(parsed);
  if (!snapshot.ok) {
    return persistenceErr("PARSE_INVALID", snapshot.error.message);
  }

  return persistenceOk(snapshot.value);
}

function saveSnapshot(
  storage: KeyValueStorage | undefined,
  snapshot: WorkspaceSnapshot,
): PersistenceResult<undefined> {
  if (storage === undefined) {
    return persistenceErr("STORAGE_UNAVAILABLE", unavailableMessage());
  }

  try {
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(snapshot));
    return persistenceOk(undefined);
  } catch (error) {
    return persistenceErrFromUnknown(error);
  }
}

function clearSnapshot(
  storage: KeyValueStorage | undefined,
): PersistenceResult<undefined> {
  if (storage === undefined) {
    return persistenceErr("STORAGE_UNAVAILABLE", unavailableMessage());
  }

  try {
    storage.removeItem(WORKSPACE_STORAGE_KEY);
    return persistenceOk(undefined);
  } catch (error) {
    return persistenceErrFromUnknown(error);
  }
}

function readGlobalLocalStorage(): KeyValueStorage | undefined {
  try {
    const storage = globalThis.localStorage;
    if (storage === undefined || storage === null) {
      return undefined;
    }
    return storage;
  } catch {
    return undefined;
  }
}

function readRaw(
  storage: KeyValueStorage | undefined,
): PersistenceResult<string | null> {
  if (storage === undefined) {
    return persistenceErr("STORAGE_UNAVAILABLE", unavailableMessage());
  }

  try {
    return persistenceOk(storage.getItem(WORKSPACE_STORAGE_KEY));
  } catch (error) {
    return persistenceErrFromUnknown(error);
  }
}

function persistenceErrFromUnknown(error: unknown): PersistenceResult<never> {
  const mapped = mapStorageError(error);
  return persistenceErr(mapped.code, mapped.message);
}

function mapStorageError(error: unknown): PersistenceError {
  if (isQuotaExceeded(error)) {
    return {
      code: "QUOTA_EXCEEDED",
      message: "No hay espacio suficiente para guardar el diagrama.",
    };
  }

  return {
    code: "STORAGE_UNAVAILABLE",
    message: unavailableMessage(),
  };
}

function unavailableMessage(): string {
  return "No se puede acceder al almacenamiento local. El trabajo sigue en memoria.";
}

function isQuotaExceeded(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22
    );
  }

  return "name" in error && error.name === "QuotaExceededError";
}
