import { createStore, type StoreApi } from "zustand/vanilla";
import { DEFAULT_VIEWPORT } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type DiagramFactoryDeps,
} from "../../domain/diagram/factories.ts";
import type { DiagramDocument, Viewport } from "../../domain/diagram/model.ts";
import { createEditorActions, type EditorActions } from "./actions.ts";
import { emptyHistory, type DocumentHistory } from "./history.ts";

export const EDITOR_TOOLS = [
  "select",
  "actor",
  "use-case",
  "system-boundary",
  "association",
  "include",
  "extend",
] as const;

export type EditorTool = (typeof EDITOR_TOOLS)[number];

export const SAVE_STATUSES = ["idle", "saving", "saved", "error"] as const;

export type SaveStatus = (typeof SAVE_STATUSES)[number];

export type DialogMode =
  "none" | "help" | "export" | "new-diagram" | "recovery";

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
  selection: SelectionState;
  viewport: Viewport;
  tool: EditorTool;
  history: HistorySlice;
  hover: HoverState;
  ui: UiState;
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

function createInitialSlices(options?: CreateEditorStoreOptions): EditorSlices {
  const viewport = options?.viewport ?? DEFAULT_VIEWPORT;

  return {
    document: options?.document ?? createDiagramDocument(options?.deps),
    selection: EMPTY_SELECTION,
    viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
    tool: "select",
    history: {
      ...emptyHistory(),
      transactionBaseline: undefined,
    },
    hover: EMPTY_HOVER,
    ui: {
      saveStatus: "idle",
      lastSavedAt: undefined,
      message: undefined,
      dialogMode: "none",
      editingElementId: undefined,
    },
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
