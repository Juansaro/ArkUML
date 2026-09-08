import { describe, expect, it } from "vitest";
import {
  createActor,
  createDiagramDocument,
  createUseCase,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument } from "./model.ts";
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
});
