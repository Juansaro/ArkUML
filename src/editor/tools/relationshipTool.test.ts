import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Geometry, Result } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import {
  announceInvalidConnection,
  anchorFromHandle,
  commitRelationship,
  createdRelationshipAnnouncement,
  isRelationshipTool,
  isValidRelationshipConnection,
  previewConnection,
  relationshipInputFromConnection,
  relationshipKindFromTool,
} from "./relationshipTool.ts";

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
const USE_CASE_GEOMETRY: Geometry = { x: 80, y: 80, width: 160, height: 80 };

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

function seedActorAndUseCase(store: ReturnType<typeof createStore>) {
  expectOk(
    store.getState().createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
  );
  expectOk(
    store.getState().createUseCase({
      name: "Login",
      geometry: USE_CASE_GEOMETRY,
    }),
  );
  const actor = store
    .getState()
    .document.elements.find((element) => element.kind === "actor");
  const useCase = store
    .getState()
    .document.elements.find((element) => element.kind === "use-case");
  const boundary = store
    .getState()
    .document.elements.find((element) => element.kind === "system-boundary");
  if (actor === undefined || useCase === undefined || boundary === undefined) {
    throw new Error("Faltan extremos");
  }
  return { actor, useCase, boundary };
}

describe("relationshipTool", () => {
  it("reconoce el modo de relación y el kind desde la paleta", () => {
    expect(isRelationshipTool("association")).toBe(true);
    expect(isRelationshipTool("select")).toBe(false);
    expect(relationshipKindFromTool("association")).toBe("association");
    expect(relationshipKindFromTool("actor")).toBeUndefined();
  });

  it("mapea handles a anclas y descarta ids desconocidos", () => {
    expect(anchorFromHandle("left")).toBe("left");
    expect(anchorFromHandle("top")).toBe("top");
    expect(anchorFromHandle(null)).toBe("right");
    expect(anchorFromHandle("center")).toBe("right");
  });

  it("acepta Actor–UseCase y normaliza el actor como origen", () => {
    const store = createStore();
    const { actor, useCase } = seedActorAndUseCase(store);
    const forward = previewConnection(store.getState().document, {
      kind: "association",
      sourceId: actor.id,
      targetId: useCase.id,
    });
    const reversed = previewConnection(store.getState().document, {
      kind: "association",
      sourceId: useCase.id,
      targetId: actor.id,
    });

    expect(forward.ok).toBe(true);
    expect(reversed.ok).toBe(true);
    if (!reversed.ok) {
      throw new Error("Expected ok");
    }
    expect(reversed.value).toMatchObject({
      kind: "association",
      sourceId: actor.id,
      targetId: useCase.id,
    });
  });

  it("rechaza actor–actor, boundary y self-loop con el mensaje de dominio", () => {
    const store = createStore();
    const { actor, useCase, boundary } = seedActorAndUseCase(store);
    expectOk(
      store.getState().createActor({
        name: "Admin",
        geometry: { ...ACTOR_GEOMETRY, x: -240 },
      }),
    );
    const otherActor = store
      .getState()
      .document.elements.find(
        (element) => element.kind === "actor" && element.name === "Admin",
      );
    if (otherActor === undefined) {
      throw new Error("Falta el segundo actor");
    }

    const actorActor = previewConnection(store.getState().document, {
      kind: "association",
      sourceId: actor.id,
      targetId: otherActor.id,
    });
    const withBoundary = previewConnection(store.getState().document, {
      kind: "association",
      sourceId: actor.id,
      targetId: boundary.id,
    });
    const self = previewConnection(store.getState().document, {
      kind: "association",
      sourceId: useCase.id,
      targetId: useCase.id,
    });

    expect(actorActor.ok).toBe(false);
    expect(withBoundary.ok).toBe(false);
    expect(self.ok).toBe(false);
    if (actorActor.ok || withBoundary.ok || self.ok) {
      throw new Error("Expected domain errors");
    }
    expect(actorActor.error.code).toBe("INVALID_CONNECTION");
    expect(actorActor.error.message).toMatch(/actor y un caso de uso/i);
    expect(withBoundary.error.code).toBe("INVALID_CONNECTION");
    expect(withBoundary.error.message).toMatch(/SystemBoundary/i);
    expect(self.error.code).toBe("SELF_RELATIONSHIP");
  });

  it("isValidRelationshipConnection sigue a canConnect", () => {
    const store = createStore();
    const { actor, useCase, boundary } = seedActorAndUseCase(store);

    expect(
      isValidRelationshipConnection(store.getState().document, "association", {
        source: actor.id,
        target: useCase.id,
        sourceHandle: "right",
        targetHandle: "left",
      }),
    ).toBe(true);
    expect(
      isValidRelationshipConnection(store.getState().document, "association", {
        source: actor.id,
        target: boundary.id,
        sourceHandle: "right",
        targetHandle: "left",
      }),
    ).toBe(false);
    expect(
      isValidRelationshipConnection(store.getState().document, "association", {
        source: "",
        target: useCase.id,
        sourceHandle: null,
        targetHandle: null,
      }),
    ).toBe(false);
  });

  it("commitRelationship normaliza el drag inverso, selecciona y anuncia", () => {
    const store = createStore();
    const { actor, useCase } = seedActorAndUseCase(store);
    store.getState().setTool("association");

    const result = commitRelationship(
      store,
      relationshipInputFromConnection("association", {
        source: useCase.id,
        target: actor.id,
        sourceHandle: "left",
        targetHandle: "right",
      }),
    );

    expectOk(result);
    const relationship = store.getState().document.relationships[0];
    expect(relationship).toMatchObject({
      kind: "association",
      sourceId: actor.id,
      targetId: useCase.id,
      sourceAnchor: "right",
      targetAnchor: "left",
    });
    expect(store.getState().selection.relationshipIds).toEqual([
      relationship?.id,
    ]);
    expect(store.getState().selection.elementIds).toEqual([]);
    expect(store.getState().ui.message).toBe(
      createdRelationshipAnnouncement("association"),
    );
    expect(store.getState().tool).toBe("association");
    expect(store.getState().history.past).toHaveLength(3);
  });

  it("un intento inválido no muta y anuncia el mensaje de dominio", () => {
    const store = createStore();
    const { actor, boundary } = seedActorAndUseCase(store);
    const before = store.getState().document;

    const result = commitRelationship(store, {
      kind: "association",
      sourceId: actor.id,
      targetId: boundary.id,
      sourceAnchor: "right",
      targetAnchor: "left",
    });

    expect(result.ok).toBe(false);
    expect(store.getState().document).toBe(before);
    expect(store.getState().document.relationships).toEqual([]);
    expect(store.getState().ui.message).toMatch(/SystemBoundary/i);

    store.getState().setMessage(undefined);
    announceInvalidConnection(store, "association", actor.id, boundary.id);
    expect(store.getState().ui.message).toMatch(/SystemBoundary/i);
    expect(store.getState().document.relationships).toEqual([]);
  });

  it("rechaza un duplicado equivalente en sentido inverso", () => {
    const store = createStore();
    const { actor, useCase } = seedActorAndUseCase(store);
    expectOk(
      commitRelationship(store, {
        kind: "association",
        sourceId: actor.id,
        targetId: useCase.id,
        sourceAnchor: "right",
        targetAnchor: "left",
      }),
    );

    const duplicate = commitRelationship(store, {
      kind: "association",
      sourceId: useCase.id,
      targetId: actor.id,
      sourceAnchor: "top",
      targetAnchor: "bottom",
    });

    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) {
      throw new Error("Expected duplicate");
    }
    expect(duplicate.error.code).toBe("DUPLICATE_RELATIONSHIP");
    expect(store.getState().document.relationships).toHaveLength(1);
  });
});
