import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOUNDARY_GEOMETRY,
  DUPLICATE_OFFSET,
  MIN_BOUNDARY_HEIGHT,
  MIN_BOUNDARY_WIDTH,
  NAME_MAX_LENGTH,
} from "./defaults.ts";
import {
  createActor,
  createDiagramDocument,
  createRelationship as buildRelationship,
  createUseCase,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, Geometry, Result, UseCase } from "./model.ts";
import {
  createElement,
  createRelationship,
  deleteElements,
  deleteRelationships,
  duplicateElements,
  moveElements,
  renameElement,
  reparentUseCase,
  resizeBoundary,
} from "./operations.ts";
import { relationshipLabel } from "./rules.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const UPDATED_AT = new Date("2026-09-08T08:00:00.000Z");
const MISSING_ID = "00000000-0000-4000-8000-ffffffffffff";

const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 48, height: 96 };
const USE_CASE_GEOMETRY: Geometry = { x: 80, y: 80, width: 160, height: 80 };

function emptyDocument(createId: IdFactory = sequentialIds()): DiagramDocument {
  return createDiagramDocument({
    createId,
    now: () => CREATED_AT,
  });
}

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function expectCode(result: Result<unknown>, code: string): void {
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.error.code).toBe(code);
}

function expectUnchanged(
  result: Result<DiagramDocument>,
  document: DiagramDocument,
): void {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }
  expect(result.value).toBe(document);
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

