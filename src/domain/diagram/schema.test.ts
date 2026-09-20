import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "./defaults.ts";
import {
  createActor,
  createEmptyClassDocument,
  createEmptyComponentDocument,
  createEmptyDeploymentDocument,
  createEmptySequenceDocument,
  createLifeline,
  createRelationship,
  createSequenceMessage,
  createUseCase,
  createWorkspaceSnapshot,
  type IdFactory,
} from "./factories.ts";
import {
  activeWorkspaceEntry,
  type DiagramDocument,
  type WorkspaceSnapshot,
} from "./model.ts";
import { parseDiagramDocument, parseWorkspaceSnapshot } from "./schema.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");

function activeDocument(snapshot: WorkspaceSnapshot): DiagramDocument {
  const entry = activeWorkspaceEntry(snapshot);
  if (entry === undefined) {
    throw new Error("Falta el documento activo");
  }
  return entry.document;
}

function withActiveDocument(
  snapshot: WorkspaceSnapshot,
  document: unknown,
): unknown {
  return {
    ...snapshot,
    documents: snapshot.documents.map((entry) =>
      entry.document.id === snapshot.activeDocumentId
        ? { document, view: entry.view }
        : entry,
    ),
  };
}

function sampleSnapshot(): WorkspaceSnapshot {
  const createId = sequentialIds();
  const snapshot = createWorkspaceSnapshot({
    createId,
    now: () => FIXED_NOW,
  });
  const document = activeDocument(snapshot);
  const boundary = document.elements[0];
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

  return withActiveDocument(snapshot, {
    ...document,
    elements: [...document.elements, actor, useCase],
    relationships: [relationship],
  }) as WorkspaceSnapshot;
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
      withActiveDocument(snapshot, {
        ...activeDocument(snapshot),
        kind: "entity-relationship",
      }),
      "UNKNOWN_KIND",
      /kind|no soportado/i,
    );
  });

  it("rechaza un kind de elemento desconocido", () => {
    const snapshot = sampleSnapshot();
    const document = activeDocument(snapshot);
    const [boundary, ...rest] = document.elements;
    expectRejected(
      withActiveDocument(snapshot, {
        ...document,
        elements: [boundary, { ...rest[0], kind: "note" }, ...rest.slice(1)],
      }),
      "UNKNOWN_KIND",
      /kind|no soportado|Valor no soportado/i,
    );
  });

  it("rechaza un UUID inválido", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      withActiveDocument(snapshot, {
        ...activeDocument(snapshot),
        id: "not-a-uuid",
      }),
      "UNKNOWN_ELEMENT",
      /UUID/,
    );
  });

  it("rechaza geometría no finita", () => {
    const snapshot = structuredClone(sampleSnapshot());
    const boundary = activeDocument(snapshot).elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    boundary.geometry.x = Number.POSITIVE_INFINITY;
    expectRejected(snapshot, "INVALID_GEOMETRY", /finito|geometry/i);
  });

  it("rechaza geometría NaN", () => {
    const snapshot = structuredClone(sampleSnapshot());
    const boundary = activeDocument(snapshot).elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    boundary.geometry.height = Number.NaN;
    expectRejected(snapshot, "INVALID_GEOMETRY", /finito|geometry|Número/i);
  });

  it("rechaza parentId que no es un boundary del documento", () => {
    const snapshot = sampleSnapshot();
    const document = activeDocument(snapshot);
    const actor = document.elements.find((element) => element.kind === "actor");
    const useCase = document.elements.find(
      (element) => element.kind === "use-case",
    );
    if (actor === undefined || useCase === undefined) {
      throw new Error("El snapshot de prueba debe incluir actor y caso");
    }

    expectRejected(
      withActiveDocument(snapshot, {
        ...document,
        elements: document.elements.map((element) =>
          element.kind === "use-case"
            ? { ...element, parentId: actor.id }
            : element,
        ),
      }),
      "INVALID_PARENT",
      /parentId|SystemBoundary/,
    );
  });

  it("rechaza parentId ausente en el documento", () => {
    const snapshot = sampleSnapshot();
    const document = activeDocument(snapshot);
    expectRejected(
      withActiveDocument(snapshot, {
        ...document,
        elements: document.elements.map((element) =>
          element.kind === "use-case"
            ? {
                ...element,
                parentId: "00000000-0000-4000-8000-ffffffffffff",
              }
            : element,
        ),
      }),
      "INVALID_PARENT",
      /parentId/,
    );
  });

  it("rechaza parentId en un actor", () => {
    const snapshot = sampleSnapshot();
    const document = activeDocument(snapshot);
    const boundary = document.elements[0];
    expectRejected(
      withActiveDocument(snapshot, {
        ...document,
        elements: document.elements.map((element) =>
          element.kind === "actor"
            ? { ...element, parentId: boundary?.id }
            : element,
        ),
      }),
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
      withActiveDocument(snapshot, {
        ...activeDocument(snapshot),
        selected: true,
      }),
      "UNKNOWN_KIND",
      /Claves no permitidas/,
    );
  });

  it("no persiste geometría de React Flow ni campos medidos", () => {
    const snapshot = sampleSnapshot();
    const document = activeDocument(snapshot);
    expectRejected(
      withActiveDocument(snapshot, {
        ...document,
        elements: document.elements.map((element) =>
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
      }),
      "UNKNOWN_KIND",
      /Claves no permitidas.*measured/,
    );
  });

  it("rechaza una biblioteca vacía", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      { ...snapshot, documents: [] },
      "UNKNOWN_KIND",
      /biblioteca no puede estar vacía/i,
    );
  });

  it("rechaza un activeDocumentId huérfano", () => {
    const snapshot = sampleSnapshot();
    expectRejected(
      {
        ...snapshot,
        activeDocumentId: "00000000-0000-4000-8000-ffffffffffff",
      },
      "UNKNOWN_KIND",
      /activeDocumentId/,
    );
  });
});

