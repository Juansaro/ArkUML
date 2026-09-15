import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  createEmptySequenceDocument,
  createWorkspaceSnapshot,
  type IdFactory,
} from "../domain/diagram/factories.ts";
import type { WorkspaceSnapshot } from "../domain/diagram/model.ts";
import {
  WORKSPACE_STORAGE_KEY,
  type DiagramRepository,
  type KeyValueStorage,
} from "./diagramRepository.ts";
import { createLocalStorageDiagramRepository } from "./localStorageDiagramRepository.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");

function sampleSnapshot(): WorkspaceSnapshot {
  return createWorkspaceSnapshot({
    createId: sequentialIds(),
    now: () => FIXED_NOW,
  });
}

function createMemoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage {
  const records = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return records.get(key) ?? null;
    },
    setItem(key, value) {
      records.set(key, value);
    },
    removeItem(key) {
      records.delete(key);
    },
  };
}

function createQuotaStorage(inner: KeyValueStorage): KeyValueStorage {
  return {
    getItem(key) {
      return inner.getItem(key);
    },
    setItem() {
      throw new DOMException(
        "The quota has been exceeded.",
        "QuotaExceededError",
      );
    },
    removeItem(key) {
      inner.removeItem(key);
    },
  };
}

function expectOk<T>(
  result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

describe("DiagramRepository contract", () => {
  it("cumple load, save y clear sobre un adapter LocalStorage", async () => {
    const storage = createMemoryStorage();
    const repository: DiagramRepository = createLocalStorageDiagramRepository({
      storage,
    });
    const snapshot = sampleSnapshot();

    expect(expectOk(await repository.load())).toBeUndefined();

    expectOk(await repository.save(snapshot));
    expect(expectOk(await repository.load())).toEqual({
      snapshot,
      migratedFromV1: false,
    });

    expectOk(await repository.clear());
    expect(expectOk(await repository.load())).toBeUndefined();
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });
});

describe("createLocalStorageDiagramRepository", () => {
  it("hace round-trip de un documento válido", async () => {
    const storage = createMemoryStorage();
    const repository = createLocalStorageDiagramRepository({ storage });
    const snapshot = sampleSnapshot();

    expectOk(await repository.save(snapshot));
    const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
    expect(raw).toEqual(JSON.stringify(snapshot));
    expect(expectOk(await repository.load())).toEqual({
      snapshot,
      migratedFromV1: false,
    });
  });

  it("no pisa la clave si el JSON está corrupto", async () => {
    const corrupt = "{not-json";
    const storage = createMemoryStorage({
      [WORKSPACE_STORAGE_KEY]: corrupt,
    });
    const repository = createLocalStorageDiagramRepository({ storage });

    const result = await repository.load();
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected parse error");
    }
    expect(result.error.code).toBe("PARSE_INVALID");
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(corrupt);
  });

  it("no pisa la clave si el snapshot no pasa Zod", async () => {
    const invalid = JSON.stringify({ storageVersion: 2 });
    const storage = createMemoryStorage({
      [WORKSPACE_STORAGE_KEY]: invalid,
    });
    const repository = createLocalStorageDiagramRepository({ storage });

    const result = await repository.load();
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected parse error");
    }
    expect(result.error.code).toBe("PARSE_INVALID");
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(invalid);
  });

  it("devuelve error tipado de cuota y conserva el valor previo", async () => {
    const snapshot = sampleSnapshot();
    const inner = createMemoryStorage({
      [WORKSPACE_STORAGE_KEY]: JSON.stringify(snapshot),
    });
    const repository = createLocalStorageDiagramRepository({
      storage: createQuotaStorage(inner),
    });

    const result = await repository.save(sampleSnapshot());
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected quota error");
    }
    expect(result.error.code).toBe("QUOTA_EXCEEDED");
    expect(inner.getItem(WORKSPACE_STORAGE_KEY)).toBe(JSON.stringify(snapshot));
  });

  it("devuelve STORAGE_UNAVAILABLE si el storage está bloqueado", async () => {
    const repository = createLocalStorageDiagramRepository({
      storage: {
        getItem() {
          throw new Error("blocked");
        },
        setItem() {
          throw new Error("blocked");
        },
        removeItem() {
          throw new Error("blocked");
        },
      },
    });

    const load = await repository.load();
    expect(load.ok).toBe(false);
    if (load.ok) {
      throw new Error("Expected unavailable");
    }
    expect(load.error.code).toBe("STORAGE_UNAVAILABLE");

    const save = await repository.save(sampleSnapshot());
    expect(save.ok).toBe(false);
    if (save.ok) {
      throw new Error("Expected unavailable");
    }
    expect(save.error.code).toBe("STORAGE_UNAVAILABLE");
  });

  it("hace round-trip de una biblioteca v2 con casos de uso y secuencia", async () => {
    const createId = sequentialIds();
    const useCase = createDiagramDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const sequence = createEmptySequenceDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const snapshot: WorkspaceSnapshot = {
      storageVersion: 2,
      activeDocumentId: sequence.id,
      documents: [
        { document: useCase, view: { x: 1, y: 2, zoom: 1 } },
        { document: sequence, view: { x: 0, y: 0, zoom: 1.5 } },
      ],
    };
    const storage = createMemoryStorage();
    const repository = createLocalStorageDiagramRepository({ storage });

    expectOk(await repository.save(snapshot));
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toEqual(
      JSON.stringify(snapshot),
    );
    expect(expectOk(await repository.load())).toEqual({
      snapshot,
      migratedFromV1: false,
    });
  });

  it("migra un blob v1 en memoria y no escribe hasta save", async () => {
    const createId = sequentialIds();
    const document = createDiagramDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const v1 = {
      storageVersion: 1,
      document: {
        schemaVersion: 1,
        id: document.id,
        kind: "use-case",
        metadata: document.metadata,
        elements: document.elements,
        relationships: document.relationships,
      },
      view: { x: 8, y: 16, zoom: 2 },
    };
    const raw = JSON.stringify(v1);
    const storage = createMemoryStorage({
      [WORKSPACE_STORAGE_KEY]: raw,
    });
    const repository = createLocalStorageDiagramRepository({ storage });

    const loaded = expectOk(await repository.load());
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(raw);
    expect(loaded?.migratedFromV1).toBe(true);
    expect(loaded?.snapshot.storageVersion).toBe(2);
    expect(loaded?.snapshot.activeDocumentId).toBe(document.id);
    expect(loaded?.snapshot.documents).toHaveLength(1);
    expect(loaded?.snapshot.documents[0]?.document.schemaVersion).toBe(3);
    expect(loaded?.snapshot.documents[0]?.view).toEqual(v1.view);

    expectOk(await repository.save(loaded!.snapshot));
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toEqual(
      JSON.stringify(loaded!.snapshot),
    );
    expect(
      JSON.parse(storage.getItem(WORKSPACE_STORAGE_KEY) ?? ""),
    ).not.toEqual(v1);
  });

  it("rechaza una lista vacía como PARSE_INVALID y conserva el blob", async () => {
    const empty = JSON.stringify({
      storageVersion: 2,
      activeDocumentId: "00000000-0000-4000-8000-000000000001",
      documents: [],
    });
    const storage = createMemoryStorage({
      [WORKSPACE_STORAGE_KEY]: empty,
    });
    const repository = createLocalStorageDiagramRepository({ storage });

    const result = await repository.load();
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected parse error");
    }
    expect(result.error.code).toBe("PARSE_INVALID");
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(empty);
  });
});
