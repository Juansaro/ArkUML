import type {
  DiagramDocument,
  DiagramElement,
  RelationshipKind,
  Viewport,
} from "../../domain/diagram/model.ts";
import type {
  EditorStore,
  EditorTool,
  HoverState,
  SaveStatus,
  SelectionState,
  UiState,
} from "./editorStore.ts";
import { canRedo, canUndo } from "./history.ts";

export { shallow } from "zustand/vanilla/shallow";

export function selectDocument(state: EditorStore): DiagramDocument {
  return state.document;
}

export function selectDocumentTitle(state: EditorStore): string {
  return state.document.metadata.title;
}

export function selectViewport(state: EditorStore): Viewport {
  return state.viewport;
}

export function selectSelection(state: EditorStore): SelectionState {
  return state.selection;
}

export function selectSelectedElementIds(
  state: EditorStore,
): readonly string[] {
  return state.selection.elementIds;
}

export function selectTool(state: EditorStore): EditorTool {
  return state.tool;
}

export function selectHasSystemBoundary(state: EditorStore): boolean {
  return state.document.elements.some(
    (element) => element.kind === "system-boundary",
  );
}

export function selectHover(state: EditorStore): HoverState {
  return state.hover;
}

export function selectUi(state: EditorStore): UiState {
  return state.ui;
}

export function selectSaveStatus(state: EditorStore): SaveStatus {
  return state.ui.saveStatus;
}

export function selectMessage(state: EditorStore): string | undefined {
  return state.ui.message;
}

export function selectCanUndo(state: EditorStore): boolean {
  return (
    state.history.transactionBaseline === undefined && canUndo(state.history)
  );
}

export function selectCanRedo(state: EditorStore): boolean {
  return (
    state.history.transactionBaseline === undefined && canRedo(state.history)
  );
}

export function selectIsTransacting(state: EditorStore): boolean {
  return state.history.transactionBaseline !== undefined;
}

export function selectEditingElementId(state: EditorStore): string | undefined {
  return state.ui.editingElementId;
}

export type InspectorView =
  | { status: "empty" }
  | { status: "multiple"; count: number }
  | {
      status: "element";
      id: string;
      kind: DiagramElement["kind"];
      name: string;
      typeLabel: string;
    }
  | {
      status: "relationship";
      id: string;
      kind: RelationshipKind;
      typeLabel: string;
    };

const EMPTY_INSPECTOR_VIEW: InspectorView = { status: "empty" };

export function selectInspectorView(state: EditorStore): InspectorView {
  const { elementIds, relationshipIds } = state.selection;
  const count = elementIds.length + relationshipIds.length;
  if (count === 0) {
    return EMPTY_INSPECTOR_VIEW;
  }
  if (count > 1) {
    return { status: "multiple", count };
  }

  const elementId = elementIds[0];
  if (elementId !== undefined) {
    const element = state.document.elements.find(
      (candidate) => candidate.id === elementId,
    );
    if (element === undefined) {
      return EMPTY_INSPECTOR_VIEW;
    }
    return {
      status: "element",
      id: element.id,
      kind: element.kind,
      name: element.name,
      typeLabel: elementTypeLabel(element.kind),
    };
  }

  const relationshipId = relationshipIds[0];
  if (relationshipId === undefined) {
    return EMPTY_INSPECTOR_VIEW;
  }
  const relationship = state.document.relationships.find(
    (candidate) => candidate.id === relationshipId,
  );
  if (relationship === undefined) {
    return EMPTY_INSPECTOR_VIEW;
  }
  return {
    status: "relationship",
    id: relationship.id,
    kind: relationship.kind,
    typeLabel: relationshipTypeLabel(relationship.kind),
  };
}

export function elementTypeLabel(kind: DiagramElement["kind"]): string {
  if (kind === "actor") {
    return "Actor";
  }
  if (kind === "use-case") {
    return "Caso de uso";
  }
  return "Límite del sistema";
}

export function relationshipTypeLabel(kind: RelationshipKind): string {
  if (kind === "association") {
    return "Asociación";
  }
  if (kind === "include") {
    return "Include";
  }
  return "Extend";
}
