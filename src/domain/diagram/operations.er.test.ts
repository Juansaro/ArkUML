import { describe, expect, it } from "vitest";
import {
  DEFAULT_ATTRIBUTE_GEOMETRY,
  DEFAULT_ENTITY_GEOMETRY,
  DEFAULT_ER_DOCUMENT_TITLE,
  DEFAULT_ER_RELATIONSHIP_GEOMETRY,
  DUPLICATE_OFFSET,
  MIN_ATTRIBUTE_HEIGHT,
  MIN_ATTRIBUTE_WIDTH,
  MIN_ENTITY_HEIGHT,
  MIN_ENTITY_WIDTH,
  MIN_ER_RELATIONSHIP_HEIGHT,
  MIN_ER_RELATIONSHIP_WIDTH,
} from "./defaults.ts";
import {
  createActor,
  createEmptyDeploymentDocument,
  createEmptyErDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, Geometry, Result } from "./model.ts";
import {
  createAttribute,
  createElement,
  createEntity,
  createErRelationship,
  createRelationship,
  deleteElements,
  duplicateElements,
  moveElements,
  renameElement,
  resizeElement,
  setAttributeKey,
  setErCardinality,
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
const ENTITY_GEOMETRY: Geometry = {
  x: 40,
  y: 40,
  width: 160,
  height: 80,
};
const ATTRIBUTE_GEOMETRY: Geometry = {
  x: 40,
  y: 160,
  width: 120,
  height: 56,
};
const ROMBO_GEOMETRY: Geometry = {
  x: 240,
  y: 40,
  width: 120,
  height: 80,
};

function emptyEr(createId: IdFactory = sequentialIds()): DiagramDocument {
  return createEmptyErDocument({
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

function entityAttributeRombo(createId: IdFactory = sequentialIds()): {
  document: DiagramDocument;
  entityId: string;
  otherEntityId: string;
  attributeId: string;
  romboId: string;
} {
  const withEntity = expectOk(
    createEntity(
      emptyEr(createId),
      { name: "Cliente", geometry: ENTITY_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withOther = expectOk(
    createEntity(
      withEntity,
      {
        name: "Pedido",
        geometry: { x: 360, y: 40, width: 160, height: 80 },
      },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withAttribute = expectOk(
    createAttribute(
      withOther,
      { name: "id", geometry: ATTRIBUTE_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withRombo = expectOk(
    createErRelationship(
      withAttribute,
      { name: "realiza", geometry: ROMBO_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const entity = withRombo.elements[0];
  const otherEntity = withRombo.elements[1];
  const attribute = withRombo.elements[2];
  const rombo = withRombo.elements[3];
  if (
    entity === undefined ||
    otherEntity === undefined ||
    attribute === undefined ||
    rombo === undefined
  ) {
    throw new Error("Faltan elementos ER");
  }
  return {
    document: withRombo,
    entityId: entity.id,
    otherEntityId: otherEntity.id,
    attributeId: attribute.id,
    romboId: rombo.id,
  };
}

describe("createEmptyErDocument", () => {
  it("crea un documento entity-relationship vacío con título por defecto", () => {
    const document = emptyEr();
    expect(document.schemaVersion).toBe(3);
    expect(document.kind).toBe("entity-relationship");
    expect(document.metadata.title).toBe(DEFAULT_ER_DOCUMENT_TITLE);
    expect(document.elements).toEqual([]);
    expect(document.relationships).toEqual([]);
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });
});

describe("operaciones de entidad-relación", () => {
  it("crea, renombra, mueve, redimensiona, isKey y borra con cascada", () => {
    const createId = sequentialIds();
    const createdEntity = expectOk(
      createEntity(
        emptyEr(createId),
        { name: "  Cliente  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(createdEntity.elements[0]).toMatchObject({
      kind: "entity",
      name: "Cliente",
      geometry: DEFAULT_ENTITY_GEOMETRY,
    });

    const createdAttribute = expectOk(
      createAttribute(
        createdEntity,
        { name: "  id  ", isKey: true },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(createdAttribute.elements[1]).toMatchObject({
      kind: "attribute",
      name: "id",
      geometry: DEFAULT_ATTRIBUTE_GEOMETRY,
      isKey: true,
    });

    const createdRombo = expectOk(
      createErRelationship(
        createdAttribute,
        { name: "  realiza  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(createdRombo.elements[2]).toMatchObject({
      kind: "er-relationship",
      name: "realiza",
      geometry: DEFAULT_ER_RELATIONSHIP_GEOMETRY,
    });

    const entityId = createdRombo.elements[0]?.id;
    const attributeId = createdRombo.elements[1]?.id;
    const romboId = createdRombo.elements[2]?.id;
    if (
      entityId === undefined ||
      attributeId === undefined ||
      romboId === undefined
    ) {
      throw new Error("Faltan ids");
    }

    const renamed = expectOk(
      renameElement(createdRombo, entityId, "Persona", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamed.elements[0]).toMatchObject({ name: "Persona" });

    const moved = expectOk(
      moveElements(renamed, [{ id: entityId, x: 16, y: 24 }], {
        now: () => UPDATED_AT,
      }),
    );
    expect(moved.elements[0]?.geometry).toMatchObject({ x: 16, y: 24 });

    const resized = expectOk(
      resizeElement(
        moved,
        { id: entityId, geometry: { x: 16, y: 24, width: 180, height: 96 } },
        { now: () => UPDATED_AT },
      ),
    );
    expect(resized.elements[0]?.geometry).toEqual({
      x: 16,
      y: 24,
      width: 180,
      height: 96,
    });

    expectCode(
      resizeElement(resized, {
        id: entityId,
        geometry: {
          x: 16,
          y: 24,
          width: MIN_ENTITY_WIDTH - 1,
          height: MIN_ENTITY_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );
    expectCode(
      resizeElement(resized, {
        id: attributeId,
        geometry: {
          x: 40,
          y: 160,
          width: MIN_ATTRIBUTE_WIDTH - 1,
          height: MIN_ATTRIBUTE_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );
    expectCode(
      resizeElement(resized, {
        id: romboId,
        geometry: {
          x: 240,
          y: 40,
          width: MIN_ER_RELATIONSHIP_WIDTH - 1,
          height: MIN_ER_RELATIONSHIP_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );

    const clearedKey = expectOk(
      setAttributeKey(
        resized,
        { id: attributeId, isKey: false },
        { now: () => UPDATED_AT },
      ),
    );
    expect(clearedKey.elements[1]).toMatchObject({
      kind: "attribute",
      name: "id",
    });
    expect(clearedKey.elements[1]).not.toHaveProperty("isKey");

    const withLink = expectOk(
      createRelationship(
        clearedKey,
        { kind: "er-link", sourceId: attributeId, targetId: entityId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(withLink.relationships).toHaveLength(1);

    const deleted = expectOk(
      deleteElements(withLink, [entityId], { now: () => UPDATED_AT }),
    );
    expect(deleted.elements).toHaveLength(2);
    expect(deleted.relationships).toEqual([]);
  });

  it("crea er-link atributo–entidad y entidad–rombo con cardinalidad", () => {
    const createId = sequentialIds();
    const { document, entityId, otherEntityId, attributeId, romboId } =
      entityAttributeRombo(createId);

    const attrLink = expectOk(
      createRelationship(
        document,
        { kind: "er-link", sourceId: attributeId, targetId: entityId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(attrLink.relationships[0]).toMatchObject({
      kind: "er-link",
      sourceId: attributeId,
      targetId: entityId,
    });
    expect(attrLink.relationships[0]).not.toHaveProperty("cardinality");

    const entityLink = expectOk(
      createRelationship(
        attrLink,
        { kind: "er-link", sourceId: entityId, targetId: romboId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(entityLink.relationships[1]).toMatchObject({
      kind: "er-link",
      sourceId: entityId,
      targetId: romboId,
      cardinality: "N",
    });

    const otherLink = expectOk(
      createRelationship(
        entityLink,
        {
          kind: "er-link",
          sourceId: otherEntityId,
          targetId: romboId,
          cardinality: "1",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(otherLink.relationships[2]).toMatchObject({
      cardinality: "1",
    });

    const linkId = otherLink.relationships[1]?.id;
    if (linkId === undefined) {
      throw new Error("Falta el er-link");
    }
    const updated = expectOk(
      setErCardinality(
        otherLink,
        { id: linkId, cardinality: "1" },
        { now: () => UPDATED_AT },
      ),
    );
    expect(updated.relationships[1]).toMatchObject({ cardinality: "1" });
    expect(parseDiagramDocument(updated).ok).toBe(true);
  });

  it("rechaza self, atributo–rombo, segundo enlace de atributo y cardinalidad ilegal", () => {
    const createId = sequentialIds();
    const { document, entityId, attributeId, romboId } =
      entityAttributeRombo(createId);

    expectCode(
      createRelationship(document, {
        kind: "er-link",
        sourceId: entityId,
        targetId: entityId,
      }),
      "SELF_RELATIONSHIP",
    );
    expectCode(
      canConnect(document, {
        kind: "er-link",
        sourceId: attributeId,
        targetId: romboId,
      }),
      "INVALID_CONNECTION",
    );
    expectCode(
      createRelationship(document, {
        kind: "er-link",
        sourceId: attributeId,
        targetId: entityId,
        cardinality: "1",
      }),
      "INVALID_CONNECTION",
    );

    const linked = expectOk(
      createRelationship(
        document,
        { kind: "er-link", sourceId: attributeId, targetId: entityId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expectCode(
      createRelationship(linked, {
        kind: "er-link",
        sourceId: attributeId,
        targetId: entityId,
      }),
      "INVALID_CONNECTION",
    );

    const attrLinkId = linked.relationships[0]?.id;
    if (attrLinkId === undefined) {
      throw new Error("Falta el enlace de atributo");
    }
    expectCode(
      setErCardinality(linked, { id: attrLinkId, cardinality: "N" }),
      "INVALID_CONNECTION",
    );
  });

  it("duplica sin enlaces", () => {
    const createId = sequentialIds();
    const { document, entityId, romboId } = entityAttributeRombo(createId);
    const connected = expectOk(
      createRelationship(
        document,
        {
          kind: "er-link",
          sourceId: entityId,
          targetId: romboId,
          cardinality: "1",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const duplicated = expectOk(
      duplicateElements(connected, [entityId], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    expect(duplicated.elements).toHaveLength(5);
    expect(duplicated.relationships).toHaveLength(1);
    const copy = duplicated.elements[4];
    expect(copy?.geometry).toMatchObject({
      x: ENTITY_GEOMETRY.x + DUPLICATE_OFFSET,
      y: ENTITY_GEOMETRY.y + DUPLICATE_OFFSET,
    });
  });

  it("no mezcla actor en ER ni ER en kinds previos", () => {
    const createId = sequentialIds();
    const erDocument = emptyEr(createId);
    expectCode(
      createElement(
        erDocument,
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
      ...erDocument,
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
      createEntity(createEmptySequenceDocument({ createId }), { name: "X" }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createAttribute(createEmptyDeploymentDocument({ createId }), {
        name: "X",
      }),
      "UNKNOWN_KIND",
    );
  });
});
