import {
  DEFAULT_VIEWPORT,
  STORAGE_VERSION,
} from "../domain/diagram/defaults.ts";
import { createDiagramDocument } from "../domain/diagram/factories.ts";
import type { Viewport, WorkspaceSnapshot } from "../domain/diagram/model.ts";
import type {
  EditorStore,
  EditorStoreApi,
} from "../editor/store/editorStore.ts";
import {
  persistenceErr,
  persistenceOk,
  type DiagramRepository,
  type PersistenceResult,
} from "./diagramRepository.ts";

export const AUTOSAVE_DEBOUNCE_MS = 750;
export const SAVED_ANNOUNCEMENT = "Diagrama guardado.";
export const STORAGE_UPGRADE_MESSAGE =
  "Este workspace es único. Al guardar, el formato 2.0 sustituye al de 1.0 y no se puede deshacer.";

export type AutosaveCoordinatorOptions = {
  store: EditorStoreApi;
  repository: DiagramRepository;
  debounceMs?: number;
  now?: () => Date;
  eventTarget?: EventTarget;
};

export type FlushOptions = {
  announce?: boolean;
};

export type AutosaveCoordinator = {
  hydrate(): Promise<PersistenceResult<WorkspaceSnapshot | undefined>>;
  flush(options?: FlushOptions): Promise<PersistenceResult<undefined>>;
  startNewDiagram(): Promise<PersistenceResult<undefined>>;
  isOverwriteBlocked(): boolean;
  allowOverwrite(): void;
  isStorageUpgradePending(): boolean;
  confirmStorageUpgrade(): Promise<PersistenceResult<undefined>>;
  cancelStorageUpgrade(): void;
  dispose(): void;
};

