import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLASS_GEOMETRY,
  DEFAULT_CLASS_DOCUMENT_TITLE,
  DUPLICATE_OFFSET,
  MIN_CLASS_HEIGHT,
  MIN_CLASS_WIDTH,
} from "./defaults.ts";
import {
  createActor,
  createEmptyClassDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, Geometry, Result } from "./model.ts";
import {
  createClass,
  createElement,
  createRelationship,
  deleteElements,
  duplicateElements,
  moveElements,
  renameElement,
  renameRelationship,
  resizeElement,
  setAssociationEnds,
  setClassMembers,
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
const CLASS_GEOMETRY: Geometry = { x: 40, y: 40, width: 180, height: 96 };

function emptyClass(createId: IdFactory = sequentialIds()): DiagramDocument {
  return createEmptyClassDocument({
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

function twoClasses(createId: IdFactory = sequentialIds()): {
  document: DiagramDocument;
  sourceId: string;
  targetId: string;
} {
  const withA = expectOk(
    createClass(
      emptyClass(createId),
      { name: "Pedido", geometry: CLASS_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withB = expectOk(
    createClass(
      withA,
      {
        name: "Cliente",
        geometry: { x: 280, y: 40, width: 180, height: 96 },
      },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const source = withB.elements[0];
  const target = withB.elements[1];
  if (source === undefined || target === undefined) {
    throw new Error("Faltan las clases");
  }
  return { document: withB, sourceId: source.id, targetId: target.id };
}

describe("createEmptyClassDocument", () => {
  it("crea un documento class vacío con título por defecto", () => {
    const document = emptyClass();
    expect(document.schemaVersion).toBe(3);
    expect(document.kind).toBe("class");
    expect(document.metadata.title).toBe(DEFAULT_CLASS_DOCUMENT_TITLE);
    expect(document.elements).toEqual([]);
    expect(document.relationships).toEqual([]);
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });
});

describe("operaciones de clases", () => {
  it("crea, renombra, mueve, redimensiona y borra una clase", () => {
    const createId = sequentialIds();
    const created = expectOk(
      createClass(
        emptyClass(createId),
        { name: "  Pedido  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(created.elements).toHaveLength(1);
    expect(created.elements[0]).toMatchObject({
      kind: "class",
      name: "Pedido",
      geometry: DEFAULT_CLASS_GEOMETRY,
      attributes: [],
      operations: [],
    });

    const elementId = created.elements[0]?.id;
    if (elementId === undefined) {
      throw new Error("Falta la clase");
    }

    const renamed = expectOk(
      renameElement(created, elementId, "Orden", { now: () => UPDATED_AT }),
    );
    expect(renamed.elements[0]).toMatchObject({ name: "Orden" });

    const moved = expectOk(
      moveElements(renamed, [{ id: elementId, x: 16, y: 24 }], {
        now: () => UPDATED_AT,
      }),
    );
    expect(moved.elements[0]?.geometry).toMatchObject({ x: 16, y: 24 });

    const resized = expectOk(
      resizeElement(
        moved,
        { id: elementId, geometry: { x: 16, y: 24, width: 200, height: 120 } },
        { now: () => UPDATED_AT },
      ),
    );
    expect(resized.elements[0]?.geometry).toEqual({
      x: 16,
      y: 24,
      width: 200,
      height: 120,
    });

    expectCode(
      resizeElement(resized, {
        id: elementId,
        geometry: {
          x: 16,
          y: 24,
          width: MIN_CLASS_WIDTH - 1,
          height: MIN_CLASS_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );

    const deleted = expectOk(
      deleteElements(resized, [elementId], { now: () => UPDATED_AT }),
    );
    expect(deleted.elements).toEqual([]);
  });

  it("sustituye atributos y operaciones, recorta y descarta vacíos", () => {
    const createId = sequentialIds();
    const created = expectOk(
      createClass(
        emptyClass(createId),
        { name: "Pedido", geometry: CLASS_GEOMETRY },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const id = created.elements[0]?.id;
    if (id === undefined) {
      throw new Error("Falta la clase");
    }

    const updated = expectOk(
      setClassMembers(
        created,
        {
          id,
          attributes: ["  id  ", "", "   ", "total"],
          operations: ["  confirmar()  ", ""],
        },
        { now: () => UPDATED_AT },
      ),
    );
    expect(updated.elements[0]).toMatchObject({
      attributes: ["id", "total"],
      operations: ["confirmar()"],
    });

    expectCode(
      setClassMembers(updated, {
        id,
        attributes: ["x".repeat(81)],
        operations: [],
      }),
      "INVALID_NAME",
    );
  });

  it("crea asociación, agregación, composición y generalization", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoClasses(createId);

    const association = expectOk(
      createRelationship(
        document,
        { kind: "class-association", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(association.relationships[0]).toMatchObject({
      kind: "class-association",
      sourceId,
      targetId,
      name: "",
      sourceMultiplicity: "1",
      targetMultiplicity: "1",
    });

    const aggregation = expectOk(
      createRelationship(
        association,
        {
          kind: "aggregation",
          sourceId,
          targetId,
          sourceMultiplicity: "0..1",
          targetMultiplicity: "0..*",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const composition = expectOk(
      createRelationship(
        aggregation,
        {
          kind: "composition",
          sourceId,
          targetId,
          name: "partes",
          sourceMultiplicity: "1",
          targetMultiplicity: "1..*",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const generalization = expectOk(
      createRelationship(
        composition,
        { kind: "generalization", sourceId, targetId, name: "es" },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(generalization.relationships).toHaveLength(4);
    expect(generalization.relationships[3]).toEqual(
      expect.objectContaining({
        kind: "generalization",
        sourceId,
        targetId,
        name: "es",
      }),
    );
    expect(generalization.relationships[3]).not.toHaveProperty(
      "sourceMultiplicity",
    );
    expect(parseDiagramDocument(generalization).ok).toBe(true);
  });

  it("rechaza self, permite duplicados y cascada al borrar clase", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoClasses(createId);

    expectCode(
      createRelationship(document, {
        kind: "class-association",
        sourceId,
        targetId: sourceId,
      }),
      "SELF_RELATIONSHIP",
    );
    expect(
      canConnect(document, {
        kind: "class-association",
        sourceId,
        targetId: sourceId,
      }).ok,
    ).toBe(false);

    const first = expectOk(
      createRelationship(
        document,
        { kind: "class-association", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const duplicate = expectOk(
      createRelationship(
        first,
        { kind: "class-association", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(duplicate.relationships).toHaveLength(2);

    const deleted = expectOk(
      deleteElements(duplicate, [sourceId], { now: () => UPDATED_AT }),
    );
    expect(deleted.elements).toHaveLength(1);
    expect(deleted.relationships).toEqual([]);
  });

  it("setAssociationEnds valida el enum y es ilegal en generalization", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoClasses(createId);
    const withAssoc = expectOk(
      createRelationship(
        document,
        { kind: "class-association", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const associationId = withAssoc.relationships[0]?.id;
    if (associationId === undefined) {
      throw new Error("Falta la asociación");
    }

    const updated = expectOk(
      setAssociationEnds(
        withAssoc,
        {
          id: associationId,
          sourceMultiplicity: "0..*",
          targetMultiplicity: "1..*",
        },
        { now: () => UPDATED_AT },
      ),
    );
    expect(updated.relationships[0]).toMatchObject({
      sourceMultiplicity: "0..*",
      targetMultiplicity: "1..*",
    });

    const withGeneralization = expectOk(
      createRelationship(
        updated,
        { kind: "generalization", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const generalizationId = withGeneralization.relationships[1]?.id;
    if (generalizationId === undefined) {
      throw new Error("Falta la generalization");
    }
    expectCode(
      setAssociationEnds(withGeneralization, {
        id: generalizationId,
        sourceMultiplicity: "1",
        targetMultiplicity: "1",
      }),
      "INVALID_CONNECTION",
    );
    expectCode(
      createRelationship(updated, {
        kind: "generalization",
        sourceId,
        targetId,
        sourceMultiplicity: "1",
        targetMultiplicity: "1",
      }),
      "INVALID_CONNECTION",
    );
  });

  it("renombra una relación de clases y duplica sin relaciones", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoClasses(createId);
    const connected = expectOk(
      createRelationship(
        document,
        { kind: "aggregation", sourceId, targetId, name: "tiene" },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const relationshipId = connected.relationships[0]?.id;
    if (relationshipId === undefined) {
      throw new Error("Falta la relación");
    }
    const renamed = expectOk(
      renameRelationship(connected, relationshipId, "  contiene  ", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamed.relationships[0]).toMatchObject({ name: "contiene" });

    const duplicated = expectOk(
      duplicateElements(renamed, [sourceId], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    expect(duplicated.elements).toHaveLength(3);
    expect(duplicated.relationships).toHaveLength(1);
    const copy = duplicated.elements[2];
    expect(copy?.geometry).toMatchObject({
      x: CLASS_GEOMETRY.x + DUPLICATE_OFFSET,
      y: CLASS_GEOMETRY.y + DUPLICATE_OFFSET,
    });
  });

  it("no mezcla actor en class ni class en use-case o secuencia", () => {
    const createId = sequentialIds();
    const classDocument = emptyClass(createId);
    expectCode(
      createElement(
        classDocument,
        {
          kind: "actor",
          name: "Usuario",
          geometry: { x: 0, y: 0, width: 48, height: 96 },
        },
        { now: () => UPDATED_AT },
      ),
      "UNKNOWN_KIND",
    );

    const mixed = parseDiagramDocument({
      ...classDocument,
      elements: [
        createActor(
          { name: "Usuario", geometry: { x: 0, y: 0, width: 48, height: 96 } },
          { createId },
        ),
      ],
    });
    expect(mixed.ok).toBe(false);
    if (!mixed.ok) {
      expect(mixed.error.code).toBe("UNKNOWN_KIND");
    }

    expectCode(
      createClass(createEmptySequenceDocument({ createId }), { name: "X" }),
      "UNKNOWN_KIND",
    );
  });
});
