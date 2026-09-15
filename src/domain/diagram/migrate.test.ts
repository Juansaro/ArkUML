import { describe, expect, it } from "vitest";
import {
  createActor,
  createDiagramDocument,
  createEmptySequenceDocument,
  createRelationship,
  createUseCase,
  type IdFactory,
} from "./factories.ts";
import { migrateDocument } from "./migrate.ts";
import type { DiagramDocumentV1 } from "./model.ts";
import { parseDiagramDocument } from "./schema.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");

function typicalUseCaseV1(): DiagramDocumentV1 {
  const createId = sequentialIds();
  const document = createDiagramDocument({
    createId,
    now: () => FIXED_NOW,
  });
  const boundary = document.elements[0];
  if (boundary === undefined || boundary.kind !== "system-boundary") {
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
    schemaVersion: 1,
    id: document.id,
    kind: "use-case",
    metadata: document.metadata,
    elements: [boundary, actor, useCase],
    relationships: [relationship],
  };
}

describe("migrateDocument 1→2→3", () => {
  it("copia un documento MVP, escribe schemaVersion 3 y no altera elementos", () => {
    const v1 = typicalUseCaseV1();
    const migrated = migrateDocument(v1);

    expect(migrated.ok).toBe(true);
    if (!migrated.ok) {
      return;
    }

    expect(migrated.value.schemaVersion).toBe(3);
    expect(migrated.value.kind).toBe("use-case");
    expect(migrated.value.id).toBe(v1.id);
    expect(migrated.value.metadata).toEqual(v1.metadata);
    expect(migrated.value.elements).toEqual(v1.elements);
    expect(migrated.value.relationships).toEqual(v1.relationships);
    expect(migrated.value.elements).not.toBe(v1.elements);
    expect(parseDiagramDocument(migrated.value)).toEqual({
      ok: true,
      value: migrated.value,
    });
  });

  it("encadena: un documento ya en 3 valida sin mutar", () => {
    const first = migrateDocument(typicalUseCaseV1());
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const second = migrateDocument(first.value);
    expect(second).toEqual(first);
  });

  it("rechaza saltos y versiones desconocidas", () => {
    const v1 = typicalUseCaseV1();
    const skipped = migrateDocument({ ...v1, schemaVersion: 4 });
    expect(skipped.ok).toBe(false);
    if (skipped.ok) {
      return;
    }
    expect(skipped.error.code).toBe("UNKNOWN_KIND");

    const missing = migrateDocument({ kind: "use-case" });
    expect(missing.ok).toBe(false);
  });

  it("no migra JSON que el parser 1 rechaza", () => {
    const v1 = typicalUseCaseV1();
    const result = migrateDocument({ ...v1, selected: true });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("UNKNOWN_KIND");
  });

  it("no convierte un documento de secuencia schema 1", () => {
    const sequence = createEmptySequenceDocument({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const result = migrateDocument({ ...sequence, schemaVersion: 1 });
    expect(result.ok).toBe(false);
  });
});

describe("migrateDocument 2→3", () => {
  it("copia un use-case schema 2, escribe schemaVersion 3 y no altera elementos", () => {
    const v1 = typicalUseCaseV1();
    const v2 = {
      ...v1,
      schemaVersion: 2 as const,
    };
    const migrated = migrateDocument(v2);

    expect(migrated.ok).toBe(true);
    if (!migrated.ok) {
      return;
    }
    expect(migrated.value.schemaVersion).toBe(3);
    expect(migrated.value.kind).toBe("use-case");
    expect(migrated.value.elements).toEqual(v2.elements);
    expect(migrated.value.relationships).toEqual(v2.relationships);
    expect(parseDiagramDocument(migrated.value).ok).toBe(true);
  });

  it("migra un documento secuencia schema 2 sin alterar lifelines ni mensajes", () => {
    const createId = sequentialIds();
    const sequence = createEmptySequenceDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const v2 = { ...sequence, schemaVersion: 2 as const };
    const migrated = migrateDocument(v2);
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) {
      return;
    }
    expect(migrated.value.schemaVersion).toBe(3);
    expect(migrated.value.kind).toBe("sequence");
    expect(migrated.value.elements).toEqual(sequence.elements);
    expect(migrated.value.relationships).toEqual(sequence.relationships);
  });
});
