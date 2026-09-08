import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "./defaults.ts";
import {
  createActor,
  createDiagramDocument,
  createRelationship,
  createUseCase,
  type IdFactory,
} from "./factories.ts";
import type {
  DiagramDocument,
  DomainErrorCode,
  RelationshipKind,
  Result,
} from "./model.ts";
import {
  canConnect,
  EXTEND_STEREOTYPE,
  INCLUDE_STEREOTYPE,
  relationshipLabel,
} from "./rules.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");
const MISSING_ID = "00000000-0000-4000-8000-ffffffffffff";

type Endpoint = "actor" | "use-case" | "boundary";

type Fixture = {
  document: DiagramDocument;
  actorA: string;
  actorB: string;
  useCaseA: string;
  useCaseB: string;
  boundary: string;
};

function fixture(): Fixture {
  const createId = sequentialIds();
  const document = createDiagramDocument({
    createId,
    now: () => FIXED_NOW,
  });
  const boundary = document.elements[0];
  if (boundary === undefined || boundary.kind !== "system-boundary") {
    throw new Error("El documento por defecto debe incluir un boundary");
  }

  const actorA = createActor(
    { name: "Actor A", geometry: { x: -80, y: 40, width: 48, height: 96 } },
    { createId },
  );
  const actorB = createActor(
    { name: "Actor B", geometry: { x: -80, y: 200, width: 48, height: 96 } },
    { createId },
  );
  const useCaseA = createUseCase(
    {
      name: "Caso A",
      geometry: { x: 40, y: 40, width: 160, height: 80 },
      parentId: boundary.id,
    },
    { createId },
  );
  const useCaseB = createUseCase(
    {
      name: "Caso B",
      geometry: { x: 200, y: 200, width: 160, height: 80 },
    },
    { createId },
  );

  return {
    document: {
      ...document,
      elements: [...document.elements, actorA, actorB, useCaseA, useCaseB],
    },
    actorA: actorA.id,
    actorB: actorB.id,
    useCaseA: useCaseA.id,
    useCaseB: useCaseB.id,
    boundary: boundary.id,
  };
}

function idOf(setup: Fixture, endpoint: Endpoint, slot: "a" | "b"): string {
  if (endpoint === "boundary") {
    return setup.boundary;
  }
  if (endpoint === "actor") {
    return slot === "a" ? setup.actorA : setup.actorB;
  }
  return slot === "a" ? setup.useCaseA : setup.useCaseB;
}

function expectCode(result: Result<unknown>, code: DomainErrorCode): void {
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.error.code).toBe(code);
}

const MATRIX: Array<{
  kind: RelationshipKind;
  from: Endpoint;
  to: Endpoint;
  result: "ok" | DomainErrorCode;
}> = [
  { kind: "association", from: "actor", to: "use-case", result: "ok" },
  { kind: "association", from: "use-case", to: "actor", result: "ok" },
  {
    kind: "association",
    from: "actor",
    to: "actor",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "association",
    from: "use-case",
    to: "use-case",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "association",
    from: "actor",
    to: "boundary",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "association",
    from: "use-case",
    to: "boundary",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "association",
    from: "boundary",
    to: "actor",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "association",
    from: "boundary",
    to: "use-case",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "association",
    from: "boundary",
    to: "boundary",
    result: "SELF_RELATIONSHIP",
  },
  { kind: "include", from: "use-case", to: "use-case", result: "ok" },
  {
    kind: "include",
    from: "use-case",
    to: "actor",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "include",
    from: "actor",
    to: "use-case",
    result: "INVALID_CONNECTION",
  },
  { kind: "include", from: "actor", to: "actor", result: "INVALID_CONNECTION" },
  {
    kind: "include",
    from: "actor",
    to: "boundary",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "include",
    from: "use-case",
    to: "boundary",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "include",
    from: "boundary",
    to: "actor",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "include",
    from: "boundary",
    to: "use-case",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "include",
    from: "boundary",
    to: "boundary",
    result: "SELF_RELATIONSHIP",
  },
  { kind: "extend", from: "use-case", to: "use-case", result: "ok" },
  {
    kind: "extend",
    from: "use-case",
    to: "actor",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "extend",
    from: "actor",
    to: "use-case",
    result: "INVALID_CONNECTION",
  },
  { kind: "extend", from: "actor", to: "actor", result: "INVALID_CONNECTION" },
  {
    kind: "extend",
    from: "actor",
    to: "boundary",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "extend",
    from: "use-case",
    to: "boundary",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "extend",
    from: "boundary",
    to: "actor",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "extend",
    from: "boundary",
    to: "use-case",
    result: "INVALID_CONNECTION",
  },
  {
    kind: "extend",
    from: "boundary",
    to: "boundary",
    result: "SELF_RELATIONSHIP",
  },
];

