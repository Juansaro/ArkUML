import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "./defaults.ts";
import {
  createActor,
  createRelationship,
  createUseCase,
  createWorkspaceSnapshot,
  type IdFactory,
} from "./factories.ts";
import type { WorkspaceSnapshot } from "./model.ts";
import { parseWorkspaceSnapshot } from "./schema.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");

function sampleSnapshot(): WorkspaceSnapshot {
  const createId = sequentialIds();
  const snapshot = createWorkspaceSnapshot({
    createId,
    now: () => FIXED_NOW,
  });
  const boundary = snapshot.document.elements[0];
  if (boundary === undefined) {
    throw new Error("El documento por defecto debe incluir un boundary");
  }

  const actor = createActor(
    { name: "Usuario", geometry: { x: 8, y: 40, width: 48, height: 96 } },
    { createId },
  );
  const useCase = createUseCase(
    {
      name: "Iniciar sesión",
      geometry: { x: 80, y: 80, width: 160, height: 80 },
      parentId: boundary.id,
    },
    { createId },
  );
  const relationship = createRelationship(
    {
      kind: "association",
      sourceId: actor.id,
      targetId: useCase.id,
      sourceAnchor: "right",
      targetAnchor: "left",
    },
    { createId },
  );

  return {
    ...snapshot,
    document: {
      ...snapshot.document,
      elements: [...snapshot.document.elements, actor, useCase],
      relationships: [relationship],
    },
  };
}

function expectRejected(
  input: unknown,
  code: string,
  messagePattern: RegExp,
): void {
  const result = parseWorkspaceSnapshot(input);
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.error.code).toBe(code);
  expect(result.error.message).toMatch(messagePattern);
}

describe("parseWorkspaceSnapshot", () => {
  it("hace round-trip JSON de un snapshot válido", () => {
    const snapshot = sampleSnapshot();
    const parsed = parseWorkspaceSnapshot(JSON.parse(JSON.stringify(snapshot)));

    expect(parsed).toEqual({ ok: true, value: snapshot });
  });

  it("acepta el documento vacío generado por la factory", () => {
    const snapshot = createWorkspaceSnapshot({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });

    expect(parseWorkspaceSnapshot(snapshot)).toEqual({
      ok: true,
      value: snapshot,
    });
  });

  it("devuelve un error de dominio legible sin lanzar", () => {
    const inputs = [null, undefined, 42, "", [], { storageVersion: 2 }];

    for (const input of inputs) {
      expect(() => parseWorkspaceSnapshot(input)).not.toThrow();
      const result = parseWorkspaceSnapshot(input);
      expect(result.ok).toBe(false);
      if (result.ok) {
        continue;
      }
      expect(result.error.message.length).toBeGreaterThan(0);
      expect(result.error.code).toBeTruthy();
    }
  });

  it("rechaza un kind de documento desconocido", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      {
        ...snapshot,
        document: { ...snapshot.document, kind: "class" },
      },
      "UNKNOWN_KIND",
      /kind|no soportado/i,
    );
  });

  it("rechaza un kind de elemento desconocido", () => {
    const snapshot = sampleSnapshot();
    const [boundary, ...rest] = snapshot.document.elements;
    expectRejected(
      {
        ...snapshot,
        document: {
          ...snapshot.document,
          elements: [boundary, { ...rest[0], kind: "note" }, ...rest.slice(1)],
        },
      },
      "UNKNOWN_KIND",
      /kind|no soportado|Valor no soportado/i,
    );
  });

  it("rechaza un UUID inválido", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      {
        ...snapshot,
        document: { ...snapshot.document, id: "not-a-uuid" },
      },
      "UNKNOWN_ELEMENT",
      /UUID/,
    );
  });

  it("rechaza geometría no finita", () => {
    const snapshot = structuredClone(sampleSnapshot());
    const boundary = snapshot.document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    boundary.geometry.x = Number.POSITIVE_INFINITY;
    expectRejected(snapshot, "INVALID_GEOMETRY", /finito|geometry/i);
  });

  it("rechaza geometría NaN", () => {
    const snapshot = structuredClone(sampleSnapshot());
    const boundary = snapshot.document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    boundary.geometry.height = Number.NaN;
    expectRejected(snapshot, "INVALID_GEOMETRY", /finito|geometry|Número/i);
  });

  it("rechaza parentId que no es un boundary del documento", () => {
    const snapshot = sampleSnapshot();
    const actor = snapshot.document.elements.find(
      (element) => element.kind === "actor",
    );
    const useCase = snapshot.document.elements.find(
      (element) => element.kind === "use-case",
    );
    if (actor === undefined || useCase === undefined) {
      throw new Error("El snapshot de prueba debe incluir actor y caso");
    }

    expectRejected(
      {
        ...snapshot,
        document: {
          ...snapshot.document,
          elements: snapshot.document.elements.map((element) =>
            element.kind === "use-case"
              ? { ...element, parentId: actor.id }
              : element,
          ),
        },
      },
      "INVALID_PARENT",
      /parentId|SystemBoundary/,
    );
  });

  it("rechaza parentId ausente en el documento", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      {
        ...snapshot,
        document: {
          ...snapshot.document,
          elements: snapshot.document.elements.map((element) =>
            element.kind === "use-case"
              ? {
                  ...element,
                  parentId: "00000000-0000-4000-8000-ffffffffffff",
                }
              : element,
          ),
        },
      },
      "INVALID_PARENT",
      /parentId/,
    );
  });

  it("rechaza parentId en un actor", () => {
    const snapshot = sampleSnapshot();
    const boundary = snapshot.document.elements[0];
    expectRejected(
      {
        ...snapshot,
        document: {
          ...snapshot.document,
          elements: snapshot.document.elements.map((element) =>
            element.kind === "actor"
              ? { ...element, parentId: boundary?.id }
              : element,
          ),
        },
      },
      "UNKNOWN_KIND",
      /Claves no permitidas|parentId/,
    );
  });

  it("rechaza claves extra en el snapshot, incluido estado efímero", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      {
        ...snapshot,
        selection: ["abc"],
        history: [],
        tool: "select",
      },
      "UNKNOWN_KIND",
      /Claves no permitidas.*(selection|history|tool)/,
    );
  });

  it("rechaza claves extra en el documento", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      {
        ...snapshot,
        document: { ...snapshot.document, selected: true },
      },
      "UNKNOWN_KIND",
      /Claves no permitidas/,
    );
  });

  it("no persiste geometría de React Flow ni campos medidos", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      {
        ...snapshot,
        document: {
          ...snapshot.document,
          elements: snapshot.document.elements.map((element) =>
            element.kind === "system-boundary"
              ? {
                  ...element,
                  geometry: {
                    ...DEFAULT_BOUNDARY_GEOMETRY,
                    measured: { width: 1, height: 1 },
                  },
                }
              : element,
          ),
        },
      },
      "UNKNOWN_KIND",
      /Claves no permitidas.*measured/,
    );
  });
});
