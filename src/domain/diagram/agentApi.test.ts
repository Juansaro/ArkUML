import { describe, expect, it } from "vitest";
import {
  createDocument,
  createElement,
  createRelationship,
  deleteElement,
  deleteRelationship,
  describeRules,
  listElements,
  listKinds,
  loadDocument,
  saveDocument,
  updateElement,
  updateRelationship,
  validateDocument,
} from "./agentApi.ts";
import {
  DEFAULT_BOUNDARY_NAME,
  DEFAULT_CLASS_GEOMETRY,
  DEFAULT_VIEWPORT,
} from "./defaults.ts";
import {
  DOCUMENT_FILE_FORMAT,
  DOCUMENT_FILE_FORMAT_VERSION,
} from "./documentFile.ts";
import type { IdFactory } from "./factories.ts";
import type { DiagramDocument, DiagramElement, Result } from "./model.ts";
import type { OperationDeps } from "./operations.ts";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-21T12:00:00.000Z");

function deps(): OperationDeps {
  return { createId: sequentialIds(), now: () => FIXED_NOW };
}

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.value;
}

function byKind(
  document: DiagramDocument,
  kind: DiagramElement["kind"],
): DiagramElement {
  const element = document.elements.find(
    (candidate) => candidate.kind === kind,
  );
  if (element === undefined) {
    throw new Error(`Falta ${kind}`);
  }
  return element;
}

describe("listKinds", () => {
  it("lista los ocho kinds de schema 3 con resumen estable", () => {
    const kinds = listKinds();

    expect(kinds.map((entry) => entry.kind)).toEqual([
      "use-case",
      "sequence",
      "class",
      "component",
      "deployment",
      "entity-relationship",
      "activity",
      "interaction-overview",
    ]);
    for (const entry of kinds) {
      expect(entry.defaultTitle.length).toBeGreaterThan(0);
      expect(entry.elements.length).toBeGreaterThan(0);
      expect(entry.relationships.length).toBeGreaterThan(0);
      expect(entry.rules.length).toBeGreaterThan(0);
    }
  });

  it("describeRules rechaza un kind desconocido", () => {
    const described = describeRules("state-machine");

    expect(described.ok).toBe(false);
    if (!described.ok) {
      expect(described.error.code).toBe("UNKNOWN_KIND");
    }
  });
});

describe("createDocument", () => {
  it("crea un documento vacío válido para cada kind vigente", () => {
    for (const entry of listKinds()) {
      const document = unwrap(createDocument(entry.kind, {}, deps()));

      expect(document.schemaVersion).toBe(3);
      expect(document.kind).toBe(entry.kind);
      expect(document.id).toMatch(UUID_V4);
      expect(document.metadata.title).toBe(entry.defaultTitle);
      expect(document.relationships).toEqual([]);
      if (entry.kind === "use-case") {
        expect(document.elements).toHaveLength(1);
        expect(document.elements[0]?.kind).toBe("system-boundary");
        expect(document.elements[0]?.name).toBe(DEFAULT_BOUNDARY_NAME);
      } else {
        expect(document.elements).toEqual([]);
      }

      const loaded = unwrap(loadDocument(saveDocument(document)));
      expect(loaded.format).toBe(DOCUMENT_FILE_FORMAT);
      expect(loaded.formatVersion).toBe(DOCUMENT_FILE_FORMAT_VERSION);
      expect(loaded.document).toEqual(document);
      expect(loaded.view).toEqual(DEFAULT_VIEWPORT);
    }
  });

  it("aplica un título opcional y rechaza uno vacío", () => {
    const document = unwrap(
      createDocument("class", { title: "  Pedidos  " }, deps()),
    );
    expect(document.metadata.title).toBe("Pedidos");

    const rejected = createDocument("class", { title: "   " }, deps());
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("INVALID_NAME");
    }
  });

  it("rechaza un kind desconocido sin lanzar", () => {
    const rejected = createDocument("state-machine");

    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("UNKNOWN_KIND");
    }
  });
});

