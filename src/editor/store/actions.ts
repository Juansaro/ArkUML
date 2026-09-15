import type { StoreApi } from "zustand/vanilla";
import {
  DEFAULT_VIEWPORT,
  SEQUENCE_DOCUMENT_KIND,
} from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  createEmptySequenceDocument,
  type DiagramFactoryDeps,
} from "../../domain/diagram/factories.ts";
import type {
  DiagramDocument,
  DocumentKind,
  Geometry,
  Result,
  Viewport,
  WorkspaceDocumentEntry,
  WorkspaceSnapshot,
} from "../../domain/diagram/model.ts";
import {
  createElement,
  createLifeline as createLifelineOperation,
  createRelationship,
  deleteElements as deleteElementsOperation,
  deleteRelationships as deleteRelationshipsOperation,
  duplicateElements as duplicateElementsOperation,
  insertElementCopies as insertElementCopiesOperation,
  moveElements,
  moveMessage as moveMessageOperation,
  reconnectRelationship as reconnectRelationshipOperation,
  renameElement as renameElementOperation,
  renameRelationship as renameRelationshipOperation,
  reparentUseCase as reparentUseCaseOperation,
  resizeBoundary,
  type CreateElementInput,
  type CreateRelationshipInput,
  type ElementCopy,
  type ElementMove,
  type ReconnectRelationshipInput,
} from "../../domain/diagram/operations.ts";
import type {
  DialogMode,
  EditorClipboard,
  EditorStore,
  EditorTool,
  HistorySlice,
  HoverState,
  SaveStatus,
  SelectionState,
  UiState,
} from "./editorStore.ts";
import { isToolForDocumentKind } from "../diagramKinds.ts";
import {
  emptyHistory,
  recordMutation,
  redoHistory,
  undoHistory,
  type DocumentHistory,
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
  createLifeline: (input: {
    name: string;
    geometry?: Geometry;
    stemLength?: number;
  }) => Result<DiagramDocument>;
  renameElement: (elementId: string, name: string) => Result<DiagramDocument>;
  renameRelationship: (
    relationshipId: string,
    name: string,
  ) => Result<DiagramDocument>;
  commitMove: (moves: readonly ElementMove[]) => Result<DiagramDocument>;
  moveMessage: (input: { id: string; y: number }) => Result<DiagramDocument>;
  commitResize: (input: {
    id: string;
    geometry: Geometry;
  }) => Result<DiagramDocument>;
  reparentUseCase: (
    useCaseId: string,
    parentId: string | undefined,
  ) => Result<DiagramDocument>;
  connect: (input: CreateRelationshipInput) => Result<DiagramDocument>;
  reconnect: (input: ReconnectRelationshipInput) => Result<DiagramDocument>;
  deleteElements: (elementIds: readonly string[]) => Result<DiagramDocument>;
  deleteRelationships: (
    relationshipIds: readonly string[],
  ) => Result<DiagramDocument>;
  duplicateElements: (elementIds: readonly string[]) => Result<DiagramDocument>;
  insertElementCopies: (
    copies: readonly ElementCopy[],
    offset: number,
  ) => Result<DiagramDocument>;
  setClipboard: (items: readonly ElementCopy[]) => void;
  bumpClipboardPasteCount: () => void;
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
  hydrateWorkspaceSnapshot: (snapshot: WorkspaceSnapshot) => void;
  addDocument: (document: DiagramDocument, viewport?: Viewport) => boolean;
  addNewDocument: (kind?: DocumentKind) => boolean;
  activateDocument: (documentId: string) => boolean;
  deleteDocument: (documentId: string) => boolean;
};

const EMPTY_SELECTION: SelectionState = {
  elementIds: [],
  relationshipIds: [],
};

const EMPTY_HOVER: HoverState = {
  elementId: undefined,
  relationshipId: undefined,
};

