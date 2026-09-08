import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { DiagramDocument, Result } from "../../domain/diagram/model.ts";
import { deleteElements } from "../../domain/diagram/operations.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  boundaryContainingPoint,
  clientToFlowPosition,
  createdElementAnnouncement,
  DEFAULT_ELEMENT_NAMES,
  DEFAULT_ELEMENT_SIZES,
  geometryAt,
  isCreateElementTool,
  nextDefaultName,
  placeElement,
} from "./createElementTool.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
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

function documentWithoutBoundary(): DiagramDocument {
  const createId = sequentialIds(50);
  const deps = { createId, now: () => CREATED_AT };
  const document = createDiagramDocument(deps);
  const boundary = document.elements[0];
  if (boundary === undefined) {
    throw new Error("Falta el boundary");
  }
  return expectOk(deleteElements(document, [boundary.id], deps));
}

describe("clientToFlowPosition", () => {
  it("convierte coordenadas de pantalla a coordenadas de flujo", () => {
    expect(
      clientToFlowPosition(
        { x: 200, y: 150 },
        { left: 100, top: 50 },
        { x: 10, y: 20, zoom: 2 },
      ),
    ).toEqual({ x: 45, y: 40 });
  });

  it("respeta zoom 50% y 200%", () => {
    const pane = { left: 0, top: 0 };
    const client = { x: 80, y: 40 };

    expect(
      clientToFlowPosition(client, pane, { x: 0, y: 0, zoom: 0.5 }),
    ).toEqual({ x: 160, y: 80 });
    expect(clientToFlowPosition(client, pane, { x: 0, y: 0, zoom: 2 })).toEqual(
      { x: 40, y: 20 },
    );
  });
});

describe("nextDefaultName", () => {
  it("usa el nombre base y un contador de presentación", () => {
    expect(nextDefaultName([], "Actor")).toBe("Actor");
    expect(nextDefaultName(["Actor"], "Actor")).toBe("Actor 2");
    expect(nextDefaultName(["Actor", "Actor 2"], "Actor")).toBe("Actor 3");
  });
});

describe("geometryAt", () => {
  it("coloca el origen en el punto de flujo", () => {
    expect(geometryAt("actor", { x: 12, y: 24 })).toEqual({
      x: 12,
      y: 24,
      width: DEFAULT_ELEMENT_SIZES.actor.width,
      height: DEFAULT_ELEMENT_SIZES.actor.height,
    });
    expect(geometryAt("system-boundary", { x: 1, y: 2 })).toMatchObject({
      width: DEFAULT_BOUNDARY_GEOMETRY.width,
      height: DEFAULT_BOUNDARY_GEOMETRY.height,
    });
  });
});

describe("placeElement", () => {
  it("crea un actor, lo selecciona y anuncia", () => {
    const store = createStore();
    expectOk(placeElement(store, "actor", { x: 10, y: 20 }));

    const actor = store
      .getState()
      .document.elements.find((element) => element.kind === "actor");
    expect(actor).toMatchObject({
      name: DEFAULT_ELEMENT_NAMES.actor,
      geometry: { x: 10, y: 20, ...DEFAULT_ELEMENT_SIZES.actor },
    });
    expect(store.getState().selection.elementIds).toEqual([actor?.id]);
    expect(store.getState().tool).toBe("select");
    expect(store.getState().ui.message).toBe(
      createdElementAnnouncement(DEFAULT_ELEMENT_NAMES.actor),
    );
  });

  it("parenta el caso de uso si el punto cae dentro del boundary", () => {
    const store = createStore();
    const boundary = store
      .getState()
      .document.elements.find((element) => element.kind === "system-boundary");
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }

    expect(
      boundaryContainingPoint(store.getState().document, { x: 80, y: 80 }),
    ).toBe(boundary);
    expectOk(placeElement(store, "use-case", { x: 80, y: 80 }));

    const useCase = store
      .getState()
      .document.elements.find((element) => element.kind === "use-case");
    expect(useCase).toMatchObject({
      name: DEFAULT_ELEMENT_NAMES["use-case"],
      parentId: boundary.id,
      geometry: {
        x: 80 - boundary.geometry.x,
        y: 80 - boundary.geometry.y,
        ...DEFAULT_ELEMENT_SIZES["use-case"],
      },
    });
  });

  it("no parenta el caso de uso fuera del boundary", () => {
    const store = createStore();
    expectOk(placeElement(store, "use-case", { x: -200, y: -120 }));

    const useCase = store
      .getState()
      .document.elements.find((element) => element.kind === "use-case");
    expect(useCase?.parentId).toBeUndefined();
    expect(useCase?.geometry).toMatchObject({ x: -200, y: -120 });
  });

  it("rechaza un segundo boundary y no cambia la herramienta", () => {
    const store = createStore();
    store.getState().setTool("system-boundary");
    const result = placeElement(store, "system-boundary", { x: 0, y: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected error");
    }
    expect(result.error.code).toBe("BOUNDARY_EXISTS");
    expect(store.getState().tool).toBe("system-boundary");
    expect(
      store
        .getState()
        .document.elements.filter(
          (element) => element.kind === "system-boundary",
        ),
    ).toHaveLength(1);
  });

  it("crea un boundary cuando no hay uno", () => {
    const store = createEditorStore({
      document: documentWithoutBoundary(),
    });
    expectOk(placeElement(store, "system-boundary", { x: 5, y: 6 }));

    const boundary = store
      .getState()
      .document.elements.find((element) => element.kind === "system-boundary");
    expect(boundary).toMatchObject({
      name: DEFAULT_ELEMENT_NAMES["system-boundary"],
      geometry: { x: 5, y: 6, ...DEFAULT_ELEMENT_SIZES["system-boundary"] },
    });
    expect(store.getState().ui.message).toBe(
      createdElementAnnouncement(DEFAULT_ELEMENT_NAMES["system-boundary"]),
    );
  });

  it("numera el nombre por defecto si ya existe", () => {
    const store = createStore();
    expectOk(placeElement(store, "actor", { x: 0, y: 0 }));
    expectOk(placeElement(store, "actor", { x: 24, y: 24 }));

    const names = store
      .getState()
      .document.elements.filter((element) => element.kind === "actor")
      .map((element) => element.name);
    expect(names).toEqual(["Actor", "Actor 2"]);
  });
});

describe("isCreateElementTool", () => {
  it("reconoce solo las herramientas de elemento", () => {
    expect(isCreateElementTool("actor")).toBe(true);
    expect(isCreateElementTool("select")).toBe(false);
    expect(isCreateElementTool("association")).toBe(false);
  });
});