describe("agentApi use-case", () => {
  it("crea, actualiza y borra elementos y relaciones", () => {
    const factory = deps();
    let document = unwrap(createDocument("use-case", {}, factory));
    document = unwrap(
      createElement(document, { kind: "actor", name: "Usuario" }, factory),
    );
    document = unwrap(
      createElement(document, { kind: "use-case", name: "Comprar" }, factory),
    );

    const actor = byKind(document, "actor");
    const useCase = byKind(document, "use-case");
    expect(actor.geometry).toEqual({ x: 0, y: 0, width: 72, height: 112 });
    expect(useCase.geometry).toEqual({ x: 0, y: 0, width: 160, height: 80 });

    document = unwrap(
      createRelationship(
        document,
        {
          kind: "association",
          sourceId: useCase.id,
          targetId: actor.id,
        },
        factory,
      ),
    );
    const association = document.relationships[0];
    if (association === undefined) {
      throw new Error("Falta la asociación");
    }
    expect(association.kind).toBe("association");
    expect(association.sourceId).toBe(actor.id);
    expect(association.targetId).toBe(useCase.id);

    const summary = listElements(document);
    expect(summary.elements.map((element) => element.kind)).toEqual([
      "system-boundary",
      "actor",
      "use-case",
    ]);
    expect(summary.relationships).toHaveLength(1);

    const beforeFailedUpdate = document;
    const rejectedSize = updateElement(
      document,
      { id: actor.id, name: "Cliente", geometry: { width: 10 } },
      factory,
    );
    expect(rejectedSize.ok).toBe(false);
    if (!rejectedSize.ok) {
      expect(rejectedSize.error.code).toBe("INVALID_GEOMETRY");
    }
    expect(document).toBe(beforeFailedUpdate);
    expect(byKind(document, "actor").name).toBe("Usuario");

    document = unwrap(
      updateElement(
        document,
        { id: actor.id, name: "Cliente", geometry: { x: -200, y: 40 } },
        factory,
      ),
    );
    expect(byKind(document, "actor").name).toBe("Cliente");
    expect(byKind(document, "actor").geometry.x).toBe(-200);

    document = unwrap(deleteRelationship(document, association.id, factory));
    expect(document.relationships).toEqual([]);

    document = unwrap(
      createRelationship(
        document,
        {
          kind: "association",
          sourceId: actor.id,
          targetId: useCase.id,
        },
        factory,
      ),
    );
    const recreated = document.relationships[0];
    if (recreated === undefined) {
      throw new Error("Falta la asociación recreada");
    }
    document = unwrap(deleteElement(document, actor.id, factory));
    expect(document.elements.some((element) => element.kind === "actor")).toBe(
      false,
    );
    expect(document.relationships).toEqual([]);
    expect(
      document.relationships.some(
        (relationship) => relationship.id === recreated.id,
      ),
    ).toBe(false);
  });

  it("devuelve la razón de canConnect sin lanzar", () => {
    const factory = deps();
    let document = unwrap(createDocument("use-case", {}, factory));
    document = unwrap(
      createElement(document, { kind: "actor", name: "Usuario" }, factory),
    );
    document = unwrap(
      createElement(document, { kind: "use-case", name: "Comprar" }, factory),
    );
    const actor = byKind(document, "actor");
    const useCase = byKind(document, "use-case");
    const boundary = byKind(document, "system-boundary");
    const before = document;

    const rejected = createRelationship(
      document,
      {
        kind: "include",
        sourceId: actor.id,
        targetId: useCase.id,
      },
      factory,
    );
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("INVALID_CONNECTION");
      expect(rejected.error.message.length).toBeGreaterThan(0);
    }
    expect(document).toBe(before);

    const boundaryRejected = createRelationship(document, {
      kind: "association",
      sourceId: boundary.id,
      targetId: useCase.id,
    });
    expect(boundaryRejected.ok).toBe(false);
    if (!boundaryRejected.ok) {
      expect(boundaryRejected.error.code).toBe("INVALID_CONNECTION");
    }

    document = unwrap(
      createRelationship(
        document,
        {
          kind: "association",
          sourceId: actor.id,
          targetId: useCase.id,
        },
        factory,
      ),
    );
    const duplicate = createRelationship(document, {
      kind: "association",
      sourceId: actor.id,
      targetId: useCase.id,
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.error.code).toBe("DUPLICATE_RELATIONSHIP");
    }
  });

  it("valida warnings sin mutar el documento", () => {
    const factory = deps();
    let document = unwrap(createDocument("use-case", {}, factory));
    document = unwrap(
      createElement(document, { kind: "actor", name: "Usuario" }, factory),
    );
    const snapshot = JSON.stringify(document);

    const validated = unwrap(validateDocument(document));

    expect(JSON.stringify(document)).toBe(snapshot);
    expect(validated.document).not.toBe(document);
    expect(
      validated.warnings.some(
        (warning) => warning.code === "ACTOR_INSIDE_BOUNDARY",
      ),
    ).toBe(true);
    expect(unwrap(validateDocument(JSON.stringify(document))).warnings).toEqual(
      validated.warnings,
    );
  });
});

