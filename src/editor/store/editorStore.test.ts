import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type {
  DiagramDocument,
  Geometry,
  Result,
  Viewport,
} from "../../domain/diagram/model.ts";
import { createEditorStore } from "./editorStore.ts";
import { HISTORY_LIMIT } from "./history.ts";
import {
  selectCanRedo,
  selectCanUndo,
  selectDocument,
  selectIsTransacting,
  selectLiveAnnouncement,
  selectMessage,
  selectSaveStatus,
  selectSelectedElementIds,
  selectTool,
  selectViewport,
  shallow,
} from "./selectors.ts";

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
const VIEWPORT: Viewport = { x: 12, y: 24, zoom: 1.5 };

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

function actorOf(document: DiagramDocument) {
  const actor = document.elements.find((element) => element.kind === "actor");
  if (actor === undefined) {
    throw new Error("Falta el actor");
  }
  return actor;
}

function useCaseOf(document: DiagramDocument) {
  const useCase = document.elements.find(
    (element) => element.kind === "use-case",
  );
  if (useCase === undefined) {
    throw new Error("Falta el caso de uso");
  }
  return useCase;
}

describe("createEditorStore isolation", () => {
  it("mantiene instancias independientes", () => {
    const first = createStore();
    const second = createStore();
    const beforeSecond = second.getState().document;

    expectOk(
      first.getState().createActor({ name: "A", geometry: ACTOR_GEOMETRY }),
    );

    expect(first.getState().document.elements).toHaveLength(2);
    expect(second.getState().document).toBe(beforeSecond);
    expect(second.getState().document.elements).toHaveLength(1);
    expect(second.getState().history.past).toHaveLength(0);
  });
});

describe("semantic actions undo/redo", () => {
  it("crea, renombra, mueve, conecta y borra con undo/redo", () => {
    const store = createStore();
    const initial = store.getState().document;
    const boundary = boundaryOf(initial);

    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const afterCreate = store.getState().document;
    expect(afterCreate.elements).toHaveLength(2);

    store.getState().undo();
    expect(store.getState().document).toBe(initial);
    store.getState().redo();
    expect(store.getState().document).toBe(afterCreate);

    const actorId = actorOf(store.getState().document).id;
    expectOk(store.getState().renameElement(actorId, "Cliente"));
    expect(actorOf(store.getState().document).name).toBe("Cliente");
    store.getState().undo();
    expect(actorOf(store.getState().document).name).toBe("Usuario");
    store.getState().redo();
    expect(actorOf(store.getState().document).name).toBe("Cliente");

    expectOk(store.getState().commitMove([{ id: actorId, x: 10, y: 20 }]));
    expect(actorOf(store.getState().document).geometry).toMatchObject({
      x: 10,
      y: 20,
    });
    store.getState().undo();
    expect(actorOf(store.getState().document).geometry).toMatchObject({
      x: ACTOR_GEOMETRY.x,
      y: ACTOR_GEOMETRY.y,
    });
    store.getState().redo();

    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
        parentId: boundary.id,
      }),
    );
    const useCaseId = useCaseOf(store.getState().document).id;
    expectOk(
      store.getState().connect({
        kind: "association",
        sourceId: actorId,
        targetId: useCaseId,
        sourceAnchor: "right",
        targetAnchor: "left",
      }),
    );
    expect(store.getState().document.relationships).toHaveLength(1);
    store.getState().undo();
    expect(store.getState().document.relationships).toHaveLength(0);
    store.getState().redo();

    expectOk(store.getState().deleteElements([actorId]));
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(false);
    expect(store.getState().document.relationships).toHaveLength(0);
    store.getState().undo();
    expect(actorOf(store.getState().document).id).toBe(actorId);
    expect(store.getState().document.relationships).toHaveLength(1);
  });

  it("duplica, redimensiona y reparenta como acciones semánticas", () => {
    const store = createStore();
    const boundary = boundaryOf(store.getState().document);

    expectOk(
      store.getState().createUseCase({
        name: "Alta",
        geometry: USE_CASE_GEOMETRY,
        parentId: boundary.id,
      }),
    );
    const useCaseId = useCaseOf(store.getState().document).id;
    expectOk(store.getState().duplicateElements([useCaseId]));
    expect(store.getState().document.elements).toHaveLength(3);
    store.getState().undo();
    expect(store.getState().document.elements).toHaveLength(2);

    expectOk(
      store.getState().commitResize({
        id: boundary.id,
        geometry: { ...DEFAULT_BOUNDARY_GEOMETRY, width: 400, height: 300 },
      }),
    );
    expect(boundaryOf(store.getState().document).geometry).toMatchObject({
      width: 400,
      height: 300,
    });
    store.getState().undo();
    expect(boundaryOf(store.getState().document).geometry).toMatchObject(
      DEFAULT_BOUNDARY_GEOMETRY,
    );

    expectOk(store.getState().reparentUseCase(useCaseId, undefined));
    expect(useCaseOf(store.getState().document).parentId).toBeUndefined();
    store.getState().undo();
    expect(useCaseOf(store.getState().document).parentId).toBe(boundary.id);
  });
});

