import type { StoreApi } from "zustand/vanilla";
import type { DiagramFactoryDeps } from "../../domain/diagram/factories.ts";
import type {
  DiagramDocument,
  Geometry,
  Result,
  Viewport,
} from "../../domain/diagram/model.ts";
import {
  createElement,
  createRelationship,
  deleteElements as deleteElementsOperation,
  deleteRelationships as deleteRelationshipsOperation,
  duplicateElements as duplicateElementsOperation,
  moveElements,
  renameElement as renameElementOperation,
  reparentUseCase as reparentUseCaseOperation,
  resizeBoundary,
  type CreateElementInput,
  type CreateRelationshipInput,
  type ElementMove,
} from "../../domain/diagram/operations.ts";
import type {
  DialogMode,
  EditorStore,
  EditorTool,
  HistorySlice,
  HoverState,
  SaveStatus,
  SelectionState,
  UiState,
} from "./editorStore.ts";
import {
  emptyHistory,
  recordMutation,
  redoHistory,
  undoHistory,
} from "./history.ts";

type SetEditorState = StoreApi<EditorStore>["setState"];
type GetEditorState = StoreApi<EditorStore>["getState"];

export type EditorActions = {
  createActor: (input: {
    name: string;
    geometry: Geometry;
  }) => Result<DiagramDocument>;
  createUseCase: (input: {
    name: string;
    geometry: Geometry;
    parentId?: string;
  }) => Result<DiagramDocument>;
  createSystemBoundary: (input: {
    name: string;
    geometry: Geometry;
  }) => Result<DiagramDocument>;
  renameElement: (elementId: string, name: string) => Result<DiagramDocument>;
  commitMove: (moves: readonly ElementMove[]) => Result<DiagramDocument>;
  commitResize: (input: {
    id: string;
    geometry: Geometry;
  }) => Result<DiagramDocument>;
  reparentUseCase: (
    useCaseId: string,
    parentId: string | undefined,
  ) => Result<DiagramDocument>;
  connect: (input: CreateRelationshipInput) => Result<DiagramDocument>;
  deleteElements: (elementIds: readonly string[]) => Result<DiagramDocument>;
  deleteRelationships: (
    relationshipIds: readonly string[],
  ) => Result<DiagramDocument>;
  duplicateElements: (elementIds: readonly string[]) => Result<DiagramDocument>;
  beginTransaction: () => void;
  commitTransaction: () => void;
  cancelTransaction: () => void;
  undo: () => boolean;
  redo: () => boolean;
  setSelection: (selection: SelectionState) => void;
  clearSelection: () => void;
  beginRename: (elementId: string) => void;
  endRename: () => void;
  setViewport: (viewport: Viewport) => void;
  setTool: (tool: EditorTool) => void;
  setHover: (hover: HoverState) => void;
  setSaveStatus: (saveStatus: SaveStatus, lastSavedAt?: string) => void;
  setMessage: (message: string | undefined) => void;
  setDialogMode: (dialogMode: DialogMode) => void;
  hydrateWorkspace: (document: DiagramDocument, viewport?: Viewport) => void;
};

const EMPTY_SELECTION: SelectionState = {
  elementIds: [],
  relationshipIds: [],
};

const EMPTY_HOVER: HoverState = {
  elementId: undefined,
  relationshipId: undefined,
};

