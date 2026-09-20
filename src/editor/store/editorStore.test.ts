import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import {
  DOCUMENT_FILE_FORMAT_V1,
  DOCUMENT_FILE_FORMAT_VERSION_V1,
  parseDocumentFileText,
  serializeDocumentFile,
} from "../../domain/diagram/documentFile.ts";
import type {
  DiagramDocument,
  DiagramDocumentV1,
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

  it("reconecta una asociación conservando el id y deshace el gesto", () => {
    const store = createStore();
    expectOk(
      store.getState().createActor({
        name: "Usuario",
        geometry: ACTOR_GEOMETRY,
      }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
      }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Logout",
        geometry: { ...USE_CASE_GEOMETRY, x: 280 },
      }),
    );
    const actorId = actorOf(store.getState().document).id;
    const login = store
      .getState()
      .document.elements.find(
        (element) => element.kind === "use-case" && element.name === "Login",
      );
    const logout = store
      .getState()
      .document.elements.find(
        (element) => element.kind === "use-case" && element.name === "Logout",
      );
    if (login === undefined || logout === undefined) {
      throw new Error("Faltan casos de uso");
    }
    expectOk(
      store.getState().connect({
        kind: "association",
        sourceId: actorId,
        targetId: login.id,
        sourceAnchor: "right",
        targetAnchor: "left",
      }),
    );
    const relationshipId = store.getState().document.relationships[0]?.id;
    if (relationshipId === undefined) {
      throw new Error("Falta la asociación");
    }
    expectOk(
      store.getState().reconnect({
        id: relationshipId,
        kind: "association",
        sourceId: actorId,
        targetId: logout.id,
        sourceAnchor: "right",
        targetAnchor: "left",
      }),
    );
    expect(store.getState().document.relationships[0]).toMatchObject({
      id: relationshipId,
      targetId: logout.id,
    });
    store.getState().undo();
    expect(store.getState().document.relationships[0]).toMatchObject({
      id: relationshipId,
      targetId: login.id,
    });
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
    store
      .getState()
      .setClipboard([
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
      ]);
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
    expect(store.getState().clipboard.items).toHaveLength(0);
    expect(store.getState().clipboard.pasteCount).toBe(0);
  });

  it("un archivo de usuario importado añade, activa y vacía el historial del nuevo", () => {
    const store = createStore();
    const previousId = store.getState().document.id;
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    store.getState().setViewport({ x: 1, y: 2, zoom: 0.5 });

    const imported = createDiagramDocument({
      createId: sequentialIds(90),
      now: () => CREATED_AT,
    });
    const v1: DiagramDocumentV1 = {
      schemaVersion: 1,
      id: imported.id,
      kind: "use-case",
      metadata: imported.metadata,
      elements: imported.elements.filter(
        (element): element is DiagramDocumentV1["elements"][number] =>
          element.kind !== "lifeline",
      ),
      relationships: imported.relationships.filter(
        (
          relationship,
        ): relationship is DiagramDocumentV1["relationships"][number] =>
          relationship.kind === "association" ||
          relationship.kind === "include" ||
          relationship.kind === "extend",
      ),
    };
    const parsed = parseDocumentFileText(
      JSON.stringify({
        format: DOCUMENT_FILE_FORMAT_V1,
        formatVersion: DOCUMENT_FILE_FORMAT_VERSION_V1,
        document: v1,
        view: VIEWPORT,
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(
      store.getState().importDocument(parsed.value.document, parsed.value.view),
    ).toBe(true);

    expect(store.getState().document).toEqual(imported);
    expect(store.getState().viewport).toEqual(VIEWPORT);
    expect(store.getState().documents).toHaveLength(2);
    expect(
      store
        .getState()
        .documents.some((entry) => entry.document.id === previousId),
    ).toBe(true);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.future).toHaveLength(0);
    expect(selectCanUndo(store.getState())).toBe(false);
  });

  it("importDocument asigna un id nuevo si el archivo choca con la biblioteca", () => {
    const store = createStore();
    const current = store.getState().document;
    expect(store.getState().importDocument(current, VIEWPORT)).toBe(true);
    expect(store.getState().documents).toHaveLength(2);
    expect(store.getState().document.id).not.toBe(current.id);
    expect(store.getState().document.metadata).toEqual(current.metadata);
    expect(store.getState().viewport).toEqual(VIEWPORT);
  });

  it("importDocument de un 2.x secuencia añade y activa", () => {
    const store = createStore();
    const previousId = store.getState().document.id;
    const sequence = createEmptySequenceDocument({
      createId: sequentialIds(90),
      now: () => CREATED_AT,
    });
    const parsed = parseDocumentFileText(
      serializeDocumentFile(sequence, VIEWPORT),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(
      store.getState().importDocument(parsed.value.document, parsed.value.view),
    ).toBe(true);
    expect(store.getState().document.kind).toBe("sequence");
    expect(store.getState().document.id).toBe(sequence.id);
    expect(store.getState().documents).toHaveLength(2);
    expect(
      store
        .getState()
        .documents.some((entry) => entry.document.id === previousId),
    ).toBe(true);
  });
});

describe("biblioteca local", () => {
  it("añade, activa y no borra el último documento", () => {
    const store = createStore();
    const firstId = store.getState().document.id;
    const second = createDiagramDocument({
      createId: sequentialIds(40),
      now: () => CREATED_AT,
    });

    expect(store.getState().addDocument(second)).toBe(true);
    expect(store.getState().activeDocumentId).toBe(second.id);
    expect(store.getState().document).toBe(second);
    expect(store.getState().documents).toHaveLength(2);
    expect(store.getState().history.past).toHaveLength(0);

    expect(store.getState().activateDocument(firstId)).toBe(true);
    expect(store.getState().activeDocumentId).toBe(firstId);

    expect(store.getState().deleteDocument(firstId)).toBe(true);
    expect(store.getState().documents).toHaveLength(1);
    expect(store.getState().activeDocumentId).toBe(second.id);
    expect(store.getState().deleteDocument(second.id)).toBe(false);
    expect(store.getState().documents).toHaveLength(1);
  });

  it("addNewDocument añade del mismo kind y lo activa", () => {
    const store = createStore();
    const firstId = store.getState().document.id;
    expect(store.getState().addNewDocument()).toBe(true);
    expect(store.getState().documents).toHaveLength(2);
    expect(store.getState().activeDocumentId).not.toBe(firstId);
    expect(store.getState().document.kind).toBe("use-case");
    expect(store.getState().document.metadata.title).toBe(
      "Diagrama de casos de uso",
    );
    expect(
      store.getState().documents.some((entry) => entry.document.id === firstId),
    ).toBe(true);
  });

  it("addNewDocument de un secuencia añade otra secuencia", () => {
    const createId = sequentialIds(80);
    const store = createEditorStore({
      document: createEmptySequenceDocument({
        createId,
        now: () => CREATED_AT,
      }),
      deps: { createId, now: () => CREATED_AT },
    });
    expect(store.getState().addNewDocument()).toBe(true);
    expect(store.getState().documents).toHaveLength(2);
    expect(
      store
        .getState()
        .documents.every((entry) => entry.document.kind === "sequence"),
    ).toBe(true);
  });

  it("addNewDocument(sequence) desde casos de uso crea el módulo secuencia", () => {
    const store = createStore();
    expect(store.getState().addNewDocument("sequence")).toBe(true);
    expect(store.getState().document.kind).toBe("sequence");
    expect(store.getState().tool).toBe("select");
    expect(store.getState().documents).toHaveLength(2);
  });

  it("addNewDocument(component) crea el módulo de componentes", () => {
    const store = createStore();
    expect(store.getState().addNewDocument("component")).toBe(true);
    expect(store.getState().document.kind).toBe("component");
    expect(store.getState().document.metadata.title).toBe(
      "Diagrama de componentes",
    );
    expect(store.getState().document.elements).toEqual([]);
    expect(store.getState().tool).toBe("select");
    expect(store.getState().documents).toHaveLength(2);
  });

  it("aisla el historial por document.id", () => {
    const store = createStore();
    const firstId = store.getState().document.id;
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const afterA = store.getState().document;

    const second = createDiagramDocument({
      createId: sequentialIds(40),
      now: () => CREATED_AT,
    });
    expect(store.getState().addDocument(second)).toBe(true);
    expectOk(
      store.getState().createActor({ name: "Otro", geometry: ACTOR_GEOMETRY }),
    );
    const afterB = store.getState().document;

    expect(store.getState().activateDocument(firstId)).toBe(true);
    expect(store.getState().document).toEqual(afterA);
    expect(store.getState().undo()).toBe(true);
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(false);

    expect(store.getState().activateDocument(second.id)).toBe(true);
    expect(store.getState().document).toEqual(afterB);
    expect(
      store
        .getState()
        .document.elements.some((element) => element.name === "Otro"),
    ).toBe(true);
  });

  it("hydrateWorkspaceSnapshot restaura todos los documentos y el activo", () => {
    const store = createStore();
    const first = createDiagramDocument({
      createId: sequentialIds(40),
      now: () => CREATED_AT,
    });
    const second = createDiagramDocument({
      createId: sequentialIds(60),
      now: () => CREATED_AT,
    });
    store.getState().hydrateWorkspaceSnapshot({
      storageVersion: 2,
      activeDocumentId: second.id,
      documents: [
        { document: first, view: { x: 1, y: 2, zoom: 1 } },
        { document: second, view: VIEWPORT },
      ],
    });

    expect(store.getState().documents).toHaveLength(2);
    expect(store.getState().activeDocumentId).toBe(second.id);
    expect(store.getState().document).toBe(second);
    expect(store.getState().viewport).toEqual(VIEWPORT);
    expect(store.getState().history.past).toHaveLength(0);
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