describe("transactions", () => {
  it("agrupa cien updates en una sola entrada", () => {
    const store = createStore();
    const baseline = store.getState().document;
    const boundaryId = boundaryOf(baseline).id;

    store.getState().beginTransaction();
    expect(selectIsTransacting(store.getState())).toBe(true);
    expect(selectCanUndo(store.getState())).toBe(false);

    for (let index = 0; index < 100; index += 1) {
      expectOk(
        store.getState().commitMove([{ id: boundaryId, x: index, y: 0 }]),
      );
    }

    expect(store.getState().history.past).toHaveLength(0);
    expect(boundaryOf(store.getState().document).geometry.x).toBe(99);

    store.getState().commitTransaction();
    expect(selectIsTransacting(store.getState())).toBe(false);
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.past[0]).toBe(baseline);

    store.getState().undo();
    expect(store.getState().document).toBe(baseline);
  });

  it("cancelTransaction restaura el documento sin historial", () => {
    const store = createStore();
    const baseline = store.getState().document;
    const boundaryId = boundaryOf(baseline).id;

    store.getState().beginTransaction();
    expectOk(store.getState().commitMove([{ id: boundaryId, x: 50, y: 60 }]));
    store.getState().cancelTransaction();

    expect(store.getState().document).toBe(baseline);
    expect(store.getState().history.past).toHaveLength(0);
    expect(selectIsTransacting(store.getState())).toBe(false);
  });
});

describe("history limit and redo invalidation", () => {
  it("descarta el commit más antiguo al superar 100", () => {
    const store = createStore();
    const original = store.getState().document;
    const boundaryId = boundaryOf(original).id;

    for (let index = 1; index <= HISTORY_LIMIT + 1; index += 1) {
      expectOk(
        store.getState().commitMove([{ id: boundaryId, x: index, y: 0 }]),
      );
    }

    expect(store.getState().history.past).toHaveLength(HISTORY_LIMIT);
    expect(store.getState().history.past[0]).not.toBe(original);
    expect(boundaryOf(store.getState().document).geometry.x).toBe(
      HISTORY_LIMIT + 1,
    );

    for (let step = 0; step < HISTORY_LIMIT; step += 1) {
      expect(store.getState().undo()).toBe(true);
    }

    expect(store.getState().undo()).toBe(false);
    expect(boundaryOf(store.getState().document).geometry.x).toBe(1);
    expect(store.getState().document).not.toBe(original);
  });

  it("una mutación nueva invalida redo", () => {
    const store = createStore();
    expectOk(
      store.getState().createActor({ name: "Uno", geometry: ACTOR_GEOMETRY }),
    );
    expectOk(
      store.getState().createActor({
        name: "Dos",
        geometry: { ...ACTOR_GEOMETRY, x: 0 },
      }),
    );
    store.getState().undo();
    expect(selectCanRedo(store.getState())).toBe(true);

    const actorId = actorOf(store.getState().document).id;
    expectOk(store.getState().renameElement(actorId, "Único"));

    expect(selectCanRedo(store.getState())).toBe(false);
    expect(store.getState().history.future).toHaveLength(0);
    expect(store.getState().redo()).toBe(false);
  });
});

