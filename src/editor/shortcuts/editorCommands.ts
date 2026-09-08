import type { DiagramDocument } from "../../domain/diagram/model.ts";
import type { ElementMove } from "../../domain/diagram/operations.ts";
import type { EditorStoreApi } from "../store/editorStore.ts";
import {
  isNudgeShortcut,
  NUDGE_DELTAS,
  type EditorShortcutId,
} from "./shortcutMap.ts";

export const DELETED_SELECTION_MESSAGE = "Se eliminó la selección.";

export type ShortcutRuntime = {
  fitView?: () => void;
  flushAutosave?: () => void;
};

export function dispatchEditorShortcut(
  store: EditorStoreApi,
  shortcut: EditorShortcutId,
  runtime?: ShortcutRuntime,
): void {
  if (shortcut === "delete") {
    deleteSelection(store);
    return;
  }
  if (shortcut === "undo") {
    store.getState().undo();
    return;
  }
  if (shortcut === "redo") {
    store.getState().redo();
    return;
  }
  if (shortcut === "duplicate") {
    duplicateSelection(store);
    return;
  }
  if (shortcut === "fitView") {
    runtime?.fitView?.();
    return;
  }
  if (shortcut === "save") {
    runtime?.flushAutosave?.();
    return;
  }
  if (isNudgeShortcut(shortcut)) {
    nudgeSelection(store, shortcut);
  }
}

export function deleteSelection(store: EditorStoreApi): boolean {
  const { elementIds, relationshipIds } = store.getState().selection;
  if (elementIds.length === 0 && relationshipIds.length === 0) {
    return false;
  }

  if (elementIds.length > 0 && relationshipIds.length > 0) {
    store.getState().beginTransaction();
    const elementsResult = store.getState().deleteElements(elementIds);
    if (!elementsResult.ok) {
      store.getState().cancelTransaction();
      return false;
    }
    const leftover = store.getState().selection.relationshipIds;
    if (leftover.length > 0) {
      const relationshipsResult = store
        .getState()
        .deleteRelationships(leftover);
      if (!relationshipsResult.ok) {
        store.getState().cancelTransaction();
        return false;
      }
    }
    store.getState().commitTransaction();
    store.getState().setMessage(DELETED_SELECTION_MESSAGE);
    return true;
  }

  const result =
    elementIds.length > 0
      ? store.getState().deleteElements(elementIds)
      : store.getState().deleteRelationships(relationshipIds);
  if (!result.ok) {
    return false;
  }
  store.getState().setMessage(DELETED_SELECTION_MESSAGE);
  return true;
}

export function duplicateSelection(store: EditorStoreApi): boolean {
  const elementIds = store.getState().selection.elementIds;
  if (elementIds.length === 0) {
    return false;
  }

  const idsBefore = new Set(
    store.getState().document.elements.map((element) => element.id),
  );
  const result = store.getState().duplicateElements(elementIds);
  if (!result.ok) {
    return false;
  }

  const copies = result.value.elements.filter(
    (element) => !idsBefore.has(element.id),
  );
  if (copies.length === 0) {
    return false;
  }

  store.getState().setSelection({
    elementIds: copies.map((element) => element.id),
    relationshipIds: [],
  });
  return true;
}

export function nudgeSelection(
  store: EditorStoreApi,
  shortcut: keyof typeof NUDGE_DELTAS,
): boolean {
  const state = store.getState();
  const moves = movesForNudge(
    state.document,
    state.selection.elementIds,
    NUDGE_DELTAS[shortcut],
  );
  if (moves.length === 0) {
    return false;
  }
  return store.getState().commitMove(moves).ok;
}

export function movesForNudge(
  document: DiagramDocument,
  selectedIds: readonly string[],
  delta: { x: number; y: number },
): ElementMove[] {
  if (selectedIds.length === 0) {
    return [];
  }

  const selected = new Set(selectedIds);
  const moves: ElementMove[] = [];

  for (const element of document.elements) {
    if (!selected.has(element.id)) {
      continue;
    }
    if (
      element.kind === "use-case" &&
      element.parentId !== undefined &&
      selected.has(element.parentId)
    ) {
      continue;
    }
    moves.push({
      id: element.id,
      x: element.geometry.x + delta.x,
      y: element.geometry.y + delta.y,
    });
  }

  return moves;
}
