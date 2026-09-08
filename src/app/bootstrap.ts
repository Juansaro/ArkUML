import {
  DEFAULT_BOUNDARY_NAME,
  DEFAULT_DOCUMENT_TITLE,
} from "../domain/diagram/defaults.ts";
import type {
  EditorStore,
  EditorStoreApi,
} from "../editor/store/editorStore.ts";
import { createEditorStore } from "../editor/store/editorStore.ts";
import {
  createAutosaveCoordinator,
  type AutosaveCoordinator,
} from "../persistence/autosaveCoordinator.ts";
import type { DiagramRepository } from "../persistence/diagramRepository.ts";
import { createLocalStorageDiagramRepository } from "../persistence/localStorageDiagramRepository.ts";

export type WorkspaceSession = {
  store: EditorStoreApi;
  coordinator: AutosaveCoordinator;
  repository: DiagramRepository;
};

export type BootstrapOptions = {
  store?: EditorStoreApi;
  repository?: DiagramRepository;
  now?: () => Date;
  eventTarget?: EventTarget;
};

export function createWorkspaceSession(
  options: BootstrapOptions = {},
): WorkspaceSession {
  const store = options.store ?? createEditorStore();
  const repository =
    options.repository ?? createLocalStorageDiagramRepository();
  const coordinator = createAutosaveCoordinator({
    store,
    repository,
    ...(options.now === undefined ? {} : { now: options.now }),
    ...(options.eventTarget === undefined
      ? {}
      : { eventTarget: options.eventTarget }),
  });
  return { store, coordinator, repository };
}

export async function bootstrapWorkspace(
  options: BootstrapOptions = {},
): Promise<WorkspaceSession> {
  const session = createWorkspaceSession(options);
  const result = await session.coordinator.hydrate();
  if (!result.ok && result.error.code === "PARSE_INVALID") {
    session.store.getState().setDialogMode("recovery");
  }
  return session;
}

export function workspaceNeedsNewDiagramConfirmation(
  state: EditorStore,
  overwriteBlocked: boolean,
): boolean {
  if (overwriteBlocked) {
    return true;
  }
  if (state.history.past.length > 0 || state.history.future.length > 0) {
    return true;
  }
  if (state.ui.lastSavedAt !== undefined) {
    return true;
  }
  const { document } = state;
  if (document.elements.length !== 1 || document.relationships.length > 0) {
    return true;
  }
  const [element] = document.elements;
  if (element === undefined || element.kind !== "system-boundary") {
    return true;
  }
  if (element.name !== DEFAULT_BOUNDARY_NAME) {
    return true;
  }
  return document.metadata.title !== DEFAULT_DOCUMENT_TITLE;
}
