import type {
  Anchor,
  AssociationMultiplicity,
  ClassRelationshipKind,
  ComponentRelationshipKind,
  DeploymentRelationshipKind,
  DiagramDocument,
  DiagramElement,
  DocumentKind,
  SequenceMessageKind,
  UseCaseRelationshipKind,
  Viewport,
} from "../../domain/diagram/model.ts";
import {
  isClassAssociation,
  isClassRelationship,
  isComponentRelationship,
  isDeploymentRelationship,
  isSequenceMessage,
  isUmlClass,
  isUseCaseRelationship,
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

export function selectDocumentKind(state: EditorStore): DocumentKind {
  return state.document.kind;
}

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

export function selectClipboardItems(
  state: EditorStore,
): EditorStore["clipboard"]["items"] {
  return state.clipboard.items;
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
      attributes?: readonly string[];
      operations?: readonly string[];
    }
  | {
      status: "relationship";
      id: string;
      kind: UseCaseRelationshipKind;
      typeLabel: string;
      sourceId: string;
      targetId: string;
      sourceAnchor: Anchor;
      targetAnchor: Anchor;
      sourceLabel: string;
      targetLabel: string;
    }
  | {
      status: "message";
      id: string;
      kind: SequenceMessageKind;
      typeLabel: string;
      name: string;
      sourceId: string;
      targetId: string;
      sourceLabel: string;
      targetLabel: string;
    }
  | {
      status: "class-relationship";
      id: string;
      kind: ClassRelationshipKind;
      typeLabel: string;
      name: string;
      sourceId: string;
      targetId: string;
      sourceLabel: string;
      targetLabel: string;
      sourceMultiplicity?: AssociationMultiplicity;
      targetMultiplicity?: AssociationMultiplicity;
    }
  | {
      status: "component-relationship";
      id: string;
      kind: ComponentRelationshipKind;
      typeLabel: string;
      name: string;
      sourceId: string;
      targetId: string;
      sourceLabel: string;
      targetLabel: string;
    }
  | {
      status: "deployment-relationship";
      id: string;
      kind: DeploymentRelationshipKind;
      typeLabel: string;
      name: string;
      sourceId: string;
      targetId: string;
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
      ...(isUmlClass(element)
        ? { attributes: element.attributes, operations: element.operations }
        : {}),
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
  if (isSequenceMessage(relationship)) {
    return {
      status: "message",
      id: relationship.id,
      kind: relationship.kind,
      typeLabel: relationshipTypeLabel(relationship.kind),
      name: relationship.name,
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      sourceLabel: endpointLabel(state.document, relationship.sourceId),
      targetLabel: endpointLabel(state.document, relationship.targetId),
    };
  }
  if (isClassRelationship(relationship)) {
    return {
      status: "class-relationship",
      id: relationship.id,
      kind: relationship.kind,
      typeLabel: relationshipTypeLabel(relationship.kind),
      name: relationship.name,
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      sourceLabel: endpointLabel(state.document, relationship.sourceId),
      targetLabel: endpointLabel(state.document, relationship.targetId),
      ...(isClassAssociation(relationship)
        ? {
            sourceMultiplicity: relationship.sourceMultiplicity,
            targetMultiplicity: relationship.targetMultiplicity,
          }
        : {}),
    };
  }
  if (isComponentRelationship(relationship)) {
    return {
      status: "component-relationship",
      id: relationship.id,
      kind: relationship.kind,
      typeLabel: relationshipTypeLabel(relationship.kind),
      name: relationship.name,
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      sourceLabel: endpointLabel(state.document, relationship.sourceId),
      targetLabel: endpointLabel(state.document, relationship.targetId),
    };
  }
  if (isDeploymentRelationship(relationship)) {
    return {
      status: "deployment-relationship",
      id: relationship.id,
      kind: relationship.kind,
      typeLabel: relationshipTypeLabel(relationship.kind),
      name: relationship.name,
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      sourceLabel: endpointLabel(state.document, relationship.sourceId),
      targetLabel: endpointLabel(state.document, relationship.targetId),
    };
  }
  if (!isUseCaseRelationship(relationship)) {
    return EMPTY_INSPECTOR_VIEW;
  }
  return {
    status: "relationship",
    id: relationship.id,
    kind: relationship.kind,
    typeLabel: relationshipTypeLabel(relationship.kind),
    sourceId: relationship.sourceId,
    targetId: relationship.targetId,
    sourceAnchor: relationship.sourceAnchor,
    targetAnchor: relationship.targetAnchor,
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
