import type { DiagramDocument } from "../../domain/diagram/model.ts";

export const HISTORY_LIMIT = 100;

export type DocumentHistory = {
  past: readonly DiagramDocument[];
  future: readonly DiagramDocument[];
};

export function emptyHistory(): DocumentHistory {
  return { past: [], future: [] };
}

export function recordMutation(
  history: DocumentHistory,
  previous: DiagramDocument,
): DocumentHistory {
  const nextPast =
    history.past.length < HISTORY_LIMIT
      ? [...history.past, previous]
      : [...history.past.slice(1), previous];

  return {
    past: nextPast,
    future: [],
  };
}

export function undoHistory(
  history: DocumentHistory,
  current: DiagramDocument,
): { history: DocumentHistory; document: DiagramDocument } | undefined {
  const previous = history.past.at(-1);
  if (previous === undefined) {
    return undefined;
  }

  return {
    document: previous,
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
    },
  };
}

export function redoHistory(
  history: DocumentHistory,
  current: DiagramDocument,
): { history: DocumentHistory; document: DiagramDocument } | undefined {
  const next = history.future[0];
  if (next === undefined) {
    return undefined;
  }

  return {
    document: next,
    history: {
      past: [...history.past, current],
      future: history.future.slice(1),
    },
  };
}

export function canUndo(history: DocumentHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: DocumentHistory): boolean {
  return history.future.length > 0;
}
