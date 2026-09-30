import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOUNDARY_GEOMETRY,
  MIN_BOUNDARY_HEIGHT,
  MIN_BOUNDARY_WIDTH,
} from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Result, UseCase } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  isBoundaryResizing,
  startBoundaryResize,
  stopBoundaryResize,
  updateBoundaryResize,
} from "./boundaryResize.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");

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

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function boundaryOf(store: ReturnType<typeof createStore>) {
  const boundary = store
    .getState()
    .document.elements.find((element) => element.kind === "system-boundary");
  if (boundary === undefined) {
    throw new Error("Falta el boundary");
  }
  return boundary;
}

function useCaseOf(store: ReturnType<typeof createStore>): UseCase {
  const useCase = store
    .getState()
    .document.elements.find(
      (element): element is UseCase => element.kind === "use-case",
    );
  if (useCase === undefined) {
    throw new Error("Falta el caso");
  }
  return useCase;
}

describe("boundary resize transaction", () => {
  it("agrupa el gesto en una sola entrada de historial", () => {
    const store = createStore();
    const boundary = boundaryOf(store);
    const baseline = store.getState().document;
    const pastBefore = store.getState().history.past.length;

    startBoundaryResize(store);
    expect(isBoundaryResizing(store)).toBe(true);
    updateBoundaryResize(store, boundary.id, {
      x: 0,
      y: 0,
      width: 500,
      height: 300,
    });
    updateBoundaryResize(store, boundary.id, {
      x: 8,
      y: 16,
      width: 420,
      height: 280,
    });
    stopBoundaryResize(store, boundary.id, {
      x: 8,
      y: 16,
      width: 400,
      height: 280,
    });

    expect(isBoundaryResizing(store)).toBe(false);
    expect(store.getState().history.past).toHaveLength(pastBefore + 1);
    expect(store.getState().history.past[pastBefore]).toBe(baseline);
    expect(boundaryOf(store).geometry).toEqual({
      x: 8,
      y: 16,
      width: 400,
      height: 280,
    });

    expect(store.getState().undo()).toBe(true);
    expect(boundaryOf(store).geometry).toEqual(DEFAULT_BOUNDARY_GEOMETRY);
  });

  it("rechaza un tamaño bajo el mínimo sin mutar", () => {
    const store = createStore();
    const boundary = boundaryOf(store);
    const baseline = store.getState().document;

    startBoundaryResize(store);
    updateBoundaryResize(store, boundary.id, {
      x: 0,
      y: 0,
      width: MIN_BOUNDARY_WIDTH - 1,
      height: MIN_BOUNDARY_HEIGHT,
    });
    stopBoundaryResize(store, boundary.id, {
      x: 0,
      y: 0,
      width: MIN_BOUNDARY_WIDTH - 1,
      height: MIN_BOUNDARY_HEIGHT,
    });

    expect(store.getState().document).toBe(baseline);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().ui.message).toMatch(/320/);
  });
});

describe("boundary resize conserva la posición absoluta del caso", () => {
  it("ajusta las relativas al mover el origen y el undo restaura límite e hijo", () => {
    const store = createStore();
    const boundary = boundaryOf(store);
    const childGeometry = { x: 80, y: 80, width: 160, height: 80 };
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: childGeometry,
        parentId: boundary.id,
      }),
    );
    const pastBefore = store.getState().history.past.length;

    startBoundaryResize(store);
    updateBoundaryResize(store, boundary.id, {
      x: 30,
      y: 10,
      width: DEFAULT_BOUNDARY_GEOMETRY.width,
      height: DEFAULT_BOUNDARY_GEOMETRY.height,
    });
    stopBoundaryResize(store, boundary.id, {
      x: 36,
      y: 12,
      width: DEFAULT_BOUNDARY_GEOMETRY.width,
      height: DEFAULT_BOUNDARY_GEOMETRY.height,
    });

    const child = useCaseOf(store);
    expect(child.parentId).toBe(boundary.id);
    expect(child.geometry).toEqual({
      x: childGeometry.x - 36,
      y: childGeometry.y - 12,
      width: childGeometry.width,
      height: childGeometry.height,
    });
    expect(store.getState().history.past).toHaveLength(pastBefore + 1);

    expect(store.getState().undo()).toBe(true);
    expect(boundaryOf(store).geometry).toEqual(DEFAULT_BOUNDARY_GEOMETRY);
    expect(useCaseOf(store).parentId).toBe(boundary.id);
    expect(useCaseOf(store).geometry).toEqual(childGeometry);
  });

  it("suelta el caso si el centro sale y el undo restaura el parentId", () => {
    const store = createStore();
    const boundary = boundaryOf(store);
    const childGeometry = { x: 20, y: 40, width: 160, height: 80 };
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: childGeometry,
        parentId: boundary.id,
      }),
    );

    startBoundaryResize(store);
    stopBoundaryResize(store, boundary.id, {
      x: 160,
      y: 0,
      width: 480,
      height: DEFAULT_BOUNDARY_GEOMETRY.height,
    });

    const released = useCaseOf(store);
    expect(released.parentId).toBeUndefined();
    expect(released.geometry).toEqual({
      x: boundary.geometry.x + childGeometry.x,
      y: boundary.geometry.y + childGeometry.y,
      width: childGeometry.width,
      height: childGeometry.height,
    });

    expect(store.getState().undo()).toBe(true);
    expect(boundaryOf(store).geometry).toEqual(DEFAULT_BOUNDARY_GEOMETRY);
    expect(useCaseOf(store).parentId).toBe(boundary.id);
    expect(useCaseOf(store).geometry).toEqual(childGeometry);
  });
});

describe("boundary resize no-op", () => {
  it("no registra historial si el tamaño no cambió", () => {
    const store = createStore();
    const boundary = boundaryOf(store);

    startBoundaryResize(store);
    stopBoundaryResize(store, boundary.id, {
      x: DEFAULT_BOUNDARY_GEOMETRY.x,
      y: DEFAULT_BOUNDARY_GEOMETRY.y,
      width: DEFAULT_BOUNDARY_GEOMETRY.width,
      height: DEFAULT_BOUNDARY_GEOMETRY.height,
    });

    expect(store.getState().history.past).toHaveLength(0);
  });
});
