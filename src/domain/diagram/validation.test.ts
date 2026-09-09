import { describe, expect, it } from "vitest";
import {
  createActor,
  createDiagramDocument,
  createRelationship,
  createUseCase,
  createWorkspaceSnapshot,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, RelationshipKind, Result } from "./model.ts";
import { createRelationship as connect } from "./operations.ts";
import { parseWorkspaceSnapshot } from "./schema.ts";
import { collectWarnings } from "./validation.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");
const USE_CASE_GEOMETRY = { x: 40, y: 40, width: 160, height: 80 } as const;

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function documentWith(
  createId: IdFactory,
  extra: DiagramDocument["elements"],
): DiagramDocument {
  const document = createDiagramDocument({
    createId,
    now: () => FIXED_NOW,
  });
  return {
    ...document,
    elements: [...document.elements, ...extra],
  };
}

describe("collectWarnings", () => {
  it("avisa actor cuyo centro cae dentro del boundary", () => {
    const createId = sequentialIds();
    const document = createDiagramDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const boundary = document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    const inside = createActor(
      { name: "Dentro", geometry: { x: 0, y: 0, width: 48, height: 96 } },
      { createId },
    );
    const outside = createActor(
      { name: "Fuera", geometry: { x: -200, y: 0, width: 48, height: 96 } },
      { createId },
    );
    const warnings = collectWarnings({
      ...document,
      elements: [...document.elements, inside, outside],
    });

    expect(warnings).toEqual([
      {
        code: "ACTOR_INSIDE_BOUNDARY",
        elementId: inside.id,
        message: expect.stringMatching(/actor|SystemBoundary/i) as string,
      },
    ]);
  });

  it("avisa caso sin padre fuera del boundary y caso con padre fuera del padre", () => {
    const createId = sequentialIds();
    const document = createDiagramDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const boundary = document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }

    const unparentedInside = createUseCase(
      { name: "Dentro", geometry: { x: 80, y: 80, width: 160, height: 80 } },
      { createId },
    );
    const unparentedOutside = createUseCase(
      { name: "Fuera", geometry: { x: 900, y: 80, width: 160, height: 80 } },
      { createId },
    );
    const parentedInside = createUseCase(
      {
        name: "Hijo dentro",
        geometry: { x: 40, y: 40, width: 160, height: 80 },
        parentId: boundary.id,
      },
      { createId },
    );
    const parentedOutside = createUseCase(
      {
        name: "Hijo fuera",
        geometry: { x: 800, y: 40, width: 160, height: 80 },
        parentId: boundary.id,
      },
      { createId },
    );

    const warnings = collectWarnings({
      ...document,
      elements: [
        ...document.elements,
        unparentedInside,
        unparentedOutside,
        parentedInside,
        parentedOutside,
      ],
    });

    expect(warnings.map((warning) => warning.elementId).sort()).toEqual(
      [unparentedOutside.id, parentedOutside.id].sort(),
    );
    expect(
      warnings.every((warning) => warning.code === "USE_CASE_OUTSIDE_BOUNDARY"),
    ).toBe(true);
  });

  it("no avisa si no hay boundary y trata un parentId inválido como no fuera", () => {
    const createId = sequentialIds();
    const empty: DiagramDocument = {
      ...createDiagramDocument({ createId, now: () => FIXED_NOW }),
      elements: [],
    };
    const actor = createActor(
      { name: "Usuario", geometry: { x: 0, y: 0, width: 48, height: 96 } },
      { createId },
    );
    const useCase = createUseCase(
      { name: "Login", geometry: { x: 80, y: 80, width: 160, height: 80 } },
      { createId },
    );
    expect(collectWarnings({ ...empty, elements: [actor, useCase] })).toEqual(
      [],
    );

    const orphan = createUseCase(
      {
        name: "Huérfano",
        geometry: { x: 800, y: 0, width: 10, height: 10 },
        parentId: actor.id,
      },
      { createId },
    );
    const withInvalidParent = documentWith(sequentialIds(40), [actor, orphan]);
    expect(
      collectWarnings(withInvalidParent).filter(
        (warning) => warning.elementId === orphan.id,
      ),
    ).toEqual([]);
  });

  it("considera el borde del rectángulo como interior", () => {
    const createId = sequentialIds();
    const document = createDiagramDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const boundary = document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    const onEdge = createActor(
      {
        name: "Borde",
        geometry: {
          x: boundary.geometry.x + boundary.geometry.width - 24,
          y: boundary.geometry.y + boundary.geometry.height - 48,
          width: 48,
          height: 96,
        },
      },
      { createId },
    );
    expect(
      collectWarnings({
        ...document,
        elements: [...document.elements, onEdge],
      }),
    ).toEqual([
      expect.objectContaining({
        code: "ACTOR_INSIDE_BOUNDARY",
        elementId: onEdge.id,
      }),
    ]);
  });

  it("avisa INCLUDE_CYCLE en un 2-ciclo y no rechaza la segunda relación", () => {
    const createId = sequentialIds();
    const seeded = twoUseCases(createId);
    const first = expectOk(
      connect(seeded.document, edge("include", seeded.ids.A, seeded.ids.B), {
        createId,
        now: () => FIXED_NOW,
      }),
    );
    expect(
      collectWarnings(first).filter(
        (warning) => warning.code === "INCLUDE_CYCLE",
      ),
    ).toEqual([]);

    const cyclic = expectOk(
      connect(first, edge("include", seeded.ids.B, seeded.ids.A), {
        createId,
        now: () => FIXED_NOW,
      }),
    );

    expect(cyclic.relationships).toHaveLength(2);
    expect(cycleWarnings(cyclic, "INCLUDE_CYCLE")).toEqual([
      includeCycle(seeded.ids.A),
      includeCycle(seeded.ids.B),
    ]);
    expect(cycleWarnings(cyclic, "EXTEND_CYCLE")).toEqual([]);
  });

  it("avisa a todos los casos de un ciclo Include largo y no avisa una cadena acíclica", () => {
    const createId = sequentialIds();
    const seeded = namedUseCases(createId, ["A", "B", "C"]);
    const chain = withEdges(seeded.document, createId, [
      ["include", "A", "B"],
      ["include", "B", "C"],
    ]);
    expect(cycleWarnings(chain, "INCLUDE_CYCLE")).toEqual([]);

    const cyclic = withEdges(seeded.document, createId, [
      ["include", "A", "B"],
      ["include", "B", "C"],
      ["include", "C", "A"],
    ]);
    expect(cycleWarnings(cyclic, "INCLUDE_CYCLE")).toEqual([
      includeCycle(idOf(seeded.document, "A")),
      includeCycle(idOf(seeded.document, "B")),
      includeCycle(idOf(seeded.document, "C")),
    ]);
  });

  it("avisa EXTEND_CYCLE por separado y no lo confunde con Include", () => {
    const createId = sequentialIds();
    const seeded = twoUseCases(createId);
    const cyclic = withEdges(seeded.document, createId, [
      ["extend", "A", "B"],
      ["extend", "B", "A"],
    ]);

    expect(cycleWarnings(cyclic, "EXTEND_CYCLE")).toEqual([
      extendCycle(seeded.ids.A),
      extendCycle(seeded.ids.B),
    ]);
    expect(cycleWarnings(cyclic, "INCLUDE_CYCLE")).toEqual([]);
  });

  it("ignora Association y no avisa un grafo mixto Include+Extend", () => {
    const createId = sequentialIds();
    const actor = createActor(
      { name: "Usuario", geometry: { x: -80, y: 40, width: 48, height: 96 } },
      { createId },
    );
    const seeded = twoUseCases(createId);
    const mixed: DiagramDocument = {
      ...seeded.document,
      elements: [...seeded.document.elements, actor],
      relationships: [
        createRelationship(
          {
            kind: "association",
            sourceId: actor.id,
            targetId: seeded.ids.A,
            sourceAnchor: "right",
            targetAnchor: "left",
          },
          { createId },
        ),
        createRelationship(
          {
            kind: "association",
            sourceId: actor.id,
            targetId: seeded.ids.B,
            sourceAnchor: "right",
            targetAnchor: "left",
          },
          { createId },
        ),
        createRelationship(edge("include", seeded.ids.A, seeded.ids.B), {
          createId,
        }),
        createRelationship(edge("extend", seeded.ids.B, seeded.ids.A), {
          createId,
        }),
      ],
    };

    expect(cycleWarnings(mixed, "INCLUDE_CYCLE")).toEqual([]);
    expect(cycleWarnings(mixed, "EXTEND_CYCLE")).toEqual([]);
  });

  it("no muta el documento ni persiste el aviso; round-trip schema 1", () => {
    const createId = sequentialIds();
    const seeded = twoUseCases(createId);
    const cyclic = withEdges(seeded.document, createId, [
      ["include", "A", "B"],
      ["include", "B", "A"],
    ]);
    const before = structuredClone(cyclic);

    const warnings = collectWarnings(cyclic);
    expect(warnings).toEqual([
      includeCycle(seeded.ids.A),
      includeCycle(seeded.ids.B),
    ]);
    expect(cyclic).toEqual(before);
    expect(JSON.stringify(cyclic)).not.toMatch(
      /INCLUDE_CYCLE|EXTEND_CYCLE|ciclo de Include|ciclo de Extend/,
    );

    const snapshot = {
      ...createWorkspaceSnapshot({
        createId: sequentialIds(90),
        now: () => FIXED_NOW,
      }),
      document: cyclic,
    };
    const parsed = parseWorkspaceSnapshot(
      JSON.parse(JSON.stringify(snapshot)) as unknown,
    );
    expect(parsed).toEqual({ ok: true, value: snapshot });
    if (!parsed.ok) {
      throw new Error("Expected ok parse");
    }
    expect(parsed.value.document.schemaVersion).toBe(1);
    expect(parsed.value.storageVersion).toBe(1);
    expect(parsed.value.document).not.toHaveProperty("warnings");
    expect(JSON.stringify(parsed.value)).not.toMatch(/INCLUDE_CYCLE/);
  });
});