const SELF_LOOPS: Array<{ kind: RelationshipKind; endpoint: Endpoint }> = [
  { kind: "association", endpoint: "actor" },
  { kind: "association", endpoint: "use-case" },
  { kind: "include", endpoint: "actor" },
  { kind: "include", endpoint: "use-case" },
  { kind: "extend", endpoint: "actor" },
  { kind: "extend", endpoint: "use-case" },
];

describe("relationshipLabel", () => {
  it("deriva estereotipos UML y no etiqueta asociaciones", () => {
    expect(relationshipLabel("include")).toBe(INCLUDE_STEREOTYPE);
    expect(relationshipLabel("extend")).toBe(EXTEND_STEREOTYPE);
    expect(relationshipLabel("association")).toBeUndefined();
    expect(INCLUDE_STEREOTYPE).toBe("«include»");
    expect(EXTEND_STEREOTYPE).toBe("«extend»");
  });
});

describe("canConnect matrix", () => {
  it.each(MATRIX)(
    "$kind $from → $to => $result",
    ({ kind, from, to, result }) => {
      const setup = fixture();
      const sourceId = idOf(setup, from, "a");
      const targetId = idOf(setup, to, from === to ? "b" : "a");
      const allowed = canConnect(setup.document, { kind, sourceId, targetId });

      if (result === "ok") {
        expect(allowed.ok).toBe(true);
        if (!allowed.ok) {
          return;
        }
        if (kind === "association") {
          expect(allowed.value.sourceId).toBe(
            from === "actor" || to === "actor"
              ? from === "actor"
                ? sourceId
                : targetId
              : allowed.value.sourceId,
          );
          const source = setup.document.elements.find(
            (element) => element.id === allowed.value.sourceId,
          );
          const target = setup.document.elements.find(
            (element) => element.id === allowed.value.targetId,
          );
          expect(source?.kind).toBe("actor");
          expect(target?.kind).toBe("use-case");
        } else {
          expect(allowed.value).toEqual({ kind, sourceId, targetId });
        }
        return;
      }

      expectCode(allowed, result);
    },
  );

  it.each(SELF_LOOPS)(
    "rechaza $kind reflexivo sobre $endpoint",
    ({ kind, endpoint }) => {
      const setup = fixture();
      const id = idOf(setup, endpoint, "a");
      expectCode(
        canConnect(setup.document, { kind, sourceId: id, targetId: id }),
        "SELF_RELATIONSHIP",
      );
    },
  );

  it("rechaza un extremo desconocido", () => {
    const setup = fixture();
    expectCode(
      canConnect(setup.document, {
        kind: "association",
        sourceId: MISSING_ID,
        targetId: setup.useCaseA,
      }),
      "UNKNOWN_ELEMENT",
    );
    expectCode(
      canConnect(setup.document, {
        kind: "include",
        sourceId: setup.useCaseA,
        targetId: MISSING_ID,
      }),
      "UNKNOWN_ELEMENT",
    );
  });

  it("detecta duplicados tras normalizar Association", () => {
    const setup = fixture();
    const existing = createRelationship(
      {
        kind: "association",
        sourceId: setup.actorA,
        targetId: setup.useCaseA,
        sourceAnchor: "right",
        targetAnchor: "left",
      },
      { createId: sequentialIds(20) },
    );
    const document: DiagramDocument = {
      ...setup.document,
      relationships: [existing],
    };

    expectCode(
      canConnect(document, {
        kind: "association",
        sourceId: setup.useCaseA,
        targetId: setup.actorA,
      }),
      "DUPLICATE_RELATIONSHIP",
    );
  });

  it("permite include y extend sobre el mismo par y el sentido inverso", () => {
    const setup = fixture();
    const include = createRelationship(
      {
        kind: "include",
        sourceId: setup.useCaseA,
        targetId: setup.useCaseB,
        sourceAnchor: "bottom",
        targetAnchor: "top",
      },
      { createId: sequentialIds(30) },
    );
    const document: DiagramDocument = {
      ...setup.document,
      relationships: [include],
    };

    expect(
      canConnect(document, {
        kind: "include",
        sourceId: setup.useCaseB,
        targetId: setup.useCaseA,
      }).ok,
    ).toBe(true);
    expect(
      canConnect(document, {
        kind: "extend",
        sourceId: setup.useCaseA,
        targetId: setup.useCaseB,
      }).ok,
    ).toBe(true);
    expectCode(
      canConnect(document, {
        kind: "include",
        sourceId: setup.useCaseA,
        targetId: setup.useCaseB,
      }),
      "DUPLICATE_RELATIONSHIP",
    );
  });

  it("no usa el tamaño del boundary para decidir una conexión", () => {
    expect(DEFAULT_BOUNDARY_GEOMETRY.width).toBeGreaterThan(0);
    const setup = fixture();
    expect(
      canConnect(setup.document, {
        kind: "association",
        sourceId: setup.boundary,
        targetId: setup.actorA,
      }).ok,
    ).toBe(false);
  });
});