const EMPTY_CLIPBOARD: EditorClipboard = {
  items: [],
  pasteCount: 0,
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
    createLifeline: (input) =>
      apply((document) => createLifelineOperation(document, input, deps)),
    renameElement: (elementId, name) =>
      apply((document) =>
        renameElementOperation(document, elementId, name, deps),
      ),
    renameRelationship: (relationshipId, name) =>
      apply((document) =>
        renameRelationshipOperation(document, relationshipId, name, deps),
      ),
    commitMove: (moves) =>
      apply((document) => moveElements(document, moves, deps)),
    moveMessage: (input) =>
      apply((document) => moveMessageOperation(document, input, deps)),
    commitResize: (input) =>
      apply((document) => resizeBoundary(document, input, deps)),
    reparentUseCase: (useCaseId, parentId) =>
      apply((document) =>
        reparentUseCaseOperation(document, useCaseId, parentId, deps),
      ),
    connect: (input) =>
      apply((document) => createRelationship(document, input, deps)),
    reconnect: (input) =>
      apply((document) =>
        reconnectRelationshipOperation(document, input, deps),
      ),
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
    insertElementCopies: (copies, offset) =>
      apply((document) =>
        insertElementCopiesOperation(document, copies, offset, deps),
      ),
    setClipboard: (items) => {
      set({
        clipboard: {
          items: items.map(cloneElementCopy),
          pasteCount: 0,
        },
      });
    },
    bumpClipboardPasteCount: () => {
      const state = get();
      set({
        clipboard: {
          items: state.clipboard.items,
          pasteCount: state.clipboard.pasteCount + 1,
        },
      });
    },
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
        documents: replaceActiveEntry(state, baseline),
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
      const state = get();
      set({
        tool: isToolForDocumentKind(state.document.kind, tool) ? tool : "select",
      });
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
          ? copyViewport(state.viewport)
          : copyViewport(viewport);
      set({
        document,
        documents: [{ document, view: nextViewport }],
        activeDocumentId: document.id,
        viewport: nextViewport,
        selection: EMPTY_SELECTION,
        hover: EMPTY_HOVER,
        history: {
          ...emptyHistory(),
          transactionBaseline: undefined,
        },
        histories: {},
        ui: {
          ...state.ui,
          message: undefined,
          editingElementId: undefined,
        },
        clipboard: EMPTY_CLIPBOARD,
        tool: "select",
      });
    },
    hydrateWorkspaceSnapshot: (snapshot) => {
      const state = get();
      const documents = snapshot.documents.map((entry) => ({
        document: entry.document,
        view: copyViewport(entry.view),
      }));
      const active =
        documents.find(
          (entry) => entry.document.id === snapshot.activeDocumentId,
        ) ?? documents[0];
      if (active === undefined) {
        return;
      }
      set({
        document: active.document,
        documents,
        activeDocumentId: active.document.id,
        viewport: copyViewport(active.view),
        selection: EMPTY_SELECTION,
        hover: EMPTY_HOVER,
        history: {
          ...emptyHistory(),
          transactionBaseline: undefined,
        },
        histories: {},
        ui: {
          ...state.ui,
          message: undefined,
          editingElementId: undefined,
        },
        clipboard: EMPTY_CLIPBOARD,
        tool: "select",
      });
    },
    addDocument: (document, viewport) => {
      const state = get();
      if (state.history.transactionBaseline !== undefined) {
        return false;
      }
      if (state.documents.some((entry) => entry.document.id === document.id)) {
        return false;
      }
      const view =
        viewport === undefined
          ? copyViewport(DEFAULT_VIEWPORT)
          : copyViewport(viewport);
      set({
        document,
        documents: [
          ...replaceActiveEntry(state, state.document),
          { document, view },
        ],
        activeDocumentId: document.id,
        viewport: view,
        selection: EMPTY_SELECTION,
        hover: EMPTY_HOVER,
        history: {
          ...emptyHistory(),
          transactionBaseline: undefined,
        },
        histories: stashActiveHistory(state),
        ui: {
          ...state.ui,
          message: undefined,
          editingElementId: undefined,
        },
        tool: "select",
      });
      return true;
    },
    addNewDocument: (kind) => {
      const state = get();
      const nextKind = kind ?? state.document.kind;
      const document =
        nextKind === SEQUENCE_DOCUMENT_KIND
          ? createEmptySequenceDocument(deps)
          : createDiagramDocument(deps);
      return get().addDocument(document);
    },
    activateDocument: (documentId) => {
      const state = get();
      if (documentId === state.activeDocumentId) {
        return true;
      }
      if (state.history.transactionBaseline !== undefined) {
        return false;
      }
      const documents = replaceActiveEntry(state, state.document);
      const target = documents.find(
        (entry) => entry.document.id === documentId,
      );
      if (target === undefined) {
        return false;
      }
      const histories = stashActiveHistory(state);
      const incoming = histories[documentId] ?? emptyHistory();
      set({
        document: target.document,
        documents,
        activeDocumentId: documentId,
        viewport: copyViewport(target.view),
        selection: EMPTY_SELECTION,
        hover: EMPTY_HOVER,
        history: {
          ...incoming,
          transactionBaseline: undefined,
        },
        histories,
        ui: {
          ...state.ui,
          message: undefined,
          editingElementId: undefined,
        },
        tool: "select",
      });
      return true;
    },
    deleteDocument: (documentId) => {
      const state = get();
      if (state.history.transactionBaseline !== undefined) {
        return false;
      }
      if (state.documents.length <= 1) {
        return false;
      }
      if (!state.documents.some((entry) => entry.document.id === documentId)) {
        return false;
      }

      const remaining = state.documents.filter(
        (entry) => entry.document.id !== documentId,
      );
      const histories = omitHistory(
        documentId === state.activeDocumentId
          ? state.histories
          : stashActiveHistory(state),
        documentId,
      );

      if (documentId !== state.activeDocumentId) {
        set({
          documents: remaining,
          histories,
        });
        return true;
      }

      const next = remaining[0];
      if (next === undefined) {
        return false;
      }
      const incoming = histories[next.document.id] ?? emptyHistory();
      set({
        document: next.document,
        documents: remaining,
        activeDocumentId: next.document.id,
        viewport: copyViewport(next.view),
        selection: EMPTY_SELECTION,
        hover: EMPTY_HOVER,
        history: {
          ...incoming,
          transactionBaseline: undefined,
        },
        histories,
        ui: {
          ...state.ui,
          message: undefined,
          editingElementId: undefined,
        },
        tool: "select",
      });
      return true;
    },
  };
}

