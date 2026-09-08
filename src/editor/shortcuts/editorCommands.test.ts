import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOUNDARY_GEOMETRY,
  DUPLICATE_OFFSET,
} from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type {
  DiagramDocument,
  Geometry,
  Result,
} from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  DELETED_SELECTION_MESSAGE,
  deleteSelection,
  duplicateSelection,
  movesForNudge,
  nudgeSelection,
} from "./editorCommands.ts";
import { NUDGE_GRID_DISTANCE } from "./shortcutMap.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 48, height: 96 };
const USE_CASE_GEOMETRY: Geometry = { x: 80, y: 80, width: 160, height: 80 };

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

function boundaryOf(document: DiagramDocument) {
  const boundary = document.elements.find(
    (element) => element.kind === "system-boundary",
  );
  if (boundary === undefined) {
    throw new Error("Falta el boundary");
  }
  return boundary;
}

function actorsOf(document: DiagramDocument) {
  return document.elements.filter((element) => element.kind === "actor");
}

function useCasesOf(document: DiagramDocument) {
  return document.elements.filter((element) => element.kind === "use-case");
}

describe("deleteSelection", () => {
  it("borra una selección múltiple y las relaciones incidentes", () => {
    const store = createStore();
    const boundaryId = boundaryOf(store.getState().document).id;
    expectOk(
      store.getState().createActor({ name: "A", geometry: ACTOR_GEOMETRY }),
    );
    expectOk(
      store.getState().createActor({
        name: "B",
        geometry: { ...ACTOR_GEOMETRY, x: -40 },
      }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
        parentId: boundaryId,
      }),
    );
    const [first, second] = actorsOf(store.getState().document);
    const useCase = useCasesOf(store.getState().document)[0];
    if (first === undefined || second === undefined || useCase === undefined) {
      throw new Error("Faltan elementos");
    }
    expectOk(
      store.getState().connect({
        kind: "association",
        sourceId: first.id,
        targetId: useCase.id,
        sourceAnchor: "right",
        targetAnchor: "left",
      }),
    );

    store.getState().setSelection({
      elementIds: [first.id, second.id],
      relationshipIds: [],
    });
    expect(deleteSelection(store)).toBe(true);

    expect(actorsOf(store.getState().document)).toHaveLength(0);
    expect(store.getState().document.relationships).toHaveLength(0);
    expect(store.getState().ui.message).toBe(DELETED_SELECTION_MESSAGE);

    expect(store.getState().undo()).toBe(true);
    expect(actorsOf(store.getState().document)).toHaveLength(2);
    expect(store.getState().document.relationships).toHaveLength(1);
  });

  it("al borrar el boundary deja los casos en absolutas y el undo restaura el padre", () => {
    const store = createStore();
    const boundary = boundaryOf(store.getState().document);
    expectOk(store.getState().commitMove([{ id: boundary.id, x: 40, y: 80 }]));
    expectOk(
      store.getState().createUseCase({
        name: "Alta",
        geometry: { x: 10, y: 20, width: 160, height: 80 },
        parentId: boundary.id,
      }),
    );
    const useCaseId = useCasesOf(store.getState().document)[0]?.id;
    if (useCaseId === undefined) {
      throw new Error("Falta el caso de uso");
    }

    store.getState().setSelection({
      elementIds: [boundary.id],
      relationshipIds: [],
    });
    expect(deleteSelection(store)).toBe(true);

    const detached = useCasesOf(store.getState().document)[0];
    expect(detached?.parentId).toBeUndefined();
    expect(detached?.geometry).toMatchObject({ x: 50, y: 100 });

    expect(store.getState().undo()).toBe(true);
    const restored = useCasesOf(store.getState().document)[0];
    expect(restored?.parentId).toBe(boundary.id);
    expect(restored?.geometry).toMatchObject({ x: 10, y: 20 });
  });
});

describe("duplicateSelection", () => {
  it("duplica actores y casos con offset 24 y no copia edges ni el boundary", () => {
    const store = createStore();
    const boundary = boundaryOf(store.getState().document);
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
        parentId: boundary.id,
      }),
    );
    const actor = actorsOf(store.getState().document)[0];
    const useCase = useCasesOf(store.getState().document)[0];
    if (actor === undefined || useCase === undefined) {
      throw new Error("Faltan elementos");
    }
    expectOk(
      store.getState().connect({
        kind: "association",
        sourceId: actor.id,
        targetId: useCase.id,
        sourceAnchor: "right",
        targetAnchor: "left",
      }),
    );

    store.getState().setSelection({
      elementIds: [actor.id, useCase.id, boundary.id],
      relationshipIds: store
        .getState()
        .document.relationships.map((relationship) => relationship.id),
    });
    expect(duplicateSelection(store)).toBe(true);

    const document = store.getState().document;
    expect(
      document.elements.filter((element) => element.kind === "system-boundary"),
    ).toHaveLength(1);
    expect(actorsOf(document)).toHaveLength(2);
    expect(useCasesOf(document)).toHaveLength(2);
    expect(document.relationships).toHaveLength(1);

    const actorCopy = actorsOf(document).find(
      (element) => element.id !== actor.id,
    );
    const useCaseCopy = useCasesOf(document).find(
      (element) => element.id !== useCase.id,
    );
    expect(actorCopy?.geometry).toMatchObject({
      x: ACTOR_GEOMETRY.x + DUPLICATE_OFFSET,
      y: ACTOR_GEOMETRY.y + DUPLICATE_OFFSET,
    });
    expect(useCaseCopy?.geometry).toMatchObject({
      x: USE_CASE_GEOMETRY.x + DUPLICATE_OFFSET,
      y: USE_CASE_GEOMETRY.y + DUPLICATE_OFFSET,
    });
    expect(store.getState().selection.elementIds).toEqual([
      actorCopy?.id,
      useCaseCopy?.id,
    ]);
  });
});

describe("nudgeSelection", () => {
  it("mueve 1 px o 16 px y no desplaza dos veces a un hijo cuyo padre está seleccionado", () => {
    const store = createStore();
    const boundary = boundaryOf(store.getState().document);
    expectOk(
      store.getState().createUseCase({
        name: "Alta",
        geometry: USE_CASE_GEOMETRY,
        parentId: boundary.id,
      }),
    );
    const useCase = useCasesOf(store.getState().document)[0];
    if (useCase === undefined) {
      throw new Error("Falta el caso de uso");
    }

    expect(
      movesForNudge(store.getState().document, [boundary.id, useCase.id], {
        x: 16,
        y: 0,
      }),
    ).toEqual([{ id: boundary.id, x: DEFAULT_BOUNDARY_GEOMETRY.x + 16, y: 0 }]);

    store.getState().setSelection({
      elementIds: [useCase.id],
      relationshipIds: [],
    });
    expect(nudgeSelection(store, "nudgeRightGrid")).toBe(true);
    expect(useCasesOf(store.getState().document)[0]?.geometry).toMatchObject({
      x: USE_CASE_GEOMETRY.x + NUDGE_GRID_DISTANCE,
      y: USE_CASE_GEOMETRY.y,
    });
  });
});
