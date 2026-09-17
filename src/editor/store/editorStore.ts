import { createStore, type StoreApi } from "zustand/vanilla";
import { DEFAULT_VIEWPORT } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type DiagramFactoryDeps,
} from "../../domain/diagram/factories.ts";
import type {
  DiagramDocument,
  Viewport,
  WorkspaceDocumentEntry,
} from "../../domain/diagram/model.ts";
import type { ElementCopy } from "../../domain/diagram/operations.ts";
import { createEditorActions, type EditorActions } from "./actions.ts";
import { emptyHistory, type DocumentHistory } from "./history.ts";

export type EditorClipboard = {
  items: readonly ElementCopy[];
  pasteCount: number;
};

export const EDITOR_TOOLS = [
  "select",
  "actor",
  "use-case",
  "system-boundary",
  "association",
  "include",
  "extend",
  "lifeline",
  "sync-message",
  "reply-message",
  "class",
  "class-association",
  "aggregation",
  "composition",
  "generalization",
] as const;

export type EditorTool = (typeof EDITOR_TOOLS)[number];

export const SAVE_STATUSES = ["idle", "saving", "saved", "error"] as const;

export type SaveStatus = (typeof SAVE_STATUSES)[number];

export type DialogMode =
  | "none"
  | "help"
  | "export"
  | "new-diagram"
  | "invalid-document-file"
  | "recovery"
  | "storage-upgrade";

export type SelectionState = {
  elementIds: readonly string[];
  relationshipIds: readonly string[];
};

export type HoverState = {
  elementId: string | undefined;
  relationshipId: string | undefined;
};

export type UiState = {
  saveStatus: SaveStatus;
  lastSavedAt: string | undefined;
  message: string | undefined;
  dialogMode: DialogMode;
  editingElementId: string | undefined;
};

export type HistorySlice = DocumentHistory & {
  transactionBaseline: DiagramDocument | undefined;
};

export type EditorSlices = {
  document: DiagramDocument;
  documents: readonly WorkspaceDocumentEntry[];
  activeDocumentId: string;
  selection: SelectionState;
  viewport: Viewport;
  tool: EditorTool;
  history: HistorySlice;
  histories: Readonly<Record<string, DocumentHistory>>;
  hover: HoverState;
  ui: UiState;
  clipboard: EditorClipboard;
};

export type EditorStore = EditorSlices & EditorActions;

export type EditorStoreApi = StoreApi<EditorStore>;

export type CreateEditorStoreOptions = {
  document?: DiagramDocument;
  viewport?: Viewport;
  deps?: DiagramFactoryDeps;
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

function createInitialSlices(options?: CreateEditorStoreOptions): EditorSlices {
  const viewport = options?.viewport ?? DEFAULT_VIEWPORT;
  const document = options?.document ?? createDiagramDocument(options?.deps);
  const view = { x: viewport.x, y: viewport.y, zoom: viewport.zoom };

  return {
    document,
    documents: [{ document, view }],
    activeDocumentId: document.id,
    selection: EMPTY_SELECTION,
    viewport: view,
    tool: "select",
    history: {
      ...emptyHistory(),
      transactionBaseline: undefined,
    },
    histories: {},
    hover: EMPTY_HOVER,
    ui: {
      saveStatus: "idle",
      lastSavedAt: undefined,
      message: undefined,
      dialogMode: "none",
      editingElementId: undefined,
    },
    clipboard: EMPTY_CLIPBOARD,
  };
}

export function createEditorStore(
  options?: CreateEditorStoreOptions,
): EditorStoreApi {
  return createStore<EditorStore>()((set, get) => ({
    ...createInitialSlices(options),
    ...createEditorActions(set, get, options?.deps),
  }));
}
