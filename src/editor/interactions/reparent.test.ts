import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Geometry, Result, UseCase } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  absoluteGeometry,
  applyReparentOnDrop,
  decideUseCaseReparent,
} from "./reparent.ts";
import { startNodeDrag, stopNodeDrag } from "./nodeDrag.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const USE_CASE_SIZE = { width: 160, height: 80 };
const ACTOR_GEOMETRY: Geometry = { x: 40, y: 40, width: 72, height: 112 };

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
    .document.elements.find((element): element is UseCase => {
      return element.kind === "use-case";
    });
  if (useCase === undefined) {
    throw new Error("Falta el caso de uso");
  }
  return useCase;
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

describe("absoluteGeometry", () => {
  it("convierte relativa ↔ absoluta sin cambiar la posición en pantalla", () => {
    const store = createStore();
    const boundary = boundaryOf(store);
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: { x: 80, y: 90, ...USE_CASE_SIZE },
        parentId: boundary.id,
      }),
    );
    const child = useCaseOf(store);
    const absolute = absoluteGeometry(child, store.getState().document);

    expect(absolute).toEqual({
      x: DEFAULT_BOUNDARY_GEOMETRY.x + 80,
      y: DEFAULT_BOUNDARY_GEOMETRY.y + 90,
      ...USE_CASE_SIZE,
    });

    expectOk(store.getState().reparentUseCase(child.id, undefined));
    const free = useCaseOf(store);
    expect(free.parentId).toBeUndefined();
    expect(free.geometry).toEqual(absolute);
    expect(absoluteGeometry(free, store.getState().document)).toEqual(absolute);
  });
});

describe("decideUseCaseReparent", () => {
  it("adjunta si el centro entra y desanida si el centro sale", () => {
    const store = createStore();
    const boundary = boundaryOf(store);
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: { x: 900, y: 80, ...USE_CASE_SIZE },
      }),
    );
    const useCase = useCaseOf(store);

    expect(
      decideUseCaseReparent(store.getState().document, useCase.id),
    ).toEqual({ action: "keep" });

    expectOk(store.getState().commitMove([{ id: useCase.id, x: 80, y: 80 }]));
    expect(
      decideUseCaseReparent(store.getState().document, useCase.id),
    ).toEqual({
      action: "attach",
      parentId: boundary.id,
    });

    applyReparentOnDrop(store, [useCase.id]);
    expect(useCaseOf(store).parentId).toBe(boundary.id);
    expect(
      absoluteGeometry(useCaseOf(store), store.getState().document),
    ).toEqual({ x: 80, y: 80, ...USE_CASE_SIZE });

    expectOk(store.getState().commitMove([{ id: useCase.id, x: 900, y: 80 }]));
    expect(
      decideUseCaseReparent(store.getState().document, useCase.id),
    ).toEqual({ action: "detach" });

    applyReparentOnDrop(store, [useCase.id]);
    expect(useCaseOf(store).parentId).toBeUndefined();
    expect(useCaseOf(store).geometry).toEqual({
      x: DEFAULT_BOUNDARY_GEOMETRY.x + 900,
      y: DEFAULT_BOUNDARY_GEOMETRY.y + 80,
      ...USE_CASE_SIZE,
    });
  });

  it("no reparenta actores", () => {
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    applyReparentOnDrop(store, [actor.id]);
    expect(actorOf(store)).not.toHaveProperty("parentId");
    expect(decideUseCaseReparent(store.getState().document, actor.id)).toEqual({
      action: "keep",
    });
  });
});

describe("reparent on drop transaction", () => {
  it("agrupa movimiento y reparent en una sola entrada de historial", () => {
    const store = createStore();
    const boundary = boundaryOf(store);
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: { x: 900, y: 80, ...USE_CASE_SIZE },
      }),
    );
    const useCase = useCaseOf(store);
    const baseline = store.getState().document;
    const pastBefore = store.getState().history.past.length;

    startNodeDrag(store);
    stopNodeDrag(store, [{ id: useCase.id, position: { x: 80, y: 80 } }]);

    expect(store.getState().history.past).toHaveLength(pastBefore + 1);
    expect(useCaseOf(store).parentId).toBe(boundary.id);
    expect(
      absoluteGeometry(useCaseOf(store), store.getState().document),
    ).toEqual({ x: 80, y: 80, ...USE_CASE_SIZE });

    expect(store.getState().undo()).toBe(true);
    expect(store.getState().document).toBe(baseline);
    expect(useCaseOf(store).parentId).toBeUndefined();
    expect(useCaseOf(store).geometry).toMatchObject({ x: 900, y: 80 });
  });
});
