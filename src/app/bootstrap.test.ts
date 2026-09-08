import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_NAME } from "../domain/diagram/defaults.ts";
import {
  createWorkspaceSnapshot,
  type IdFactory,
} from "../domain/diagram/factories.ts";
import { createEditorStore } from "../editor/store/editorStore.ts";
import {
  WORKSPACE_STORAGE_KEY,
  type KeyValueStorage,
} from "../persistence/diagramRepository.ts";
import { createLocalStorageDiagramRepository } from "../persistence/localStorageDiagramRepository.ts";
import {
  bootstrapWorkspace,
  workspaceNeedsNewDiagramConfirmation,
  type WorkspaceSession,
} from "./bootstrap.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");

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

describe("bootstrapWorkspace", () => {
  const sessions: WorkspaceSession[] = [];

  afterEach(() => {
    for (const session of sessions) {
      session.coordinator.dispose();
    }
    sessions.length = 0;
  });

  async function boot(storage: KeyValueStorage) {
    const session = await bootstrapWorkspace({
      repository: createLocalStorageDiagramRepository({ storage }),
      now: () => FIXED_NOW,
    });
    sessions.push(session);
    return session;
  }

  it("hidrata un snapshot válido antes de devolver la sesión", async () => {
    const snapshot = createWorkspaceSnapshot({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const storage = createMemoryStorage({
      [WORKSPACE_STORAGE_KEY]: JSON.stringify(snapshot),
    });

    const session = await boot(storage);

    expect(session.store.getState().document).toEqual(snapshot.document);
    expect(session.store.getState().viewport).toEqual(snapshot.view);
    expect(session.store.getState().ui.saveStatus).toBe("saved");
    expect(session.store.getState().ui.dialogMode).toBe("none");
  });

  it("usa el documento default si no hay snapshot", async () => {
    const session = await boot(createMemoryStorage());
    const boundary = session.store
      .getState()
      .document.elements.find((element) => element.kind === "system-boundary");
    expect(boundary?.name).toBe(DEFAULT_BOUNDARY_NAME);
    expect(session.store.getState().ui.saveStatus).toBe("idle");
    expect(session.store.getState().ui.dialogMode).toBe("none");
  });

  it("no pisa un snapshot corrupto y abre recovery", async () => {
    const corrupt = "{not-json";
    const storage = createMemoryStorage({
      [WORKSPACE_STORAGE_KEY]: corrupt,
    });

    const session = await boot(storage);

    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(corrupt);
    expect(session.coordinator.isOverwriteBlocked()).toBe(true);
    expect(session.store.getState().ui.saveStatus).toBe("error");
    expect(session.store.getState().ui.dialogMode).toBe("recovery");
    expect(
      session.store
        .getState()
        .document.elements.some(
          (element) => element.kind === "system-boundary",
        ),
    ).toBe(true);
  });

  it("si el storage está bloqueado, deja el default en memoria con error", async () => {
    const session = await bootstrapWorkspace({
      repository: createLocalStorageDiagramRepository({
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
      }),
      now: () => FIXED_NOW,
    });
    sessions.push(session);

    expect(session.store.getState().ui.saveStatus).toBe("error");
    expect(session.store.getState().ui.dialogMode).toBe("none");
    expect(session.store.getState().ui.message).toMatch(/memoria/i);
    expect(
      session.store
        .getState()
        .document.elements.some(
          (element) => element.kind === "system-boundary",
        ),
    ).toBe(true);
  });
});

describe("workspaceNeedsNewDiagramConfirmation", () => {
  it("no pide confirmación en un default sin historial", () => {
    const store = createEditorStore();
    expect(workspaceNeedsNewDiagramConfirmation(store.getState(), false)).toBe(
      false,
    );
  });

  it("pide confirmación si hay cambios, historial o overwrite bloqueado", () => {
    const store = createEditorStore();
    expect(workspaceNeedsNewDiagramConfirmation(store.getState(), true)).toBe(
      true,
    );

    store.getState().setSaveStatus("saved", FIXED_NOW.toISOString());
    expect(workspaceNeedsNewDiagramConfirmation(store.getState(), false)).toBe(
      true,
    );

    const dirty = createEditorStore();
    const created = dirty.getState().createActor({
      name: "Usuario",
      geometry: { x: -120, y: 40, width: 48, height: 96 },
    });
    expect(created.ok).toBe(true);
    expect(workspaceNeedsNewDiagramConfirmation(dirty.getState(), false)).toBe(
      true,
    );
  });
});
