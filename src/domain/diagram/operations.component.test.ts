import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPONENT_GEOMETRY,
  DEFAULT_COMPONENT_DOCUMENT_TITLE,
  DUPLICATE_OFFSET,
  MIN_COMPONENT_HEIGHT,
  MIN_COMPONENT_WIDTH,
} from "./defaults.ts";
import {
  createActor,
  createEmptyClassDocument,
  createEmptyComponentDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, Geometry, Result } from "./model.ts";
import {
  createComponent,
  createElement,
  createRelationship,
  deleteElements,
  duplicateElements,
  moveElements,
  renameElement,
  renameRelationship,
  resizeElement,
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
const COMPONENT_GEOMETRY: Geometry = {
  x: 40,
  y: 40,
  width: 200,
  height: 120,
};

function emptyComponent(
  createId: IdFactory = sequentialIds(),
): DiagramDocument {
  return createEmptyComponentDocument({
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

function twoComponents(createId: IdFactory = sequentialIds()): {
  document: DiagramDocument;
  sourceId: string;
  targetId: string;
} {
  const withA = expectOk(
    createComponent(
      emptyComponent(createId),
      { name: "Billing", geometry: COMPONENT_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withB = expectOk(
    createComponent(
      withA,
      {
        name: "Catalog",
        geometry: { x: 300, y: 40, width: 200, height: 120 },
      },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const source = withB.elements[0];
  const target = withB.elements[1];
  if (source === undefined || target === undefined) {
    throw new Error("Faltan los componentes");
  }
  return { document: withB, sourceId: source.id, targetId: target.id };
}

describe("createEmptyComponentDocument", () => {
  it("crea un documento component vacío con título por defecto", () => {
    const document = emptyComponent();
    expect(document.schemaVersion).toBe(3);
    expect(document.kind).toBe("component");
    expect(document.metadata.title).toBe(DEFAULT_COMPONENT_DOCUMENT_TITLE);
    expect(document.elements).toEqual([]);
    expect(document.relationships).toEqual([]);
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });
});

describe("operaciones de componentes", () => {
  it("crea, renombra, mueve, redimensiona y borra un componente", () => {
    const createId = sequentialIds();
    const created = expectOk(
      createComponent(
        emptyComponent(createId),
        { name: "  Billing  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(created.elements).toHaveLength(1);
    expect(created.elements[0]).toMatchObject({
      kind: "component",
      name: "Billing",
      geometry: DEFAULT_COMPONENT_GEOMETRY,
    });

    const elementId = created.elements[0]?.id;
    if (elementId === undefined) {
      throw new Error("Falta el componente");
    }

    const renamed = expectOk(
      renameElement(created, elementId, "Pagos", { now: () => UPDATED_AT }),
    );
    expect(renamed.elements[0]).toMatchObject({ name: "Pagos" });

    const moved = expectOk(
      moveElements(renamed, [{ id: elementId, x: 16, y: 24 }], {
        now: () => UPDATED_AT,
      }),
    );
    expect(moved.elements[0]?.geometry).toMatchObject({ x: 16, y: 24 });

    const resized = expectOk(
      resizeElement(
        moved,
        { id: elementId, geometry: { x: 16, y: 24, width: 220, height: 140 } },
        { now: () => UPDATED_AT },
      ),
    );
    expect(resized.elements[0]?.geometry).toEqual({
      x: 16,
      y: 24,
      width: 220,
      height: 140,
    });

    expectCode(
      resizeElement(resized, {
        id: elementId,
        geometry: {
          x: 16,
          y: 24,
          width: MIN_COMPONENT_WIDTH - 1,
          height: MIN_COMPONENT_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );

    const deleted = expectOk(
      deleteElements(resized, [elementId], { now: () => UPDATED_AT }),
    );
    expect(deleted.elements).toEqual([]);
  });

  it("crea component-usage y assembly-connector", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoComponents(createId);

    const usage = expectOk(
      createRelationship(
        document,
        { kind: "component-usage", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(usage.relationships[0]).toMatchObject({
      kind: "component-usage",
      sourceId,
      targetId,
      name: "",
    });

    const assembly = expectOk(
      createRelationship(
        usage,
        {
          kind: "assembly-connector",
          sourceId,
          targetId,
          name: "pago",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(assembly.relationships).toHaveLength(2);
    expect(assembly.relationships[1]).toMatchObject({
      kind: "assembly-connector",
      sourceId,
      targetId,
      name: "pago",
    });
    expect(parseDiagramDocument(assembly).ok).toBe(true);
  });

  it("rechaza self, permite duplicados y cascada al borrar componente", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoComponents(createId);

    expectCode(
      createRelationship(document, {
        kind: "component-usage",
        sourceId,
        targetId: sourceId,
      }),
      "SELF_RELATIONSHIP",
    );
    expect(
      canConnect(document, {
        kind: "assembly-connector",
        sourceId,
        targetId: sourceId,
      }).ok,
    ).toBe(false);

    const first = expectOk(
      createRelationship(
        document,
        { kind: "component-usage", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const duplicate = expectOk(
      createRelationship(
        first,
        { kind: "component-usage", sourceId, targetId },
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

  it("renombra una relación y duplica sin relaciones", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoComponents(createId);
    const connected = expectOk(
      createRelationship(
        document,
        { kind: "assembly-connector", sourceId, targetId, name: "link" },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const relationshipId = connected.relationships[0]?.id;
    if (relationshipId === undefined) {
      throw new Error("Falta la relación");
    }
    const renamed = expectOk(
      renameRelationship(connected, relationshipId, "  cable  ", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamed.relationships[0]).toMatchObject({ name: "cable" });

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
      x: COMPONENT_GEOMETRY.x + DUPLICATE_OFFSET,
      y: COMPONENT_GEOMETRY.y + DUPLICATE_OFFSET,
    });
  });

  it("no mezcla actor en component ni component en use-case, secuencia o class", () => {
    const createId = sequentialIds();
    const componentDocument = emptyComponent(createId);
    expectCode(
      createElement(
        componentDocument,
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
      ...componentDocument,
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
      createComponent(createEmptySequenceDocument({ createId }), {
        name: "X",
      }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createComponent(createEmptyClassDocument({ createId }), { name: "X" }),
      "UNKNOWN_KIND",
    );
  });
});
