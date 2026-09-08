import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDiagramDocument,
  type IdFactory,
} from "../domain/diagram/factories.ts";
import type { Geometry, Result } from "../domain/diagram/model.ts";
import {
  createEditorStore,
  type EditorStoreApi,
} from "../editor/store/editorStore.ts";
import { selectSaveStatus } from "../editor/store/selectors.ts";
import { DEFAULT_BOUNDARY_NAME } from "../domain/diagram/defaults.ts";
import {
  AUTOSAVE_DEBOUNCE_MS,
  createAutosaveCoordinator,
  SAVED_ANNOUNCEMENT,
  type AutosaveCoordinator,
} from "./autosaveCoordinator.ts";
import {
  WORKSPACE_STORAGE_KEY,
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

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const SAVED_AT = new Date("2026-09-07T15:00:00.000Z");
const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 48, height: 96 };

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

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function boundaryOf(store: EditorStoreApi) {
  const boundary = store
    .getState()
    .document.elements.find((element) => element.kind === "system-boundary");
  if (boundary === undefined) {
    throw new Error("Falta el boundary");
  }
  return boundary;
}

describe("createAutosaveCoordinator", () => {
  let storage: KeyValueStorage;
  let store: EditorStoreApi;
  let coordinator: AutosaveCoordinator;

  beforeEach(() => {
    vi.useFakeTimers();
    storage = createMemoryStorage();
    const createId = sequentialIds();
    store = createEditorStore({
      document: createDiagramDocument({
        createId,
        now: () => CREATED_AT,
      }),
      deps: { createId, now: () => CREATED_AT },
    });
    coordinator = createAutosaveCoordinator({
      store,
      repository: createLocalStorageDiagramRepository({ storage }),
      now: () => SAVED_AT,
    });
  });

  afterEach(() => {
    coordinator.dispose();
    vi.useRealTimers();
  });

  it("hace round-trip save + load de un documento válido", async () => {
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    await coordinator.flush();

    const restored = createEditorStore({
      document: createDiagramDocument({
        createId: sequentialIds(80),
        now: () => CREATED_AT,
      }),
    });
    const restoreCoordinator = createAutosaveCoordinator({
      store: restored,
      repository: createLocalStorageDiagramRepository({ storage }),
      now: () => SAVED_AT,
    });

    const loaded = await restoreCoordinator.hydrate();
    restoreCoordinator.dispose();

    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error("Expected loaded snapshot");
    }
    expect(loaded.value?.document).toEqual(store.getState().document);
    expect(restored.getState().document).toEqual(store.getState().document);
    expect(selectSaveStatus(restored.getState())).toBe("saved");
  });

  it("cien updates transitorios no escriben; el commit sí tras el debounce", async () => {
    const boundaryId = boundaryOf(store).id;

    store.getState().beginTransaction();
    for (let index = 0; index < 100; index += 1) {
      expectOk(
        store.getState().commitMove([{ id: boundaryId, x: index, y: 0 }]),
      );
    }

    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(selectSaveStatus(store.getState())).toBe("idle");

    store.getState().commitTransaction();
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS - 1);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "")).toMatchObject({
      document: {
        elements: [{ geometry: { x: 99, y: 0 } }],
      },
    });
    expect(selectSaveStatus(store.getState())).toBe("saved");
    expect(store.getState().ui.lastSavedAt).toBe(SAVED_AT.toISOString());
  });

  it("un parse corrupto no pisa la clave ni tras un commit posterior", async () => {
    const corrupt = "{not-json";
    storage.setItem(WORKSPACE_STORAGE_KEY, corrupt);

    const result = await coordinator.hydrate();
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected parse error");
    }
    expect(result.error.code).toBe("PARSE_INVALID");
    expect(selectSaveStatus(store.getState())).toBe("error");
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(corrupt);

    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    await coordinator.flush();
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);

    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(corrupt);
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(true);

    coordinator.allowOverwrite();
    const flushed = await coordinator.flush();
    expect(flushed.ok).toBe(true);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).not.toBe(corrupt);
  });

  it("cuota simulada produce error tipado y el documento en memoria permanece", async () => {
    const inner = storage;
    const quotaRepository = createLocalStorageDiagramRepository({
      storage: {
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
      },
    });
    coordinator.dispose();
    coordinator = createAutosaveCoordinator({
      store,
      repository: quotaRepository,
      now: () => SAVED_AT,
    });

    const before = store.getState().document;
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const afterCreate = store.getState().document;
    expect(afterCreate).not.toBe(before);

    const flushed = await coordinator.flush();
    expect(flushed.ok).toBe(false);
    if (flushed.ok) {
      throw new Error("Expected quota error");
    }
    expect(flushed.error.code).toBe("QUOTA_EXCEEDED");
    expect(selectSaveStatus(store.getState())).toBe("error");
    expect(store.getState().ui.message).toMatch(/espacio suficiente/i);
    expect(store.getState().document).toBe(afterCreate);
    expect(inner.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });

  it("flush cancela el debounce y escribe de inmediato", async () => {
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();

    const flushed = await coordinator.flush();
    expect(flushed.ok).toBe(true);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).not.toBeNull();
    expect(selectSaveStatus(store.getState())).toBe("saved");

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(
      JSON.parse(storage.getItem(WORKSPACE_STORAGE_KEY) ?? ""),
    ).toMatchObject({
      document: store.getState().document,
    });
  });

  it("no escribe en cada cambio de viewport", async () => {
    store.getState().setViewport({ x: 40, y: 80, zoom: 2 });
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });

  it("hace flush best-effort en beforeunload si hay un commit pendiente", async () => {
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();

    window.dispatchEvent(new Event("beforeunload"));
    await Promise.resolve();

    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).not.toBeNull();
    expect(selectSaveStatus(store.getState())).toBe("saved");
  });

  it("flush con anuncio no usa toast en el status, solo el mensaje de live region", async () => {
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const flushed = await coordinator.flush({ announce: true });
    expect(flushed.ok).toBe(true);
    expect(selectSaveStatus(store.getState())).toBe("saved");
    expect(store.getState().ui.message).toBe(SAVED_ANNOUNCEMENT);
  });

  it("startNewDiagram crea el default, vacía historial y sustituye el storage", async () => {
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    await coordinator.flush();
    expect(store.getState().history.past.length).toBeGreaterThan(0);

    const reset = await coordinator.startNewDiagram();
    expect(reset.ok).toBe(true);
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(false);
    expect(
      store
        .getState()
        .document.elements.find((element) => element.kind === "system-boundary")
        ?.name,
    ).toBe(DEFAULT_BOUNDARY_NAME);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.future).toHaveLength(0);
    expect(store.getState().tool).toBe("select");
    expect(selectSaveStatus(store.getState())).toBe("saved");

    const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "")).toMatchObject({
      document: {
        elements: [{ kind: "system-boundary", name: DEFAULT_BOUNDARY_NAME }],
      },
    });
  });

  it("startNewDiagram puede sustituir un blob corrupto tras confirmar", async () => {
    const corrupt = "{not-json";
    storage.setItem(WORKSPACE_STORAGE_KEY, corrupt);
    await coordinator.hydrate();
    expect(coordinator.isOverwriteBlocked()).toBe(true);

    const reset = await coordinator.startNewDiagram();
    expect(reset.ok).toBe(true);
    expect(coordinator.isOverwriteBlocked()).toBe(false);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).not.toBe(corrupt);
  });
});