export function createEditorActions(
  set: SetEditorState,
  get: GetEditorState,
  deps: DiagramFactoryDeps | undefined,
): EditorActions {
  const apply = (
    operate: (document: DiagramDocument) => Result<DiagramDocument>,
  ): Result<DiagramDocument> => applyDocumentOperation(set, get, operate);

  return {
    createActor: (input) =>
      apply((document) =>
        createElement(
          document,
          { kind: "actor", name: input.name, geometry: input.geometry },
          deps,
        ),
      ),
    createUseCase: (input) =>
      apply((document) => createElement(document, useCaseInput(input), deps)),
    createSystemBoundary: (input) =>
      apply((document) =>
        createElement(
          document,
          {
            kind: "system-boundary",
            name: input.name,
            geometry: input.geometry,
          },
          deps,
        ),
      ),
    renameElement: (elementId, name) =>
      apply((document) =>
        renameElementOperation(document, elementId, name, deps),
      ),
    commitMove: (moves) =>
      apply((document) => moveElements(document, moves, deps)),
    commitResize: (input) =>
      apply((document) => resizeBoundary(document, input, deps)),
    reparentUseCase: (useCaseId, parentId) =>
      apply((document) =>
        reparentUseCaseOperation(document, useCaseId, parentId, deps),
      ),
    connect: (input) =>
      apply((document) => createRelationship(document, input, deps)),
    deleteElements: (elementIds) =>
      apply((document) => deleteElementsOperation(document, elementIds, deps)),
    deleteRelationships: (relationshipIds) =>
      apply((document) =>
        deleteRelationshipsOperation(document, relationshipIds, deps),
      ),
    duplicateElements: (elementIds) =>
      apply((document) =>
        duplicateElementsOperation(document, elementIds, deps),
      ),
    beginTransaction: () => {
      const state = get();
      if (state.history.transactionBaseline !== undefined) {
        return;
      }
      set({
        history: {
          ...state.history,
          transactionBaseline: state.document,
        },
      });
    },
    commitTransaction: () => {
      const state = get();
      const baseline = state.history.transactionBaseline;
      if (baseline === undefined) {
        return;
      }
      if (state.document === baseline) {
        set({
          history: {
            ...state.history,
            transactionBaseline: undefined,
          },
        });
        return;
      }
      set({
        history: {
          ...recordMutation(stacksOf(state.history), baseline),
          transactionBaseline: undefined,
        },
      });
    },
    cancelTransaction: () => {
      const state = get();
      const baseline = state.history.transactionBaseline;
      if (baseline === undefined) {
        return;
      }
      set({
        document: baseline,
        history: {
          ...state.history,
          transactionBaseline: undefined,
        },
      });
    },
    undo: () => {
      const state = get();
      if (state.history.transactionBaseline !== undefined) {
        return false;
      }
      const stepped = undoHistory(stacksOf(state.history), state.document);
      if (stepped === undefined) {
        return false;
      }
      set(
        documentPatch(state, stepped.document, {
          ...stepped.history,
          transactionBaseline: undefined,
        }),
      );
      return true;
    },
    redo: () => {
      const state = get();
      if (state.history.transactionBaseline !== undefined) {
        return false;
      }
      const stepped = redoHistory(stacksOf(state.history), state.document);
      if (stepped === undefined) {
        return false;
      }
      set(
        documentPatch(state, stepped.document, {
          ...stepped.history,
          transactionBaseline: undefined,
        }),
      );
      return true;
    },
    setSelection: (selection) => {
      const state = get();
      set({
        selection: {
          elementIds: [...selection.elementIds],
          relationshipIds: [...selection.relationshipIds],
        },
        ...renamePatchIfStale(state, selection.elementIds),
      });
    },
    clearSelection: () => {
      const state = get();
      set({
        selection: EMPTY_SELECTION,
        ...renamePatchIfStale(state, []),
      });
    },
    beginRename: (elementId) => {
      const state = get();
      const exists = state.document.elements.some(
        (element) => element.id === elementId,
      );
      if (!exists || state.ui.editingElementId === elementId) {
        return;
      }
      set({
        ui: {
          ...state.ui,
          editingElementId: elementId,
        },
      });
    },
    endRename: () => {
      const state = get();
      if (state.ui.editingElementId === undefined) {
        return;
      }
      set({
        ui: {
          ...state.ui,
          editingElementId: undefined,
        },
      });
    },
    setViewport: (viewport) => {
      set({
        viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
      });
    },
    setTool: (tool) => {
      set({ tool });
    },
    setHover: (hover) => {
      set({
        hover: {
          elementId: hover.elementId,
          relationshipId: hover.relationshipId,
        },
      });
    },
    setSaveStatus: (saveStatus, lastSavedAt) => {
      const state = get();
      set({
        ui: {
          ...state.ui,
          saveStatus,
          lastSavedAt:
            lastSavedAt !== undefined ? lastSavedAt : state.ui.lastSavedAt,
        },
      });
    },
    setMessage: (message) => {
      const state = get();
      set({
        ui: {
          ...state.ui,
          message,
        },
      });
    },
    setDialogMode: (dialogMode) => {
      const state = get();
      set({
        ui: {
          ...state.ui,
          dialogMode,
        },
      });
    },
    hydrateWorkspace: (document, viewport) => {
      const state = get();
      const nextViewport =
        viewport === undefined
          ? state.viewport
          : { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
      set({
        document,
        viewport: nextViewport,
        selection: EMPTY_SELECTION,
        hover: EMPTY_HOVER,
        history: {
          ...emptyHistory(),
          transactionBaseline: undefined,
        },
        ui: {
          ...state.ui,
          message: undefined,
          editingElementId: undefined,
        },
      });
    },
  };
}

function useCaseInput(input: {
  name: string;
  geometry: Geometry;
  parentId?: string;
}): CreateElementInput {
  if (input.parentId === undefined) {
    return {
      kind: "use-case",
      name: input.name,
      geometry: input.geometry,
    };
  }
  return {
    kind: "use-case",
    name: input.name,
    geometry: input.geometry,
    parentId: input.parentId,
  };
}

function applyDocumentOperation(
  set: SetEditorState,
  get: GetEditorState,
  operate: (document: DiagramDocument) => Result<DiagramDocument>,
): Result<DiagramDocument> {
  const state = get();
  const result = operate(state.document);
  if (!result.ok) {
    set({
      ui: { ...state.ui, message: result.error.message },
    });
    return result;
  }

  if (result.value === state.document) {
    if (state.ui.message !== undefined) {
      set({ ui: { ...state.ui, message: undefined } });
    }
    return result;
  }

  const nextDocument = result.value;
  const selection = retainSelection(state.selection, nextDocument);
  const hover = retainHover(state.hover, nextDocument);
  const ui = clearMessage(state.ui);
  const inTransaction = state.history.transactionBaseline !== undefined;

  set({
    document: nextDocument,
    ...(selection === state.selection ? {} : { selection }),
    ...(hover === state.hover ? {} : { hover }),
    ...(ui === state.ui ? {} : { ui }),
    ...(inTransaction
      ? {}
      : {
          history: {
            ...recordMutation(stacksOf(state.history), state.document),
            transactionBaseline: undefined,
          },
        }),
  });

  return result;
}

function documentPatch(
  state: EditorStore,
  document: DiagramDocument,
  history: HistorySlice,
): Partial<EditorStore> {
  const selection = retainSelection(state.selection, document);
  const hover = retainHover(state.hover, document);
  return {
    document,
    history,
    ...(selection === state.selection ? {} : { selection }),
    ...(hover === state.hover ? {} : { hover }),
  };
}

function retainSelection(
  selection: SelectionState,
  document: DiagramDocument,
): SelectionState {
  const elementIds = new Set(document.elements.map((element) => element.id));
  const relationshipIds = new Set(
    document.relationships.map((relationship) => relationship.id),
  );
  const elementsKept = selection.elementIds.every((id) => elementIds.has(id));
  const relationshipsKept = selection.relationshipIds.every((id) =>
    relationshipIds.has(id),
  );
  if (elementsKept && relationshipsKept) {
    return selection;
  }
  return {
    elementIds: selection.elementIds.filter((id) => elementIds.has(id)),
    relationshipIds: selection.relationshipIds.filter((id) =>
      relationshipIds.has(id),
    ),
  };
}

function retainHover(hover: HoverState, document: DiagramDocument): HoverState {
  const elementIds = new Set(document.elements.map((element) => element.id));
  const relationshipIds = new Set(
    document.relationships.map((relationship) => relationship.id),
  );
  const elementId =
    hover.elementId !== undefined && elementIds.has(hover.elementId)
      ? hover.elementId
      : undefined;
  const relationshipId =
    hover.relationshipId !== undefined &&
    relationshipIds.has(hover.relationshipId)
      ? hover.relationshipId
      : undefined;
  if (
    elementId === hover.elementId &&
    relationshipId === hover.relationshipId
  ) {
    return hover;
  }
  return { elementId, relationshipId };
}

function clearMessage(ui: UiState): UiState {
  if (ui.message === undefined) {
    return ui;
  }
  return { ...ui, message: undefined };
}

function stacksOf(history: HistorySlice) {
  return { past: history.past, future: history.future };
}

function renamePatchIfStale(
  state: EditorStore,
  elementIds: readonly string[],
): Partial<EditorStore> {
  const editingElementId = state.ui.editingElementId;
  if (editingElementId === undefined || elementIds.includes(editingElementId)) {
    return {};
  }
  return {
    ui: {
      ...state.ui,
      editingElementId: undefined,
    },
  };
}