describe("agentApi class", () => {
  it("crea, actualiza y borra clases y asociaciones", () => {
    const factory = deps();
    let document = unwrap(
      createDocument("class", { title: "Pedidos" }, factory),
    );
    document = unwrap(
      createElement(
        document,
        {
          kind: "class",
          name: "Pedido",
          attributes: ["id"],
          operations: ["confirmar()"],
        },
        factory,
      ),
    );
    document = unwrap(
      createElement(document, { kind: "class", name: "Cliente" }, factory),
    );

    const classes = document.elements.filter(
      (element) => element.kind === "class",
    );
    const order = classes[0];
    const customer = classes[1];
    if (order === undefined || customer === undefined) {
      throw new Error("Faltan las clases");
    }
    if (order.kind !== "class" || customer.kind !== "class") {
      throw new Error("El elemento no es una clase");
    }
    expect(order.geometry).toEqual(DEFAULT_CLASS_GEOMETRY);
    expect(order.attributes).toEqual(["id"]);
    expect(order.operations).toEqual(["confirmar()"]);

    const self = createRelationship(document, {
      kind: "class-association",
      sourceId: order.id,
      targetId: order.id,
    });
    expect(self.ok).toBe(false);
    if (!self.ok) {
      expect(self.error.code).toBe("SELF_RELATIONSHIP");
    }
    expect(document.relationships).toEqual([]);

    document = unwrap(
      createRelationship(
        document,
        {
          kind: "class-association",
          sourceId: order.id,
          targetId: customer.id,
          name: "tiene",
        },
        factory,
      ),
    );
    const association = document.relationships[0];
    if (association === undefined || association.kind !== "class-association") {
      throw new Error("Falta la asociación");
    }
    expect(association.sourceMultiplicity).toBe("1");
    expect(association.targetMultiplicity).toBe("1");

    document = unwrap(
      updateElement(
        document,
        { id: customer.id, operations: ["pagar()"] },
        factory,
      ),
    );
    document = unwrap(
      updateRelationship(
        document,
        {
          id: association.id,
          name: "realiza",
          sourceMultiplicity: "1",
          targetMultiplicity: "0..*",
        },
        factory,
      ),
    );
    const customerAfter = document.elements.find(
      (element) => element.id === customer.id,
    );
    const associationAfter = document.relationships[0];
    if (
      customerAfter === undefined ||
      customerAfter.kind !== "class" ||
      associationAfter === undefined ||
      associationAfter.kind !== "class-association"
    ) {
      throw new Error("Falta el resultado de la actualización");
    }
    expect(customerAfter.operations).toEqual(["pagar()"]);
    expect(associationAfter.name).toBe("realiza");
    expect(associationAfter.targetMultiplicity).toBe("0..*");

    document = unwrap(deleteElement(document, order.id, factory));
    expect(document.elements).toHaveLength(1);
    expect(document.relationships).toEqual([]);

    const loaded = unwrap(
      loadDocument(saveDocument(document, { x: 8, y: 4, zoom: 1 })),
    );
    expect(loaded.formatVersion).toBe(3);
    expect(loaded.document).toEqual(document);
    expect(loaded.view).toEqual({ x: 8, y: 4, zoom: 1 });
  });

  it("rechaza un elemento de otro metamodelo", () => {
    const document = unwrap(createDocument("class", {}, deps()));
    const rejected = createElement(document, {
      kind: "actor",
      name: "Usuario",
    });

    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("UNKNOWN_KIND");
    }
  });
});

describe("loadDocument", () => {
  it("migra un envelope formatVersion 2 a schema 3", () => {
    const document = unwrap(createDocument("use-case", {}, deps()));
    const raw = JSON.parse(saveDocument(document)) as {
      formatVersion: number;
      document: { schemaVersion: number };
    };
    raw.formatVersion = 2;
    raw.document.schemaVersion = 2;

    const loaded = unwrap(loadDocument(raw));

    expect(loaded.formatVersion).toBe(3);
    expect(loaded.document.schemaVersion).toBe(3);
    expect(loaded.document.kind).toBe("use-case");
    expect(loaded.document.elements).toEqual(document.elements);
  });

  it("rechaza JSON inválido y un kind desconocido sin lanzar", () => {
    const malformed = loadDocument("{");
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) {
      expect(malformed.error.code).toBe("UNKNOWN_KIND");
    }

    const document = unwrap(createDocument("sequence", {}, deps()));
    const raw = JSON.parse(saveDocument(document)) as {
      document: { kind: string };
    };
    raw.document.kind = "state-machine";
    const unknown = loadDocument(raw);
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error.code).toBe("UNKNOWN_KIND");
    }

    const element = createElement(document, { kind: "nota", name: "Nota" });
    expect(element.ok).toBe(false);
    if (!element.ok) {
      expect(element.error.code).toBe("UNKNOWN_KIND");
    }
  });

  it("rechaza un documento que no es JSON al validar", () => {
    const rejected = validateDocument("{");
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("UNKNOWN_KIND");
    }
  });
});
