import {
  DEFAULT_VIEWPORT,
  STORAGE_VERSION,
} from "../domain/diagram/defaults.ts";
import { createDiagramDocument } from "../domain/diagram/factories.ts";
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
export const SAVED_ANNOUNCEMENT = "Diagrama guardado.";

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

    const state = store.getState();
    const snapshot = toWorkspaceSnapshot(state);
    state.setSaveStatus("saving");
    const result = await repository.save(snapshot);
    if (result.ok) {
      lastSavedDocument = state.document;
      lastSavedView = copyViewport(state.viewport);
      store.getState().setSaveStatus("saved", now().toISOString());
      store.getState().setMessage(announce ? SAVED_ANNOUNCEMENT : undefined);
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
        lastSavedDocument = store.getState().document;
        lastSavedView = copyViewport(store.getState().viewport);
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
      const nextDocument = createDiagramDocument();
      suppressCommit = true;
      store.getState().hydrateWorkspace(nextDocument, DEFAULT_VIEWPORT);
      store.getState().setTool("select");
      store.getState().setDialogMode("none");
      lastSavedDocument = undefined;
      lastSavedView = undefined;
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
