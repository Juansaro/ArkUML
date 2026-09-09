import type {
  DiagramDocument,
  DiagramElement,
  RelationshipKind,
  Viewport,
} from "../../domain/diagram/model.ts";
import {
  elementAccessibleName,
  elementTypeLabel,
  relationshipTypeLabel,
} from "../a11y/labels.ts";
import {
  collectWarnings,
  type DiagramWarning,
} from "../../domain/diagram/validation.ts";
import type {
  DialogMode,
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

export function selectSelectedRelationshipIds(
  state: EditorStore,
): readonly string[] {
  return state.selection.relationshipIds;
}

export function selectEditingElementId(state: EditorStore): string | undefined {
  return state.ui.editingElementId;
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

export type VisibleDiagramWarning = DiagramWarning & {
  label: string;
};

type WarningsCacheEntry = {
  warnings: readonly VisibleDiagramWarning[];
};

const EMPTY_WARNINGS: readonly VisibleDiagramWarning[] = [];
const warningsCache = new WeakMap<DiagramDocument, WarningsCacheEntry>();

export function selectDiagramWarnings(
  state: EditorStore,
): readonly VisibleDiagramWarning[] {
  if (state.history.transactionBaseline !== undefined) {
    return EMPTY_WARNINGS;
  }
  const { warnings } = warningsFor(state.document);
  return warnings.length === 0 ? EMPTY_WARNINGS : warnings;
}

export function selectLiveAnnouncement(state: EditorStore): string {
  return state.ui.message ?? "";
}

function warningsFor(document: DiagramDocument): WarningsCacheEntry {
  const cached = warningsCache.get(document);
  if (cached !== undefined) {
    return cached;
  }
  const warnings = collectWarnings(document).map((warning) => ({
    ...warning,
    label: formatWarning(document, warning),
  }));
  const entry: WarningsCacheEntry = {
    warnings: warnings.length === 0 ? EMPTY_WARNINGS : warnings,
  };
  warningsCache.set(document, entry);
  return entry;
}

function formatWarning(
  document: DiagramDocument,
  warning: DiagramWarning,
): string {
  const element = document.elements.find(
    (candidate) => candidate.id === warning.elementId,
  );
  if (element === undefined) {
    return warning.message;
  }
  return `${element.name}: ${warning.message}`;
}

export function selectDialogMode(state: EditorStore): DialogMode {
  return state.ui.dialogMode;
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
      sourceLabel: string;
      targetLabel: string;
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
    sourceLabel: endpointLabel(state.document, relationship.sourceId),
    targetLabel: endpointLabel(state.document, relationship.targetId),
  };
}

function endpointLabel(document: DiagramDocument, elementId: string): string {
  const element = document.elements.find(
    (candidate) => candidate.id === elementId,
  );
  if (element === undefined) {
    return "—";
  }
  return elementAccessibleName(element);
}