describe("non-document slices stay out of history", () => {
  it("no registra zoom, pan, selección, hover ni mensajes", () => {
    const store = createStore();
    const history = store.getState().history;

    store.getState().setViewport(VIEWPORT);
    store.getState().setSelection({
      elementIds: [boundaryOf(store.getState().document).id],
      relationshipIds: [],
    });
    store.getState().setHover({
      elementId: boundaryOf(store.getState().document).id,
      relationshipId: undefined,
    });
    store.getState().setMessage("aviso");
    store.getState().setTool("actor");
    store.getState().setSaveStatus("saving");
    store.getState().setDialogMode("help");
    store.getState().clearSelection();

    expect(store.getState().history).toBe(history);
    expect(selectViewport(store.getState())).toEqual(VIEWPORT);
    expect(selectTool(store.getState())).toBe("actor");
    expect(selectMessage(store.getState())).toBe("aviso");
    expect(selectSaveStatus(store.getState())).toBe("saving");
    expect(selectSelectedElementIds(store.getState())).toEqual([]);
  });

  it("undo no restaura viewport ni selección", () => {
    const store = createStore();
    const boundaryId = boundaryOf(store.getState().document).id;
    store.getState().setSelection({
      elementIds: [boundaryId],
      relationshipIds: [],
    });
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actorId = actorOf(store.getState().document).id;
    store.getState().setSelection({
      elementIds: [actorId],
      relationshipIds: [],
    });
    store.getState().setViewport(VIEWPORT);

    store.getState().undo();

    expect(selectDocument(store.getState()).elements).toHaveLength(1);
    expect(selectViewport(store.getState())).toEqual(VIEWPORT);
    expect(selectSelectedElementIds(store.getState())).not.toEqual([
      boundaryId,
    ]);
  });
});

describe("domain errors and hydrate", () => {
  it("no muta historial si el dominio rechaza la acción", () => {
    const store = createStore();
    const history = store.getState().history;
    const document = store.getState().document;

    const result = store.getState().createSystemBoundary({
      name: "Otro",
      geometry: DEFAULT_BOUNDARY_GEOMETRY,
    });

    expect(result.ok).toBe(false);
    expect(store.getState().document).toBe(document);
    expect(store.getState().history).toBe(history);
    expect(selectMessage(store.getState())).toBe(
      "El documento ya tiene un SystemBoundary.",
    );
  });

  it("hydrateWorkspace sustituye el documento y vacía el historial", () => {
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const replacement = createDiagramDocument({
      createId: sequentialIds(90),
      now: () => CREATED_AT,
    });

    store.getState().hydrateWorkspace(replacement, VIEWPORT);

    expect(store.getState().document).toBe(replacement);
    expect(store.getState().viewport).toEqual(VIEWPORT);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.future).toHaveLength(0);
    expect(selectCanUndo(store.getState())).toBe(false);
  });
});

describe("selectors", () => {
  it("shallow compara proyecciones de objeto", () => {
    const store = createStore();
    const first = selectViewport(store.getState());
    store.getState().setTool("select");
    const second = selectViewport(store.getState());
    expect(shallow(first, second)).toBe(true);

    store.getState().setViewport(VIEWPORT);
    expect(shallow(first, selectViewport(store.getState()))).toBe(false);
  });

  it("anuncia solo mensajes de acción, no avisos persistentes", () => {
    const store = createStore();
    expect(selectLiveAnnouncement(store.getState())).toBe("");

    expectOk(
      store.getState().createActor({
        name: "Usuario",
        geometry: { x: 40, y: 40, width: 48, height: 96 },
      }),
    );
    expect(selectLiveAnnouncement(store.getState())).toBe("");

    store.getState().setMessage("Se creó Usuario.");
    expect(selectLiveAnnouncement(store.getState())).toBe("Se creó Usuario.");
  });
});
