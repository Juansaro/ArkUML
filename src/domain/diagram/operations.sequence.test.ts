import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIFELINE_GEOMETRY,
  DEFAULT_LIFELINE_STEM_LENGTH,
  DEFAULT_SEQUENCE_DOCUMENT_TITLE,
  DUPLICATE_OFFSET,
  MIN_LIFELINE_STEM_LENGTH,
} from "./defaults.ts";
import { createEmptySequenceDocument, type IdFactory } from "./factories.ts";
import type { DiagramDocument, Geometry, Result } from "./model.ts";
import {
  createElement,
  createLifeline,
  createRelationship,
  deleteElements,
  duplicateElements,
  moveElements,
  moveMessage,
  renameElement,
  renameRelationship,
  resizeLifelineStem,
} from "./operations.ts";
import { canConnect } from "./rules.ts";
import { parseDiagramDocument } from "./schema.ts";

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
const HEAD: Geometry = { x: 0, y: 0, width: 120, height: 40 };
const HEAD_B: Geometry = { x: 240, y: 0, width: 120, height: 40 };
const VALID_Y = 40;
const INSIDE_HEAD_Y = 20;

function emptySequence(createId: IdFactory = sequentialIds()): DiagramDocument {
  return createEmptySequenceDocument({
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

function twoLifelines(createId: IdFactory = sequentialIds()): {
  document: DiagramDocument;
  sourceId: string;
  targetId: string;
} {
  const empty = emptySequence(createId);
  const withA = expectOk(
    createLifeline(
      empty,
      { name: "A", geometry: HEAD },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withB = expectOk(
    createLifeline(
      withA,
      { name: "B", geometry: HEAD_B },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const source = withB.elements.find((element) => element.name === "A");
  const target = withB.elements.find((element) => element.name === "B");
  if (source === undefined || target === undefined) {
    throw new Error("Faltan lifelines");
  }
  return { document: withB, sourceId: source.id, targetId: target.id };
}

describe("createEmptySequenceDocument", () => {
  it("crea un documento secuencia vacío schema 2", () => {
    const document = emptySequence();
    expect(document.schemaVersion).toBe(2);
    expect(document.kind).toBe("sequence");
    expect(document.metadata.title).toBe(DEFAULT_SEQUENCE_DOCUMENT_TITLE);
    expect(document.elements).toEqual([]);
    expect(document.relationships).toEqual([]);
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });
});

describe("operaciones de secuencia", () => {
  it("crea, renombra, mueve y duplica lifelines", () => {
    const createId = sequentialIds();
    const document = emptySequence(createId);
    const created = expectOk(
      createLifeline(
        document,
        { name: " Cliente " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const lifeline = created.elements[0];
    if (lifeline === undefined || lifeline.kind !== "lifeline") {
      throw new Error("Se esperaba un lifeline");
    }
    expect(lifeline.name).toBe("Cliente");
    expect(lifeline.geometry).toEqual(DEFAULT_LIFELINE_GEOMETRY);
    expect(lifeline.stemLength).toBe(DEFAULT_LIFELINE_STEM_LENGTH);

    const renamed = expectOk(
      renameElement(created, lifeline.id, "API", {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    expect(renamed.elements[0]?.name).toBe("API");

    const moved = expectOk(
      moveElements(renamed, [{ id: lifeline.id, x: 64, y: 16 }], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    const movedLifeline = moved.elements[0];
    if (movedLifeline === undefined || movedLifeline.kind !== "lifeline") {
      throw new Error("Se esperaba un lifeline");
    }
    expect(movedLifeline.geometry).toEqual({
      ...DEFAULT_LIFELINE_GEOMETRY,
      x: 64,
      y: 16,
    });
    expect(movedLifeline.stemLength).toBe(DEFAULT_LIFELINE_STEM_LENGTH);

    const duplicated = expectOk(
      duplicateElements(moved, [lifeline.id], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    expect(duplicated.elements).toHaveLength(2);
    expect(duplicated.relationships).toEqual([]);
    const copy = duplicated.elements[1];
    if (copy === undefined || copy.kind !== "lifeline") {
      throw new Error("Se esperaba la copia");
    }
    expect(copy.id).not.toBe(lifeline.id);
    expect(copy.geometry).toEqual({
      ...movedLifeline.geometry,
      x: movedLifeline.geometry.x + DUPLICATE_OFFSET,
      y: movedLifeline.geometry.y + DUPLICATE_OFFSET,
    });
  });

  it("ajusta stemLength con mínimo 80", () => {
    const createId = sequentialIds();
    const { document, sourceId } = twoLifelines(createId);
    expectCode(
      resizeLifelineStem(
        document,
        { id: sourceId, stemLength: MIN_LIFELINE_STEM_LENGTH - 1 },
        { now: () => UPDATED_AT },
      ),
      "INVALID_GEOMETRY",
    );
    const resized = expectOk(
      resizeLifelineStem(
        document,
        { id: sourceId, stemLength: 120 },
        { now: () => UPDATED_AT },
      ),
    );
    const lifeline = resized.elements.find(
      (element) => element.id === sourceId,
    );
    expect(
      lifeline?.kind === "lifeline" ? lifeline.stemLength : undefined,
    ).toBe(120);
  });

  it("permite sync, reply y self-message; y inválido es INVALID_GEOMETRY", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoLifelines(createId);

    expect(
      canConnect(document, {
        kind: "sync-message",
        sourceId,
        targetId,
      }).ok,
    ).toBe(true);
    expect(
      canConnect(document, {
        kind: "reply-message",
        sourceId,
        targetId: sourceId,
      }).ok,
    ).toBe(true);

    expectCode(
      createRelationship(
        document,
        {
          kind: "sync-message",
          sourceId,
          targetId,
          y: INSIDE_HEAD_Y,
        },
        { createId, now: () => UPDATED_AT },
      ),
      "INVALID_GEOMETRY",
    );
    expectCode(
      createRelationship(
        document,
        {
          kind: "sync-message",
          sourceId,
          targetId,
          y: Number.NaN,
        },
        { createId, now: () => UPDATED_AT },
      ),
      "INVALID_GEOMETRY",
    );

    const sync = expectOk(
      createRelationship(
        document,
        {
          kind: "sync-message",
          sourceId,
          targetId,
          name: "ping()",
          y: VALID_Y,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const reply = expectOk(
      createRelationship(
        sync,
        {
          kind: "reply-message",
          sourceId: targetId,
          targetId: sourceId,
          y: 80,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const self = expectOk(
      createRelationship(
        reply,
        {
          kind: "sync-message",
          sourceId,
          targetId: sourceId,
          name: "retry",
          y: 120,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(self.relationships).toHaveLength(3);
    const selfMessage = self.relationships[2];
    expect(selfMessage?.sourceId).toBe(sourceId);
    expect(selfMessage?.targetId).toBe(sourceId);

    const renamed = expectOk(
      renameRelationship(self, self.relationships[1]?.id ?? "", "  pong  ", {
        now: () => UPDATED_AT,
      }),
    );
    expect(
      renamed.relationships[1]?.kind === "reply-message"
        ? renamed.relationships[1].name
        : undefined,
    ).toBe("pong");

    const moved = expectOk(
      moveMessage(
        renamed,
        { id: renamed.relationships[0]?.id ?? "", y: 200 },
        { now: () => UPDATED_AT },
      ),
    );
    expect(
      moved.relationships[0]?.kind === "sync-message"
        ? moved.relationships[0].y
        : undefined,
    ).toBe(200);
    expectCode(
      moveMessage(
        moved,
        { id: moved.relationships[0]?.id ?? "", y: INSIDE_HEAD_Y },
        { now: () => UPDATED_AT },
      ),
      "INVALID_GEOMETRY",
    );
  });

  it("borra lifelines en cascada de mensajes", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoLifelines(createId);
    const connected = expectOk(
      createRelationship(
        document,
        { kind: "sync-message", sourceId, targetId, y: VALID_Y },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(connected.relationships).toHaveLength(1);
    const deleted = expectOk(
      deleteElements(connected, [sourceId], { now: () => UPDATED_AT }),
    );
    expect(deleted.elements).toHaveLength(1);
    expect(deleted.relationships).toEqual([]);
  });

  it("no mezcla actor en secuencia ni lifeline en casos de uso", () => {
    const createId = sequentialIds();
    const sequence = emptySequence(createId);
    expectCode(
      createElement(
        sequence,
        { kind: "actor", name: "Usuario", geometry: HEAD },
        { now: () => UPDATED_AT },
      ),
      "UNKNOWN_KIND",
    );

    const useCaseDocument = {
      schemaVersion: 2 as const,
      id: "00000000-0000-4000-8000-000000000001",
      kind: "use-case" as const,
      metadata: {
        title: "Diagrama de casos de uso",
        createdAt: CREATED_AT.toISOString(),
        updatedAt: CREATED_AT.toISOString(),
      },
      elements: [],
      relationships: [],
    };
    expectCode(createLifeline(useCaseDocument, { name: "L" }), "UNKNOWN_KIND");
  });
});