function cloneElementCopy(copy: ElementCopy): ElementCopy {
  const geometry = {
    x: copy.geometry.x,
    y: copy.geometry.y,
    width: copy.geometry.width,
    height: copy.geometry.height,
  };
  if (copy.kind === "actor") {
    return { kind: "actor", name: copy.name, geometry };
  }
  if (copy.kind === "lifeline") {
    return {
      kind: "lifeline",
      name: copy.name,
      geometry,
      stemLength: copy.stemLength,
    };
  }
  if (copy.parentId !== undefined) {
    return {
      kind: "use-case",
      name: copy.name,
      geometry,
      parentId: copy.parentId,
    };
  }
  return { kind: "use-case", name: copy.name, geometry };
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
    documents: replaceActiveEntry(state, nextDocument),
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
    documents: replaceActiveEntry(state, document),
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

function copyViewport(viewport: Viewport): Viewport {
  return { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
}

function replaceActiveEntry(
  state: EditorStore,
  document: DiagramDocument,
): WorkspaceDocumentEntry[] {
  const nextView = copyViewport(state.viewport);
  return state.documents.map((entry) =>
    entry.document.id === state.activeDocumentId
      ? { document, view: nextView }
      : entry,
  );
}

function stashActiveHistory(
  state: EditorStore,
): Readonly<Record<string, DocumentHistory>> {
  return {
    ...state.histories,
    [state.activeDocumentId]: stacksOf(state.history),
  };
}

function omitHistory(
  histories: Readonly<Record<string, DocumentHistory>>,
  documentId: string,
): Readonly<Record<string, DocumentHistory>> {
  const next: Record<string, DocumentHistory> = {};
  for (const [id, history] of Object.entries(histories)) {
    if (id !== documentId) {
      next[id] = history;
    }
  }
  return next;
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