describe("createElement", () => {
  it("inserta actor y caso de uso, y rechaza un segundo boundary", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const actor = expectOk(
      createElement(
        document,
        { kind: "actor", name: "  Usuario  ", geometry: ACTOR_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const withUseCase = expectOk(
      createElement(
        actor,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundaryOf(actor).id,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );

    expect(withUseCase.elements).toHaveLength(3);
    expect(withUseCase.elements[1]).toMatchObject({
      kind: "actor",
      name: "Usuario",
    });
    expect(withUseCase.elements[2]).toMatchObject({
      kind: "use-case",
      name: "Login",
      parentId: boundaryOf(actor).id,
    });
    expectCode(
      createElement(withUseCase, {
        kind: "system-boundary",
        name: "Otro",
        geometry: DEFAULT_BOUNDARY_GEOMETRY,
      }),
      "BOUNDARY_EXISTS",
    );
  });

  it("permite recrear el único boundary tras eliminarlo", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const cleared = expectOk(
      deleteElements(document, [boundaryOf(document).id], {
        now: () => UPDATED_AT,
      }),
    );
    const restored = expectOk(
      createElement(
        cleared,
        {
          kind: "system-boundary",
          name: "Sistema",
          geometry: DEFAULT_BOUNDARY_GEOMETRY,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(restored.elements).toHaveLength(1);
    expect(restored.elements[0]?.kind).toBe("system-boundary");
  });

  it("rechaza nombres inválidos, padre inválido y geometría no finita o pequeña", () => {
    const document = emptyDocument();
    expectCode(
      createElement(document, {
        kind: "actor",
        name: "   ",
        geometry: ACTOR_GEOMETRY,
      }),
      "INVALID_NAME",
    );
    expectCode(
      createElement(document, {
        kind: "use-case",
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
        parentId: MISSING_ID,
      }),
      "INVALID_PARENT",
    );
    const withActor = expectOk(
      createElement(document, {
        kind: "actor",
        name: "Usuario",
        geometry: ACTOR_GEOMETRY,
      }),
    );
    const actor = withActor.elements.find(
      (element) => element.kind === "actor",
    );
    if (actor === undefined) {
      throw new Error("Falta el actor");
    }
    expectCode(
      createElement(withActor, {
        kind: "use-case",
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
        parentId: actor.id,
      }),
      "INVALID_PARENT",
    );
    expectCode(
      createElement(document, {
        kind: "actor",
        name: "Usuario",
        geometry: { ...ACTOR_GEOMETRY, x: Number.POSITIVE_INFINITY },
      }),
      "INVALID_GEOMETRY",
    );
    const withoutBoundary = expectOk(
      deleteElements(document, [boundaryOf(document).id]),
    );
    expectCode(
      createElement(withoutBoundary, {
        kind: "system-boundary",
        name: "Sistema",
        geometry: {
          x: 0,
          y: 0,
          width: MIN_BOUNDARY_WIDTH - 1,
          height: MIN_BOUNDARY_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );
  });
});

describe("renameElement", () => {
  it("hace trim, acepta duplicados y rechaza vacío o más de 80", () => {
    const createId = sequentialIds();
    let document = emptyDocument(createId);
    document = expectOk(
      createElement(
        document,
        { kind: "actor", name: "Uno", geometry: ACTOR_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    document = expectOk(
      createElement(
        document,
        { kind: "actor", name: "Dos", geometry: { ...ACTOR_GEOMETRY, y: 200 } },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const [first, second] = document.elements.filter(
      (element) => element.kind === "actor",
    );
    if (first === undefined || second === undefined) {
      throw new Error("Faltan actores");
    }

    const renamed = expectOk(
      renameElement(document, first.id, "  Dos  ", { now: () => UPDATED_AT }),
    );
    expect(
      renamed.elements.find((element) => element.id === first.id)?.name,
    ).toBe("Dos");
    expect(
      renamed.elements.filter(
        (element) => element.kind === "actor" && element.name === "Dos",
      ),
    ).toHaveLength(2);

    expectCode(renameElement(document, first.id, " "), "INVALID_NAME");
    expectCode(
      renameElement(document, first.id, "x".repeat(NAME_MAX_LENGTH + 1)),
      "INVALID_NAME",
    );
    expect(
      expectOk(
        renameElement(document, first.id, "x".repeat(NAME_MAX_LENGTH)),
      ).elements.find((element) => element.id === first.id)?.name,
    ).toHaveLength(NAME_MAX_LENGTH);
    expectUnchanged(renameElement(document, first.id, "Uno"), document);
    expectCode(
      renameElement(document, MISSING_ID, "Nombre"),
      "UNKNOWN_ELEMENT",
    );
  });
});

describe("moveElements and resizeBoundary", () => {
  it("mueve el boundary sin alterar coordenadas relativas de los hijos", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const boundary = boundaryOf(document);
    const withChild = expectOk(
      createElement(
        document,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundary.id,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const child = withChild.elements.find(
      (element) => element.kind === "use-case",
    );
    const moved = expectOk(
      moveElements(withChild, [{ id: boundary.id, x: 40, y: 80 }], {
        now: () => UPDATED_AT,
      }),
    );
    const movedChild = moved.elements.find(
      (element) => element.kind === "use-case",
    );
    expect(
      moved.elements.find((element) => element.id === boundary.id)?.geometry,
    ).toMatchObject({
      x: 40,
      y: 80,
    });
    expect(movedChild?.geometry).toEqual(child?.geometry);
  });

  it("rechaza ids desconocidos, geometría no finita y tamaños bajo el mínimo", () => {
    const document = emptyDocument();
    const boundary = boundaryOf(document);
    const actorDoc = expectOk(
      createElement(document, {
        kind: "actor",
        name: "Usuario",
        geometry: ACTOR_GEOMETRY,
      }),
    );
    const actor = actorDoc.elements.find((element) => element.kind === "actor");
    if (actor === undefined) {
      throw new Error("Falta el actor");
    }

    expectUnchanged(moveElements(document, []), document);
    expectCode(
      moveElements(document, [{ id: MISSING_ID, x: 1, y: 1 }]),
      "UNKNOWN_ELEMENT",
    );
    expectCode(
      moveElements(document, [{ id: boundary.id, x: Number.NaN, y: 0 }]),
      "INVALID_GEOMETRY",
    );
    expectCode(
      resizeBoundary(document, {
        id: boundary.id,
        geometry: {
          ...DEFAULT_BOUNDARY_GEOMETRY,
          width: MIN_BOUNDARY_WIDTH - 1,
        },
      }),
      "INVALID_GEOMETRY",
    );
    expectCode(
      resizeBoundary(document, {
        id: boundary.id,
        geometry: {
          ...DEFAULT_BOUNDARY_GEOMETRY,
          height: Number.POSITIVE_INFINITY,
        },
      }),
      "INVALID_GEOMETRY",
    );
    expectCode(
      resizeBoundary(actorDoc, {
        id: actor.id,
        geometry: DEFAULT_BOUNDARY_GEOMETRY,
      }),
      "INVALID_GEOMETRY",
    );
    expectCode(
      resizeBoundary(document, {
        id: MISSING_ID,
        geometry: DEFAULT_BOUNDARY_GEOMETRY,
      }),
      "UNKNOWN_ELEMENT",
    );

    const resized = expectOk(
      resizeBoundary(document, {
        id: boundary.id,
        geometry: {
          x: 10,
          y: 20,
          width: MIN_BOUNDARY_WIDTH,
          height: MIN_BOUNDARY_HEIGHT,
        },
      }),
    );
    expect(resized.elements[0]?.geometry).toEqual({
      x: 10,
      y: 20,
      width: MIN_BOUNDARY_WIDTH,
      height: MIN_BOUNDARY_HEIGHT,
    });
  });
});

describe("reparentUseCase", () => {
  it("conserva la posición visual al entrar y salir del boundary", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const boundary = boundaryOf(document);
    const absolute = { x: 140, y: 90, width: 160, height: 80 };
    const withUseCase = expectOk(
      createElement(
        document,
        { kind: "use-case", name: "Login", geometry: absolute },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const useCase = withUseCase.elements.find(
      (element) => element.kind === "use-case",
    );
    if (useCase === undefined) {
      throw new Error("Falta el caso");
    }

    const parented = expectOk(
      reparentUseCase(withUseCase, useCase.id, boundary.id, {
        now: () => UPDATED_AT,
      }),
    );
    const attached = parented.elements.find(
      (element): element is UseCase => element.kind === "use-case",
    );
    expect(attached?.parentId).toBe(boundary.id);
    expect(attached?.geometry).toEqual({
      x: absolute.x - boundary.geometry.x,
      y: absolute.y - boundary.geometry.y,
      width: absolute.width,
      height: absolute.height,
    });

    const detached = expectOk(
      reparentUseCase(parented, useCase.id, undefined, {
        now: () => UPDATED_AT,
      }),
    );
    const free = detached.elements.find(
      (element): element is UseCase => element.kind === "use-case",
    );
    expect(free?.parentId).toBeUndefined();
    expect(free?.geometry).toEqual(absolute);
    expectUnchanged(
      reparentUseCase(withUseCase, useCase.id, undefined),
      withUseCase,
    );
  });

  it("rechaza reparentar un no-caso, un padre inválido y geometría no finita", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const boundary = boundaryOf(document);
    const withActor = expectOk(
      createElement(
        document,
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const actor = withActor.elements.find(
      (element) => element.kind === "actor",
    );
    if (actor === undefined) {
      throw new Error("Falta el actor");
    }

    expectCode(
      reparentUseCase(document, MISSING_ID, boundary.id),
      "UNKNOWN_ELEMENT",
    );
    expectCode(
      reparentUseCase(withActor, actor.id, boundary.id),
      "INVALID_PARENT",
    );
    expectCode(
      reparentUseCase(document, boundary.id, MISSING_ID),
      "INVALID_PARENT",
    );

    const freeId = "00000000-0000-4000-8000-0000000000ee";
    const freeForMissingParent: DiagramDocument = {
      ...document,
      elements: [
        ...document.elements,
        {
          id: freeId,
          kind: "use-case",
          name: "Libre",
          geometry: USE_CASE_GEOMETRY,
        },
      ],
    };
    expectCode(
      reparentUseCase(freeForMissingParent, freeId, MISSING_ID),
      "INVALID_PARENT",
    );

    const broken: DiagramDocument = {
      ...document,
      elements: [
        ...document.elements,
        {
          id: "00000000-0000-4000-8000-0000000000aa",
          kind: "use-case",
          name: "Roto",
          geometry: { x: Number.NaN, y: 0, width: 10, height: 10 },
        },
      ],
    };
    expectCode(
      reparentUseCase(
        broken,
        "00000000-0000-4000-8000-0000000000aa",
        boundary.id,
      ),
      "INVALID_GEOMETRY",
    );

    const orphanId = "00000000-0000-4000-8000-0000000000cc";
    const orphaned: DiagramDocument = {
      ...document,
      elements: [
        ...document.elements,
        {
          id: orphanId,
          kind: "use-case",
          name: "Huérfano",
          parentId: MISSING_ID,
          geometry: USE_CASE_GEOMETRY,
        },
      ],
    };
    expectCode(
      reparentUseCase(orphaned, orphanId, boundary.id),
      "INVALID_PARENT",
    );

    const nanBoundary: DiagramDocument = {
      ...document,
      elements: document.elements.map((element) =>
        element.kind === "system-boundary"
          ? { ...element, geometry: { ...element.geometry, width: Number.NaN } }
          : element,
      ),
    };
    const freeUseCase = {
      id: "00000000-0000-4000-8000-0000000000dd",
      kind: "use-case" as const,
      name: "Libre",
      geometry: USE_CASE_GEOMETRY,
    };
    expectCode(
      reparentUseCase(
        { ...nanBoundary, elements: [...nanBoundary.elements, freeUseCase] },
        freeUseCase.id,
        boundary.id,
      ),
      "INVALID_GEOMETRY",
    );

    const childOfNan: DiagramDocument = {
      ...nanBoundary,
      elements: [
        ...nanBoundary.elements,
        {
          id: "00000000-0000-4000-8000-0000000000ff",
          kind: "use-case",
          name: "Hijo",
          parentId: boundary.id,
          geometry: USE_CASE_GEOMETRY,
        },
      ],
    };
    expectCode(
      reparentUseCase(
        childOfNan,
        "00000000-0000-4000-8000-0000000000ff",
        undefined,
      ),
      "INVALID_GEOMETRY",
    );
  });
});

describe("deleteElements", () => {
  it("elimina relaciones incidentes y desanida casos al borrar el boundary", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const boundary = boundaryOf(document);
    let next = expectOk(
      createElement(
        document,
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    next = expectOk(
      createElement(
        next,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundary.id,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    next = expectOk(
      createElement(
        next,
        {
          kind: "use-case",
          name: "Logout",
          geometry: { ...USE_CASE_GEOMETRY, y: 200 },
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const actor = next.elements.find((element) => element.kind === "actor");
    const login = next.elements.find(
      (element) => element.kind === "use-case" && element.name === "Login",
    );
    const logout = next.elements.find(
      (element) => element.kind === "use-case" && element.name === "Logout",
    );
    if (actor === undefined || login === undefined || logout === undefined) {
      throw new Error("Faltan elementos");
    }
    next = expectOk(
      createRelationship(
        next,
        {
          kind: "association",
          sourceId: actor.id,
          targetId: login.id,
          sourceAnchor: "right",
          targetAnchor: "left",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    next = expectOk(
      createRelationship(
        next,
        {
          kind: "include",
          sourceId: login.id,
          targetId: logout.id,
          sourceAnchor: "bottom",
          targetAnchor: "top",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );

    const original = structuredClone(next);
    const withoutActor = expectOk(
      deleteElements(next, [actor.id], { now: () => UPDATED_AT }),
    );
    expect(next).toEqual(original);
    expect(
      withoutActor.elements.find((element) => element.id === actor.id),
    ).toBeUndefined();
    expect(withoutActor.relationships).toHaveLength(1);
    expect(withoutActor.relationships[0]?.kind).toBe("include");

    const withoutBoundary = expectOk(
      deleteElements(withoutActor, [boundary.id], { now: () => UPDATED_AT }),
    );
    const detached = withoutBoundary.elements.find(
      (element): element is UseCase => element.id === login.id,
    );
    expect(detached?.parentId).toBeUndefined();
    expect(detached?.geometry).toEqual({
      x: boundary.geometry.x + USE_CASE_GEOMETRY.x,
      y: boundary.geometry.y + USE_CASE_GEOMETRY.y,
      width: USE_CASE_GEOMETRY.width,
      height: USE_CASE_GEOMETRY.height,
    });
    expect(withoutBoundary.relationships).toHaveLength(1);
  });

  it("borra hijo y boundary juntos sin dejar parentId huérfano", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const boundary = boundaryOf(document);
    const withChild = expectOk(
      createElement(
        document,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundary.id,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const child = withChild.elements.find(
      (element) => element.kind === "use-case",
    );
    if (child === undefined) {
      throw new Error("Falta el caso");
    }
    const deleted = expectOk(
      deleteElements(withChild, [boundary.id, child.id], {
        now: () => UPDATED_AT,
      }),
    );
    expect(deleted.elements).toEqual([]);
    expectUnchanged(deleteElements(document, []), document);
    expectCode(deleteElements(document, [MISSING_ID]), "UNKNOWN_ELEMENT");
  });

  it("rechaza desanidar un caso cuyo padre no es un boundary", () => {
    const createId = sequentialIds();
    const actor = createActor(
      { name: "Usuario", geometry: ACTOR_GEOMETRY },
      { createId },
    );
    const child = createUseCase(
      {
        name: "Huérfano",
        geometry: USE_CASE_GEOMETRY,
        parentId: actor.id,
      },
      { createId },
    );
    const invalid: DiagramDocument = {
      ...emptyDocument(createId),
      elements: [actor, child],
    };
    expectCode(deleteElements(invalid, [actor.id]), "INVALID_PARENT");
  });

  it("rechaza geometría no finita al desanidar", () => {
    const document = emptyDocument();
    const boundary = boundaryOf(document);
    const broken: DiagramDocument = {
      ...document,
      elements: [
        ...document.elements,
        {
          id: "00000000-0000-4000-8000-0000000000bb",
          kind: "use-case",
          name: "Roto",
          parentId: boundary.id,
          geometry: {
            x: 1,
            y: Number.NEGATIVE_INFINITY,
            width: 10,
            height: 10,
          },
        },
      ],
    };
    expectCode(deleteElements(broken, [boundary.id]), "INVALID_GEOMETRY");
  });
});

describe("duplicateElements", () => {
  it("duplica actor y caso con offset 24, sin relaciones y sin boundary", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const boundary = boundaryOf(document);
    let next = expectOk(
      createElement(
        document,
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    next = expectOk(
      createElement(
        next,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundary.id,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const actor = next.elements.find((element) => element.kind === "actor");
    const useCase = next.elements.find(
      (element) => element.kind === "use-case",
    );
    if (actor === undefined || useCase === undefined) {
      throw new Error("Faltan elementos");
    }
    next = expectOk(
      createRelationship(
        next,
        {
          kind: "association",
          sourceId: actor.id,
          targetId: useCase.id,
          sourceAnchor: "right",
          targetAnchor: "left",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );

    const duplicated = expectOk(
      duplicateElements(next, [actor.id, useCase.id, boundary.id], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    const copies = duplicated.elements.filter(
      (element) =>
        element.id !== actor.id &&
        element.id !== useCase.id &&
        element.id !== boundary.id,
    );
    expect(copies).toHaveLength(2);
    expect(duplicated.relationships).toHaveLength(1);
    expect(copies[0]).toMatchObject({
      kind: "actor",
      name: "Usuario",
      geometry: {
        x: ACTOR_GEOMETRY.x + DUPLICATE_OFFSET,
        y: ACTOR_GEOMETRY.y + DUPLICATE_OFFSET,
      },
    });
    expect(copies[1]).toMatchObject({
      kind: "use-case",
      name: "Login",
      parentId: boundary.id,
      geometry: {
        x: USE_CASE_GEOMETRY.x + DUPLICATE_OFFSET,
        y: USE_CASE_GEOMETRY.y + DUPLICATE_OFFSET,
      },
    });
    expectUnchanged(duplicateElements(next, [boundary.id]), next);
    expectUnchanged(duplicateElements(next, []), next);
    expectCode(duplicateElements(next, [MISSING_ID]), "UNKNOWN_ELEMENT");
  });

  it("rechaza geometría no finita y duplica un caso sin padre", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const withUseCase = expectOk(
      createElement(
        document,
        { kind: "use-case", name: "Libre", geometry: USE_CASE_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const useCase = withUseCase.elements.find(
      (element) => element.kind === "use-case",
    );
    if (useCase === undefined) {
      throw new Error("Falta el caso");
    }
    const duplicated = expectOk(
      duplicateElements(withUseCase, [useCase.id], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    const copy = duplicated.elements.at(-1);
    expect(copy).toMatchObject({ kind: "use-case", name: "Libre" });
    expect(copy).not.toHaveProperty("parentId");

    const broken: DiagramDocument = {
      ...document,
      elements: [
        ...document.elements,
        createActor(
          {
            name: "Roto",
            geometry: { x: 0, y: 0, width: Number.NaN, height: 1 },
          },
          { createId },
        ),
      ],
    };
    const brokenActor = broken.elements.find(
      (element) => element.kind === "actor",
    );
    if (brokenActor === undefined) {
      throw new Error("Falta el actor roto");
    }
    expectCode(duplicateElements(broken, [brokenActor.id]), "INVALID_GEOMETRY");
  });
});

describe("createRelationship and deleteRelationships", () => {
  it("normaliza Association actor→caso, intercambia anclas y no persiste etiqueta", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    let next = expectOk(
      createElement(
        document,
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    next = expectOk(
      createElement(
        next,
        { kind: "use-case", name: "Login", geometry: USE_CASE_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const actor = next.elements.find((element) => element.kind === "actor");
    const useCase = next.elements.find(
      (element) => element.kind === "use-case",
    );
    if (actor === undefined || useCase === undefined) {
      throw new Error("Faltan extremos");
    }

    const connected = expectOk(
      createRelationship(
        next,
        {
          kind: "association",
          sourceId: useCase.id,
          targetId: actor.id,
          sourceAnchor: "left",
          targetAnchor: "right",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const relationship = connected.relationships[0];
    expect(relationship).toMatchObject({
      kind: "association",
      sourceId: actor.id,
      targetId: useCase.id,
      sourceAnchor: "right",
      targetAnchor: "left",
    });
    expect(relationship).not.toHaveProperty("label");
    expect(relationship).not.toHaveProperty("stereotype");
    expect(relationshipLabel("association")).toBeUndefined();
    expectCode(
      createRelationship(connected, {
        kind: "association",
        sourceId: actor.id,
        targetId: useCase.id,
        sourceAnchor: "top",
        targetAnchor: "bottom",
      }),
      "DUPLICATE_RELATIONSHIP",
    );

    const ids = sequentialIds(80);
    const fresh = expectOk(
      createElement(
        emptyDocument(ids),
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
        { createId: ids, now: () => UPDATED_AT },
      ),
    );
    const withCase = expectOk(
      createElement(
        fresh,
        { kind: "use-case", name: "Login", geometry: USE_CASE_GEOMETRY },
        { createId: ids, now: () => UPDATED_AT },
      ),
    );
    const freshActor = withCase.elements.find(
      (element) => element.kind === "actor",
    );
    const freshUseCase = withCase.elements.find(
      (element) => element.kind === "use-case",
    );
    if (freshActor === undefined || freshUseCase === undefined) {
      throw new Error("Faltan extremos");
    }
    const forward = expectOk(
      createRelationship(withCase, {
        kind: "association",
        sourceId: freshActor.id,
        targetId: freshUseCase.id,
        sourceAnchor: "right",
        targetAnchor: "left",
      }),
    );
    expect(forward.relationships[0]).toMatchObject({
      sourceId: freshActor.id,
      targetId: freshUseCase.id,
      sourceAnchor: "right",
      targetAnchor: "left",
    });
  });

  it("no invierte Include y elimina relaciones por id", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    let next = expectOk(
      createElement(
        document,
        { kind: "use-case", name: "A", geometry: USE_CASE_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    next = expectOk(
      createElement(
        next,
        {
          kind: "use-case",
          name: "B",
          geometry: { ...USE_CASE_GEOMETRY, x: 300 },
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const first = next.elements.find((element) => element.name === "A");
    const second = next.elements.find((element) => element.name === "B");
    if (first === undefined || second === undefined) {
      throw new Error("Faltan casos");
    }

    const connected = expectOk(
      createRelationship(
        next,
        {
          kind: "include",
          sourceId: first.id,
          targetId: second.id,
          sourceAnchor: "right",
          targetAnchor: "left",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(connected.relationships[0]).toMatchObject({
      kind: "include",
      sourceId: first.id,
      targetId: second.id,
    });
    expect(relationshipLabel("include")).toBe("«include»");

    const relationshipId = connected.relationships[0]?.id;
    if (relationshipId === undefined) {
      throw new Error("Falta la relación");
    }
    const cleared = expectOk(
      deleteRelationships(connected, [relationshipId], {
        now: () => UPDATED_AT,
      }),
    );
    expect(cleared.relationships).toEqual([]);
    expectUnchanged(deleteRelationships(connected, []), connected);
    expectCode(
      deleteRelationships(connected, [MISSING_ID]),
      "UNKNOWN_RELATIONSHIP",
    );
    expectCode(
      createRelationship(next, {
        kind: "include",
        sourceId: first.id,
        targetId: first.id,
        sourceAnchor: "top",
        targetAnchor: "bottom",
      }),
      "SELF_RELATIONSHIP",
    );
  });

  it("puede crear una relación a partir de un registro de factory existente", () => {
    const createId = sequentialIds();
    const document = emptyDocument(createId);
    const actor = createActor(
      { name: "Usuario", geometry: ACTOR_GEOMETRY },
      { createId },
    );
    const useCase = createUseCase(
      { name: "Login", geometry: USE_CASE_GEOMETRY },
      { createId },
    );
    const seeded: DiagramDocument = {
      ...document,
      elements: [...document.elements, actor, useCase],
      relationships: [
        buildRelationship(
          {
            kind: "association",
            sourceId: actor.id,
            targetId: useCase.id,
            sourceAnchor: "right",
            targetAnchor: "left",
          },
          { createId },
        ),
      ],
    };
    expectCode(
      createRelationship(seeded, {
        kind: "association",
        sourceId: actor.id,
        targetId: useCase.id,
        sourceAnchor: "top",
        targetAnchor: "bottom",
      }),
      "DUPLICATE_RELATIONSHIP",
    );
  });
});
