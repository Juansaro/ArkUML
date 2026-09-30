import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Geometry, Result } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import { computeAlignmentGuidesForDocument } from "./alignmentGuides.ts";
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

describe("snap durante el drag", () => {
  const HEAD: Geometry = { x: 0, y: 0, width: 120, height: 40 };

  function createSequenceStore() {
    const createId = sequentialIds();
    return createEditorStore({
      document: createEmptySequenceDocument({
        createId,
        now: () => CREATED_AT,
      }),
      deps: { createId, now: () => new Date("2026-09-08T08:00:00.000Z") },
    });
  }

  function lifelineNamed(
    store: ReturnType<typeof createSequenceStore>,
    name: string,
  ) {
    const lifeline = store
      .getState()
      .document.elements.find(
        (element) => element.kind === "lifeline" && element.name === name,
      );
    if (lifeline === undefined || lifeline.kind !== "lifeline") {
      throw new Error(`Falta la lifeline ${name}`);
    }
    return lifeline;
  }

  it("con el flag apagado deja la posición del puntero", () => {
    const store = createSequenceStore();
    expect(store.getState().ui.snapEnabled).toBe(false);
    expectOk(
      store.getState().createLifeline({
        name: "A",
        geometry: { ...HEAD, x: 0, y: 0 },
      }),
    );
    expectOk(
      store.getState().createLifeline({
        name: "B",
        geometry: { ...HEAD, x: 208, y: 80 },
      }),
    );
    const dragged = lifelineNamed(store, "B");

    startNodeDrag(store);
    updateNodeDrag(store, [{ id: dragged.id, position: { x: 208, y: 6 } }]);
    stopNodeDrag(store, [{ id: dragged.id, position: { x: 208, y: 6 } }]);

    expect(lifelineNamed(store, "B").geometry).toMatchObject({
      x: 208,
      y: 6,
    });
    expect(lifelineNamed(store, "A").geometry.y).toBe(0);
  });

  it("alinea el borde superior de una lifeline y encaja en la grilla si no hay eje", () => {
    const store = createSequenceStore();
    store.getState().setSnapEnabled(true);
    expectOk(
      store.getState().createLifeline({
        name: "A",
        geometry: { ...HEAD, x: 0, y: 0 },
      }),
    );
    expectOk(
      store.getState().createLifeline({
        name: "B",
        geometry: { ...HEAD, x: 208, y: 80 },
      }),
    );
    const dragged = lifelineNamed(store, "B");
    const pastBefore = store.getState().history.past.length;
    const baseline = store.getState().document;

    startNodeDrag(store);
    updateNodeDrag(store, [{ id: dragged.id, position: { x: 208, y: 6 } }]);
    const guides = computeAlignmentGuidesForDocument(
      store.getState().document,
      [dragged.id],
    );
    stopNodeDrag(store, [{ id: dragged.id, position: { x: 208, y: 6 } }]);

    expect(lifelineNamed(store, "B").geometry).toMatchObject({ x: 208, y: 0 });
    expect(lifelineNamed(store, "A").geometry.y).toBe(0);
    expect(guides.horizontal).toContain(0);
    expect(store.getState().history.past).toHaveLength(pastBefore + 1);
    expect(store.getState().history.past[pastBefore]).toBe(baseline);
    expect(store.getState().undo()).toBe(true);
    expect(lifelineNamed(store, "B").geometry).toMatchObject({
      x: 208,
      y: 80,
    });
  });

  it("lejos de otros elementos deja el origen en múltiplos de 16", () => {
    const store = createSequenceStore();
    store.getState().setSnapEnabled(true);
    expectOk(
      store.getState().createLifeline({
        name: "Sola",
        geometry: { ...HEAD, x: 0, y: 0 },
      }),
    );
    const lifeline = lifelineNamed(store, "Sola");

    startNodeDrag(store);
    stopNodeDrag(store, [{ id: lifeline.id, position: { x: 20, y: 36 } }]);

    expect(lifelineNamed(store, "Sola").geometry).toMatchObject({
      x: 16,
      y: 32,
    });
  });

  it("una selección comparte la corrección y sigue siendo una entrada de historial", () => {
    const store = createSequenceStore();
    store.getState().setSnapEnabled(true);
    expectOk(
      store.getState().createLifeline({
        name: "A",
        geometry: { ...HEAD, x: 0, y: 0 },
      }),
    );
    expectOk(
      store.getState().createLifeline({
        name: "B",
        geometry: { ...HEAD, x: 180, y: 0 },
      }),
    );
    expectOk(
      store.getState().createLifeline({
        name: "C",
        geometry: { ...HEAD, x: 0, y: 400 },
      }),
    );
    const first = lifelineNamed(store, "A");
    const second = lifelineNamed(store, "B");
    const pastBefore = store.getState().history.past.length;

    startNodeDrag(store);
    stopNodeDrag(store, [
      { id: first.id, position: { x: 6, y: 20 } },
      { id: second.id, position: { x: 200, y: 20 } },
    ]);

    const movedFirst = lifelineNamed(store, "A");
    const movedSecond = lifelineNamed(store, "B");
    expect(movedSecond.geometry.x - movedFirst.geometry.x).toBe(194);
    expect(movedFirst.geometry.y).toBe(movedSecond.geometry.y);
    expect(movedFirst.geometry).toMatchObject({ x: 0, y: 16 });
    expect(movedSecond.geometry).toMatchObject({ x: 194, y: 16 });
    expect(lifelineNamed(store, "C").geometry).toMatchObject({
      x: 0,
      y: 400,
    });
    expect(store.getState().history.past).toHaveLength(pastBefore + 1);
    expect(store.getState().document.schemaVersion).toBe(3);
    expect(JSON.stringify(store.getState().document)).not.toContain(
      "snapEnabled",
    );
  });
});