describe("parser schema 2 — secuencia y mezclas", () => {
  it("acepta un documento secuencia con lifeline y mensajes", () => {
    const createId = sequentialIds();
    const document = createEmptySequenceDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const a = createLifeline({ name: "A" }, { createId });
    const b = createLifeline(
      { name: "B", geometry: { x: 200, y: 0, width: 120, height: 40 } },
      { createId },
    );
    const message = createSequenceMessage(
      {
        kind: "sync-message",
        sourceId: a.id,
        targetId: b.id,
        name: "ping",
        y: 80,
      },
      { createId },
    );
    const parsed = parseDiagramDocument({
      ...document,
      elements: [a, b],
      relationships: [message],
    });
    expect(parsed.ok).toBe(true);
  });

  it("rechaza un actor en un documento secuencia", () => {
    const createId = sequentialIds();
    const document = createEmptySequenceDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const actor = createActor(
      { name: "Usuario", geometry: { x: 0, y: 0, width: 48, height: 96 } },
      { createId },
    );
    const parsed = parseDiagramDocument({
      ...document,
      elements: [actor],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("UNKNOWN_KIND");
  });

  it("rechaza un lifeline en un documento de casos de uso", () => {
    const snapshot = sampleSnapshot();
    const lifeline = createLifeline(
      { name: "L" },
      { createId: sequentialIds(80) },
    );
    const document = activeDocument(snapshot);
    const parsed = parseDiagramDocument({
      ...document,
      elements: [...document.elements, lifeline],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("UNKNOWN_KIND");
  });

  it("rechaza un kind de mensaje desconocido", () => {
    const createId = sequentialIds();
    const document = createEmptySequenceDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const a = createLifeline({ name: "A" }, { createId });
    const parsed = parseDiagramDocument({
      ...document,
      elements: [a],
      relationships: [
        {
          id: createId(),
          kind: "async-message",
          sourceId: a.id,
          targetId: a.id,
          name: "",
          y: 80,
        },
      ],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("UNKNOWN_KIND");
  });
});

describe("parser schema 3 — clases, componentes, despliegue y kinds futuros", () => {
  it("acepta un documento class vacío", () => {
    const document = createEmptyClassDocument({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });

  it("acepta un documento component vacío", () => {
    const document = createEmptyComponentDocument({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });

  it("acepta un documento deployment vacío", () => {
    const document = createEmptyDeploymentDocument({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });

  it("rechaza un actor en un documento class", () => {
    const createId = sequentialIds();
    const document = createEmptyClassDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const actor = createActor(
      { name: "Usuario", geometry: { x: 0, y: 0, width: 48, height: 96 } },
      { createId },
    );
    const parsed = parseDiagramDocument({
      ...document,
      elements: [actor],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("UNKNOWN_KIND");
  });

  it("rechaza kind class en un documento de casos de uso", () => {
    const snapshot = sampleSnapshot();
    const document = activeDocument(snapshot);
    const parsed = parseDiagramDocument({
      ...document,
      elements: [
        ...document.elements,
        {
          id: "00000000-0000-4000-8000-0000000000c1",
          kind: "class",
          name: "Pedido",
          geometry: { x: 0, y: 0, width: 180, height: 96 },
          attributes: [],
          operations: [],
        },
      ],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("UNKNOWN_KIND");
  });

  it("rechaza un kind de documento aún no en la unión", () => {
    const document = createEmptyClassDocument({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const parsed = parseDiagramDocument({
      ...document,
      kind: "entity-relationship",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("UNKNOWN_KIND");
  });
});
