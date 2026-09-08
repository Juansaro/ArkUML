import { STORAGE_VERSION } from "../domain/diagram/defaults.ts";
import type {
  DiagramDocument,
  Viewport,
  WorkspaceSnapshot,
} from "../domain/diagram/model.ts";
import type {
  EditorStore,
  EditorStoreApi,
} from "../editor/store/editorStore.ts";
import {
  persistenceErr,
  type DiagramRepository,
  type PersistenceResult,
} from "./diagramRepository.ts";

export const AUTOSAVE_DEBOUNCE_MS = 750;

export type AutosaveCoordinatorOptions = {
  store: EditorStoreApi;
  repository: DiagramRepository;
  debounceMs?: number;
  now?: () => Date;
  eventTarget?: EventTarget;
};

export type AutosaveCoordinator = {
  hydrate(): Promise<PersistenceResult<WorkspaceSnapshot | undefined>>;
  flush(): Promise<PersistenceResult<undefined>>;
  allowOverwrite(): void;
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
  let suppressCommit = false;
  let lastSavedDocument: DiagramDocument | undefined;
  let lastSavedView: Viewport | undefined;

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

  async function writeNow(): Promise<PersistenceResult<undefined>> {
    if (blockedByCorrupt) {
      return persistenceErr(
        "PARSE_INVALID",
        "El documento guardado no es válido. No se ha sobrescrito.",
      );
    }

    const state = store.getState();
    const snapshot = toWorkspaceSnapshot(state);
    state.setSaveStatus("saving");
    const result = await repository.save(snapshot);
    if (result.ok) {
      lastSavedDocument = state.document;
      lastSavedView = copyViewport(state.viewport);
      store.getState().setSaveStatus("saved", now().toISOString());
      store.getState().setMessage(undefined);
      return result;
    }

    store.getState().setSaveStatus("error");
    store.getState().setMessage(result.error.message);
    return result;
  }

  function isDirty(state: EditorStore): boolean {
    if (lastSavedDocument === undefined || lastSavedView === undefined) {
      return true;
    }
    return (
      state.document !== lastSavedDocument ||
      state.viewport.x !== lastSavedView.x ||
      state.viewport.y !== lastSavedView.y ||
      state.viewport.zoom !== lastSavedView.zoom
    );
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

      const snapshot = result.value;
      if (snapshot === undefined) {
        return result;
      }

      suppressCommit = true;
      store.getState().hydrateWorkspace(snapshot.document, snapshot.view);
      lastSavedDocument = snapshot.document;
      lastSavedView = copyViewport(snapshot.view);
      suppressCommit = false;
      store.getState().setSaveStatus("saved", now().toISOString());
      store.getState().setMessage(undefined);
      return result;
    },

    flush() {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      return writeNow();
    },

    allowOverwrite() {
      blockedByCorrupt = false;
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
    state.history.future !== previous.history.future
  );
}

function toWorkspaceSnapshot(state: EditorStore): WorkspaceSnapshot {
  return {
    storageVersion: STORAGE_VERSION,
    document: state.document,
    view: copyViewport(state.viewport),
  };
}

function copyViewport(viewport: Viewport): Viewport {
  return {
    x: viewport.x,
    y: viewport.y,
    zoom: viewport.zoom,
  };
}