function includeCycle(elementId: string) {
  return {
    code: "INCLUDE_CYCLE" as const,
    elementId,
    message: "Participa en un ciclo de Include.",
  };
}

function extendCycle(elementId: string) {
  return {
    code: "EXTEND_CYCLE" as const,
    elementId,
    message: "Participa en un ciclo de Extend.",
  };
}

function cycleWarnings(
  document: DiagramDocument,
  code: "INCLUDE_CYCLE" | "EXTEND_CYCLE",
) {
  return collectWarnings(document).filter((warning) => warning.code === code);
}

function twoUseCases(createId: IdFactory) {
  const seeded = namedUseCases(createId, ["A", "B"]);
  return {
    document: seeded.document,
    ids: {
      A: idOf(seeded.document, "A"),
      B: idOf(seeded.document, "B"),
    },
  };
}

function namedUseCases(createId: IdFactory, names: readonly string[]) {
  const document = createDiagramDocument({
    createId,
    now: () => FIXED_NOW,
  });
  const extra = names.map((name, index) =>
    createUseCase(
      {
        name,
        geometry: { ...USE_CASE_GEOMETRY, x: 40 + index * 180 },
      },
      { createId },
    ),
  );
  return {
    document: {
      ...document,
      elements: [...document.elements, ...extra],
    },
  };
}

function withEdges(
  document: DiagramDocument,
  createId: IdFactory,
  edges: readonly [RelationshipKind, string, string][],
): DiagramDocument {
  return {
    ...document,
    relationships: edges.map(([kind, from, to]) =>
      createRelationship(edge(kind, idOf(document, from), idOf(document, to)), {
        createId,
      }),
    ),
  };
}

function edge(kind: RelationshipKind, sourceId: string, targetId: string) {
  return {
    kind,
    sourceId,
    targetId,
    sourceAnchor: "right" as const,
    targetAnchor: "left" as const,
  };
}

function idOf(document: DiagramDocument, name: string): string {
  const element = document.elements.find(
    (candidate) => candidate.name === name,
  );
  if (element === undefined) {
    throw new Error(`Falta el elemento ${name}`);
  }
  return element.id;
}
