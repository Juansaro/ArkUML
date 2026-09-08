import { describe, expect, it } from "vitest";
import type { DiagramDocument } from "../../domain/diagram/model.ts";
import {
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  emptyHistory,
  recordMutation,
  redoHistory,
  undoHistory,
} from "./history.ts";

function doc(id: string): DiagramDocument {
  return {
    schemaVersion: 1,
    id,
    kind: "use-case",
    metadata: {
      title: id,
      createdAt: "2026-09-07T12:00:00.000Z",
      updatedAt: "2026-09-07T12:00:00.000Z",
    },
    elements: [],
    relationships: [],
  };
}

describe("recordMutation", () => {
  it("apila el documento previo y vacía redo", () => {
    const first = doc("a");
    const second = doc("b");
    const afterFirst = recordMutation(emptyHistory(), first);
    const withRedo = {
      past: afterFirst.past,
      future: [doc("redo")],
    };
    const afterSecond = recordMutation(withRedo, second);

    expect(afterSecond.past).toEqual([first, second]);
    expect(afterSecond.future).toEqual([]);
  });

  it("descarta la entrada más antigua al superar el límite", () => {
    let history = emptyHistory();
    const snapshots: DiagramDocument[] = [];
    for (let index = 0; index < HISTORY_LIMIT + 1; index += 1) {
      const snapshot = doc(`d${index}`);
      snapshots.push(snapshot);
      history = recordMutation(history, snapshot);
    }

    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.past[0]).toBe(snapshots[1]);
    expect(history.past.at(-1)).toBe(snapshots[HISTORY_LIMIT]);
  });
});

describe("undoHistory and redoHistory", () => {
  it("deshace, rehace y reporta canUndo/canRedo", () => {
    const original = doc("original");
    const next = doc("next");
    const history = recordMutation(emptyHistory(), original);

    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);

    const undone = undoHistory(history, next);
    expect(undone).toEqual({
      document: original,
      history: { past: [], future: [next] },
    });
    expect(undone).toBeDefined();
    if (undone === undefined) {
      return;
    }
    expect(canUndo(undone.history)).toBe(false);
    expect(canRedo(undone.history)).toBe(true);

    const redone = redoHistory(undone.history, undone.document);
    expect(redone).toEqual({
      document: next,
      history: { past: [original], future: [] },
    });
  });

  it("no deshace ni rehace con pilas vacías", () => {
    const current = doc("current");
    expect(undoHistory(emptyHistory(), current)).toBeUndefined();
    expect(redoHistory(emptyHistory(), current)).toBeUndefined();
  });
});
