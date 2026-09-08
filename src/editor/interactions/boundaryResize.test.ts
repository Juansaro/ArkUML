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

function boundaryOf(store: ReturnType<typeof createStore>) {
  const boundary = store
    .getState()
    .document.elements.find((element) => element.kind === "system-boundary");
  if (boundary === undefined) {
    throw new Error("Falta el boundary");
  }
  return boundary;
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
