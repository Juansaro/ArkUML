import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Result } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  SNAP_GRID_PX,
  SNAP_THRESHOLD_PX,
  snapDraggedPositions,
  snapGroupDelta,
  type SnapRect,
} from "./snap.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const HEAD = { width: 120, height: 40 } as const;
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
  width: number = HEAD.width,
  height: number = HEAD.height,
): SnapRect {
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

describe("snapGroupDelta", () => {
  it("no corrige si no hay rectángulos arrastrados", () => {
    expect(snapGroupDelta([], [rect(0, 0)])).toEqual({ x: 0, y: 0 });
  });

  it("salta al borde o centro ajeno más cercano dentro de 8 px", () => {
    const delta = snapGroupDelta([rect(6, 80)], [rect(0, 0)]);
    expect(delta.x).toBe(-6);
    expect(delta.y).toBe(0);
  });

  it("acepta 8 px y, fuera de ese umbral, encaja el origen en la grilla", () => {
    const atThreshold = snapGroupDelta(
      [rect(SNAP_THRESHOLD_PX, 80)],
      [rect(0, 0)],
    );
    const beyond = snapGroupDelta(
      [rect(SNAP_THRESHOLD_PX + 1, 20)],
      [rect(0, 400)],
    );

    expect(atThreshold.x).toBe(-SNAP_THRESHOLD_PX);
    expect(beyond.x).toBe(SNAP_GRID_PX - (SNAP_THRESHOLD_PX + 1));
    expect(beyond.y).toBe(SNAP_GRID_PX - 20);
  });

  it("prefiere el eje ajeno aunque la grilla quede más cerca del origen", () => {
    const delta = snapGroupDelta([rect(20, 20)], [rect(28, 400)]);
    expect(delta.x).toBe(8);
    expect(delta.y).toBe(SNAP_GRID_PX - 20);
  });

  it("usa una sola corrección para el grupo, la del borde más cercano", () => {
    const delta = snapGroupDelta(
      [rect(6, 20, 40, 40), rect(200, 20, 40, 40)],
      [rect(0, 400, 40, 40)],
    );
    expect(delta).toEqual({ x: -6, y: SNAP_GRID_PX - 20 });
  });
});

describe("snapDraggedPositions", () => {
  it("mueve la selección con el mismo delta y no deforma el hueco", () => {
    const store = createStore();
    const boundary = store.getState().document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    expectOk(
      store.getState().createActor({
        name: "A",
        geometry: { x: 0, y: 0, width: 72, height: 112 },
      }),
    );
    expectOk(
      store.getState().createActor({
        name: "B",
        geometry: { x: 180, y: 0, width: 72, height: 112 },
      }),
    );
    const actors = store
      .getState()
      .document.elements.filter((element) => element.kind === "actor");
    const first = actors[0];
    const second = actors[1];
    if (first === undefined || second === undefined) {
      throw new Error("Faltan actores");
    }

    const snapped = snapDraggedPositions(store.getState().document, [
      { id: first.id, position: { x: 6, y: 20 } },
      { id: second.id, position: { x: 200, y: 20 } },
    ]);
    const snappedFirst = snapped.find((node) => node.id === first.id);
    const snappedSecond = snapped.find((node) => node.id === second.id);
    if (snappedFirst === undefined || snappedSecond === undefined) {
      throw new Error("Falta el resultado");
    }

    expect(snappedSecond.position.x - snappedFirst.position.x).toBe(194);
    expect(snappedFirst.position.y).toBe(snappedSecond.position.y);
    expect(snappedFirst.position.x).toBe(0);
    expect(snappedSecond.position.x).toBe(194);
  });

  it("no usa como imán al hijo de un padre que está en el gesto", () => {
    const store = createStore();
    const boundary = store.getState().document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: { x: 2, y: 2, ...USE_CASE_SIZE },
        parentId: boundary.id,
      }),
    );

    const snapped = snapDraggedPositions(store.getState().document, [
      { id: boundary.id, position: { x: 5, y: 5 } },
    ]);

    expect(snapped).toEqual([{ id: boundary.id, position: { x: 0, y: 0 } }]);
  });

  it("imanta un caso anidado en coordenadas absolutas y conserva la relativa si el padre también se mueve", () => {
    const store = createStore();
    const boundary = store.getState().document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    expectOk(
      store.getState().createActor({
        name: "Usuario",
        geometry: { x: 200, y: 800, width: 72, height: 112 },
      }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: { x: 40, y: 80, ...USE_CASE_SIZE },
        parentId: boundary.id,
      }),
    );
    const useCase = store
      .getState()
      .document.elements.find((element) => element.kind === "use-case");
    if (useCase === undefined) {
      throw new Error("Falta el caso");
    }

    const alone = snapDraggedPositions(store.getState().document, [
      { id: useCase.id, position: { x: 206, y: 80 } },
    ]);
    expect(alone).toEqual([{ id: useCase.id, position: { x: 200, y: 80 } }]);

    const withParent = snapDraggedPositions(store.getState().document, [
      { id: boundary.id, position: { x: 8, y: 8 } },
      { id: useCase.id, position: { x: 40, y: 80 } },
    ]);
    const parent = withParent.find((node) => node.id === boundary.id);
    const child = withParent.find((node) => node.id === useCase.id);
    expect(parent?.position).toEqual({ x: 16, y: 16 });
    expect(child?.position).toEqual({ x: 40, y: 80 });
  });
});
