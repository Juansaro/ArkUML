import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Geometry, Result } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  movesFromDraggedNodes,
  startNodeDrag,
  stopNodeDrag,
  updateNodeDrag,
} from "./nodeDrag.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 72, height: 112 };

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function createStore() {
  const createId = sequentialIds();
  return createEditorStore({
    document: createDiagramDocument({
      createId,
      now: () => CREATED_AT,
    }),
    deps: { createId, now: () => new Date("2026-09-08T08:00:00.000Z") },
  });
}

function actorOf(store: ReturnType<typeof createStore>) {
  const actor = store
    .getState()
    .document.elements.find((element) => element.kind === "actor");
  if (actor === undefined) {
    throw new Error("Falta el actor");
  }
  return actor;
}

describe("movesFromDraggedNodes", () => {
  it("omite posiciones que no cambiaron", () => {
    const document = createDiagramDocument({
      createId: sequentialIds(),
      now: () => CREATED_AT,
    });
    const boundary = document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }

    expect(
      movesFromDraggedNodes(document, [
        {
          id: boundary.id,
          position: { x: boundary.geometry.x, y: boundary.geometry.y },
        },
      ]),
    ).toEqual([]);
    expect(
      movesFromDraggedNodes(document, [
        { id: boundary.id, position: { x: 40, y: 80 } },
      ]),
    ).toEqual([{ id: boundary.id, x: 40, y: 80 }]);
  });
});

describe("node drag transaction", () => {
  it("agrupa el gesto en una sola entrada de historial", () => {
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    const baseline = store.getState().document;
    const pastBefore = store.getState().history.past.length;

    startNodeDrag(store);
    updateNodeDrag(store, [{ id: actor.id, position: { x: 10, y: 20 } }]);
    updateNodeDrag(store, [{ id: actor.id, position: { x: 24, y: 48 } }]);
    stopNodeDrag(store, [{ id: actor.id, position: { x: 32, y: 64 } }]);

    expect(store.getState().history.past).toHaveLength(pastBefore + 1);
    expect(store.getState().history.past[pastBefore]).toBe(baseline);
    expect(actorOf(store).geometry).toMatchObject({ x: 32, y: 64 });

    expect(store.getState().undo()).toBe(true);
    expect(store.getState().document).toBe(baseline);
    expect(actorOf(store).geometry).toMatchObject({
      x: ACTOR_GEOMETRY.x,
      y: ACTOR_GEOMETRY.y,
    });
  });

  it("no registra historial si el nodo no se movió", () => {
    const store = createStore();
    const baseline = store.getState().document;
    const boundary = baseline.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }

    startNodeDrag(store);
    stopNodeDrag(store, [
      {
        id: boundary.id,
        position: {
          x: DEFAULT_BOUNDARY_GEOMETRY.x,
          y: DEFAULT_BOUNDARY_GEOMETRY.y,
        },
      },
    ]);

    expect(store.getState().document).toBe(baseline);
    expect(store.getState().history.past).toHaveLength(0);
  });
});