export function createAutosaveCoordinator(
  options: AutosaveCoordinatorOptions,
): AutosaveCoordinator {
  const debounceMs = options.debounceMs ?? AUTOSAVE_DEBOUNCE_MS;
  const now = options.now ?? (() => new Date());
  const eventTarget = options.eventTarget ?? globalThis;
  const { store, repository } = options;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let blockedByCorrupt = false;
  let pendingStorageUpgrade = false;
  let suppressCommit = false;
  let lastSavedSnapshot: WorkspaceSnapshot | undefined;

  const unsubscribe = store.subscribe((state, previous) => {
    if (suppressCommit || blockedByCorrupt) {
      return;
    }
    if (!isHistoryCommit(state, previous)) {
      return;
    }
    schedule();
  });

  const onBeforeUnload = (): void => {
    if (
      blockedByCorrupt ||
      pendingStorageUpgrade ||
      (timer === undefined && !isDirty(store.getState()))
    ) {
      return;
    }
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    void writeNow();
  };

  eventTarget.addEventListener("beforeunload", onBeforeUnload);

  function schedule(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      void writeNow();
    }, debounceMs);
  }

  async function writeNow(
    announce = false,
  ): Promise<PersistenceResult<undefined>> {
    if (blockedByCorrupt) {
      const message =
        "El documento guardado no es válido. No se ha sobrescrito.";
      store.getState().setSaveStatus("error");
      store.getState().setMessage(message);
      return persistenceErr("PARSE_INVALID", message);
    }

    if (pendingStorageUpgrade) {
      store.getState().setDialogMode("storage-upgrade");
      store.getState().setMessage(STORAGE_UPGRADE_MESSAGE);
      return persistenceErr("PARSE_INVALID", STORAGE_UPGRADE_MESSAGE);
    }

    const state = store.getState();
    const snapshot = toWorkspaceSnapshot(state);
    state.setSaveStatus("saving");
    const result = await repository.save(snapshot);
    if (result.ok) {
      lastSavedSnapshot = snapshot;
      store.getState().setSaveStatus("saved", now().toISOString());
      store.getState().setMessage(announce ? SAVED_ANNOUNCEMENT : undefined);
      return result;
    }

    store.getState().setSaveStatus("error");
    store.getState().setMessage(result.error.message);
    return result;
  }

  function isDirty(state: EditorStore): boolean {
    if (lastSavedSnapshot === undefined) {
      return true;
    }
    return (
      JSON.stringify(toWorkspaceSnapshot(state)) !==
      JSON.stringify(lastSavedSnapshot)
    );
  }

  function rememberClean(state: EditorStore): void {
    lastSavedSnapshot = toWorkspaceSnapshot(state);
  }

  return {
    async hydrate() {
      const result = await repository.load();
      if (!result.ok) {
        blockedByCorrupt = result.error.code === "PARSE_INVALID";
        store.getState().setSaveStatus("error");
        store.getState().setMessage(result.error.message);
        return result;
      }

      const loaded = result.value;
      if (loaded === undefined) {
        pendingStorageUpgrade = false;
        rememberClean(store.getState());
        return persistenceOk(undefined);
      }

      suppressCommit = true;
      pendingStorageUpgrade = loaded.migratedFromV1;
      store.getState().hydrateWorkspaceSnapshot(loaded.snapshot);
      rememberClean(store.getState());
      suppressCommit = false;

      if (loaded.migratedFromV1) {
        store.getState().setSaveStatus("idle");
        store.getState().setDialogMode("storage-upgrade");
        store.getState().setMessage(STORAGE_UPGRADE_MESSAGE);
      } else {
        store.getState().setSaveStatus("saved", now().toISOString());
        store.getState().setMessage(undefined);
      }
      return persistenceOk(loaded.snapshot);
    },

    flush(options) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      return writeNow(options?.announce === true);
    },

    async startNewDiagram() {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      blockedByCorrupt = false;
      pendingStorageUpgrade = false;
      const nextDocument = createDiagramDocument();
      suppressCommit = true;
      store.getState().hydrateWorkspace(nextDocument, DEFAULT_VIEWPORT);
      store.getState().setTool("select");
      store.getState().setDialogMode("none");
      lastSavedSnapshot = undefined;
      suppressCommit = false;

      const cleared = await repository.clear();
      if (!cleared.ok) {
        store.getState().setSaveStatus("error");
        store.getState().setMessage(cleared.error.message);
        return cleared;
      }
      return writeNow();
    },

    isOverwriteBlocked() {
      return blockedByCorrupt;
    },

    allowOverwrite() {
      blockedByCorrupt = false;
    },

    isStorageUpgradePending() {
      return pendingStorageUpgrade;
    },

    confirmStorageUpgrade() {
      pendingStorageUpgrade = false;
      store.getState().setDialogMode("none");
      return writeNow();
    },

    cancelStorageUpgrade() {
      store.getState().setDialogMode("none");
    },

    dispose() {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      unsubscribe();
      eventTarget.removeEventListener("beforeunload", onBeforeUnload);
    },
  };
}

function isHistoryCommit(state: EditorStore, previous: EditorStore): boolean {
  if (state.history.transactionBaseline !== undefined) {
    return false;
  }

  return (
    state.document !== previous.document ||
    state.history.past !== previous.history.past ||
    state.history.future !== previous.history.future ||
    state.activeDocumentId !== previous.activeDocumentId ||
    state.documents !== previous.documents
  );
}

function toWorkspaceSnapshot(state: EditorStore): WorkspaceSnapshot {
  return {
    storageVersion: STORAGE_VERSION,
    activeDocumentId: state.activeDocumentId,
    documents: state.documents.map((entry) =>
      entry.document.id === state.activeDocumentId
        ? {
            document: state.document,
            view: copyViewport(state.viewport),
          }
        : {
            document: entry.document,
            view: copyViewport(entry.view),
          },
    ),
  };
}

function copyViewport(viewport: Viewport): Viewport {
  return {
    x: viewport.x,
    y: viewport.y,
    zoom: viewport.zoom,
  };
}
