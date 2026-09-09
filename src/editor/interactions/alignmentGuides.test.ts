import { describe, expect, it } from "vitest";
import { STORAGE_VERSION } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Result } from "../../domain/diagram/model.ts";
import { parseWorkspaceSnapshot } from "../../domain/diagram/schema.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  ALIGNMENT_THRESHOLD_PX,
  computeAlignmentGuides,
  computeAlignmentGuidesForDocument,
  EMPTY_ALIGNMENT_GUIDES,
} from "./alignmentGuides.ts";
import { startNodeDrag, stopNodeDrag, updateNodeDrag } from "./nodeDrag.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const ACTOR_SIZE = { width: 72, height: 112 } as const;
const USE_CASE_SIZE = { width: 160, height: 80 } as const;

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function rect(
  x: number,
  y: number,
  width: number = ACTOR_SIZE.width,
  height: number = ACTOR_SIZE.height,
): { x: number; y: number; width: number; height: number } {
  return { x, y, width, height };
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

describe("computeAlignmentGuides", () => {
  it("devuelve vacío si falta un lado", () => {
    expect(computeAlignmentGuides([], [rect(0, 0)])).toEqual(
      EMPTY_ALIGNMENT_GUIDES,
    );
    expect(computeAlignmentGuides([rect(0, 0)], [])).toEqual(
      EMPTY_ALIGNMENT_GUIDES,
    );
  });

  it("alinea bordes y centros dentro del umbral", () => {
    const target = rect(100, 40);
    const dragged = rect(104, 42);

    expect(computeAlignmentGuides([dragged], [target])).toEqual({
      vertical: [100, 100 + ACTOR_SIZE.width / 2, 100 + ACTOR_SIZE.width],
      horizontal: [40, 40 + ACTOR_SIZE.height / 2, 40 + ACTOR_SIZE.height],
    });
  });

  it("acepta 4 px y rechaza 5 px en esa coordenada", () => {
    const target = rect(0, 0);
    const atThreshold = computeAlignmentGuides(
      [rect(ALIGNMENT_THRESHOLD_PX, 80)],
      [target],
    );
    const beyond = computeAlignmentGuides(
      [rect(ALIGNMENT_THRESHOLD_PX + 1, 80)],
      [target],
    );

    expect(atThreshold.vertical).toContain(0);
    expect(beyond.vertical).not.toContain(0);
  });

  it("a 8 px no muestra guía en esa coordenada", () => {
    const target = rect(0, 200);
    const guides = computeAlignmentGuides([rect(8, 200)], [target]);
    expect(guides.vertical).not.toContain(0);
    expect(guides.horizontal).toContain(200);
  });

  it("alinea un borde con el centro o el borde opuesto", () => {
    const target = rect(0, 0, 100, 50);
    const leftToRight = computeAlignmentGuides(
      [rect(100, 80, 40, 20)],
      [target],
    );
    const leftToCenter = computeAlignmentGuides(
      [rect(50, 80, 40, 20)],
      [target],
    );

    expect(leftToRight.vertical).toContain(100);
    expect(leftToCenter.vertical).toContain(50);
  });

  it("no compara entre sí los rectángulos del gesto", () => {
    const guides = computeAlignmentGuides(
      [rect(0, 0), rect(0, 200)],
      [rect(400, 400)],
    );
    expect(guides).toEqual(EMPTY_ALIGNMENT_GUIDES);
  });

  it("deduplica la misma coordenada de varios destinos", () => {
    const guides = computeAlignmentGuides(
      [rect(0, 80)],
      [rect(0, 0), rect(0, 300)],
    );
    expect(guides.vertical).toEqual([
      0,
      ACTOR_SIZE.width / 2,
      ACTOR_SIZE.width,
    ]);
  });
});

describe("computeAlignmentGuidesForDocument", () => {
  it("usa elementos que no están en el gesto, en coordenadas absolutas", () => {
    const store = createStore();
    const boundary = store.getState().document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }

    expectOk(
      store.getState().createActor({
        name: "Usuario",
        geometry: { x: 0, y: 420, ...ACTOR_SIZE },
      }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: {
          x: 4,
          y: 80,
          ...USE_CASE_SIZE,
        },
        parentId: boundary.id,
      }),
    );

    const actor = store
      .getState()
      .document.elements.find((element) => element.kind === "actor");
    const useCase = store
      .getState()
      .document.elements.find((element) => element.kind === "use-case");
    if (actor === undefined || useCase === undefined) {
      throw new Error("Faltan elementos");
    }

    const guides = computeAlignmentGuidesForDocument(
      store.getState().document,
      [actor.id],
    );
    expect(guides.vertical).toContain(boundary.geometry.x);

    const childGuides = computeAlignmentGuidesForDocument(
      store.getState().document,
      [useCase.id],
    );
    expect(childGuides.vertical).toContain(boundary.geometry.x);
  });

  it("omite hijos de un padre arrastrado", () => {
    const store = createStore();
    const boundary = store.getState().document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }

    expectOk(
      store.getState().createUseCase({
        name: "Hijo",
        geometry: { x: 0, y: 40, ...USE_CASE_SIZE },
        parentId: boundary.id,
      }),
    );

    expect(
      computeAlignmentGuidesForDocument(store.getState().document, [
        boundary.id,
      ]),
    ).toEqual(EMPTY_ALIGNMENT_GUIDES);
  });

  it("no escribe el documento ni añade claves de workspace", () => {
    const store = createStore();
    expectOk(
      store.getState().createActor({
        name: "Usuario",
        geometry: { x: 0, y: 40, ...ACTOR_SIZE },
      }),
    );
    const document = store.getState().document;
    const before = JSON.stringify(document);

    computeAlignmentGuidesForDocument(document, [
      document.elements[document.elements.length - 1]?.id ?? "",
    ]);

    expect(JSON.stringify(document)).toBe(before);

    const snapshot = {
      storageVersion: STORAGE_VERSION,
      document,
      view: store.getState().viewport,
    };
    expect(Object.keys(snapshot).sort()).toEqual([
      "document",
      "storageVersion",
      "view",
    ]);
    expect(document.schemaVersion).toBe(1);
    expect(
      parseWorkspaceSnapshot(JSON.parse(JSON.stringify(snapshot))),
    ).toEqual({
      ok: true,
      value: snapshot,
    });
  });

  it("un gesto de drag sigue siendo una entrada de historial", () => {
    const store = createStore();
    expectOk(
      store.getState().createActor({
        name: "Usuario",
        geometry: { x: 40, y: 40, ...ACTOR_SIZE },
      }),
    );
    const actor = store
      .getState()
      .document.elements.find((element) => element.kind === "actor");
    if (actor === undefined) {
      throw new Error("Falta el actor");
    }
    const pastBefore = store.getState().history.past.length;
    const baseline = store.getState().document;

    startNodeDrag(store);
    updateNodeDrag(store, [{ id: actor.id, position: { x: 4, y: 40 } }]);
    const midGuides = computeAlignmentGuidesForDocument(
      store.getState().document,
      [actor.id],
    );
    updateNodeDrag(store, [{ id: actor.id, position: { x: 0, y: 40 } }]);
    computeAlignmentGuidesForDocument(store.getState().document, [actor.id]);
    stopNodeDrag(store, [{ id: actor.id, position: { x: 0, y: 40 } }]);

    expect(midGuides.vertical.length).toBeGreaterThan(0);
    expect(store.getState().history.past).toHaveLength(pastBefore + 1);
    expect(store.getState().history.past[pastBefore]).toBe(baseline);
  });
});
