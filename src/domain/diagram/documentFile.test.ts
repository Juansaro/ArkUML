import { describe, expect, it } from "vitest";
import {
  DOCUMENT_FILE_FORMAT,
  DOCUMENT_FILE_FORMAT_V1,
  DOCUMENT_FILE_FORMAT_VERSION,
  DOCUMENT_FILE_FORMAT_VERSION_V1,
  DOCUMENT_FILE_FORMAT_VERSION_V2,
  documentFileFilename,
  INVALID_DOCUMENT_FILE_MESSAGE,
  parseDocumentFile,
  parseDocumentFileText,
  serializeDocumentFile,
  toDocumentFile,
} from "./documentFile.ts";
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
import type {
  DiagramDocument,
  DiagramDocumentV1,
  DiagramDocumentV2,
  Viewport,
} from "./model.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");
const VIEW: Viewport = { x: 40, y: -12, zoom: 1.25 };

function toV2(document: DiagramDocument): DiagramDocumentV2 {
  return {
    schemaVersion: 2,
    id: document.id,
    kind: document.kind === "sequence" ? "sequence" : "use-case",
    metadata: document.metadata,
    elements: document.elements.filter(
      (element): element is DiagramDocumentV2["elements"][number] =>
        element.kind !== "class" &&
        element.kind !== "component" &&
        element.kind !== "node" &&
        element.kind !== "artifact",
    ),
    relationships: document.relationships.filter(
      (
        relationship,
      ): relationship is DiagramDocumentV2["relationships"][number] =>
        relationship.kind !== "class-association" &&
        relationship.kind !== "aggregation" &&
        relationship.kind !== "composition" &&
        relationship.kind !== "generalization" &&
        relationship.kind !== "component-usage" &&
        relationship.kind !== "assembly-connector" &&
        relationship.kind !== "communication-path" &&
        relationship.kind !== "deploy",
    ),
  };
}

function toV1(document: DiagramDocument): DiagramDocumentV1 {
  return {
    schemaVersion: 1,
    id: document.id,
    kind: "use-case",
    metadata: document.metadata,
    elements: document.elements.filter(
      (element): element is DiagramDocumentV1["elements"][number] =>
        element.kind !== "lifeline",
    ),
    relationships: document.relationships.filter(
      (
        relationship,
      ): relationship is DiagramDocumentV1["relationships"][number] =>
        relationship.kind === "association" ||
        relationship.kind === "include" ||
        relationship.kind === "extend",
    ),
  };
}

function legacyV1File(
  document: DiagramDocumentV1,
  view: Viewport,
): {
  format: typeof DOCUMENT_FILE_FORMAT_V1;
  formatVersion: typeof DOCUMENT_FILE_FORMAT_VERSION_V1;
  document: DiagramDocumentV1;
  view: Viewport;
} {
  return {
    format: DOCUMENT_FILE_FORMAT_V1,
    formatVersion: DOCUMENT_FILE_FORMAT_VERSION_V1,
    document,
    view,
  };
}

function sampleUseCaseDocument(): DiagramDocument {
  const createId = sequentialIds();
  const snapshot = createWorkspaceSnapshot({
    createId,
    now: () => FIXED_NOW,
  });
  const entry = snapshot.documents[0];
  if (entry === undefined) {
    throw new Error("El documento por defecto debe incluir un boundary");
  }
  const boundary = entry.document.elements[0];
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
    ...entry.document,
    elements: [...entry.document.elements, actor, useCase],
    relationships: [relationship],
  };
}

function sampleSequenceDocument(): DiagramDocument {
  const createId = sequentialIds(20);
  const document = createEmptySequenceDocument({
    createId,
    now: () => FIXED_NOW,
  });
  const client = createLifeline(
    {
      name: "Cliente",
      geometry: { x: 0, y: 0, width: 120, height: 40 },
    },
    { createId },
  );
  const server = createLifeline(
    {
      name: "Servidor",
      geometry: { x: 240, y: 0, width: 120, height: 40 },
    },
    { createId },
  );
  const message = createSequenceMessage(
    {
      kind: "sync-message",
      sourceId: client.id,
      targetId: server.id,
      name: "login",
      y: 80,
    },
    { createId },
  );
  return {
    ...document,
    elements: [client, server],
    relationships: [message],
  };
}

function expectRejected(input: unknown): void {
  const result = parseDocumentFile(input);
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.error.message).toBe(INVALID_DOCUMENT_FILE_MESSAGE);
}

describe("serializeDocumentFile / parseDocumentFile", () => {
  it("exporta el envelope 3.x de un use-case y hace round-trip", () => {
    const document = sampleUseCaseDocument();
    const json = serializeDocumentFile(document, VIEW);
    const parsedJson: unknown = JSON.parse(json);

    expect(parsedJson).toEqual({
      format: DOCUMENT_FILE_FORMAT,
      formatVersion: DOCUMENT_FILE_FORMAT_VERSION,
      document,
      view: VIEW,
    });
    expect(json).not.toMatch(/storageVersion|history|selection|"tool"/);
    expect(json).not.toMatch(/arkuml-usecase-json/);

    const parsed = parseDocumentFileText(json);
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(document, VIEW),
    });
  });

  it("exporta el envelope 3.x de un secuencia y hace round-trip", () => {
    const document = sampleSequenceDocument();
    const json = serializeDocumentFile(document, VIEW);
    const parsedJson: unknown = JSON.parse(json);

    expect(parsedJson).toEqual({
      format: DOCUMENT_FILE_FORMAT,
      formatVersion: DOCUMENT_FILE_FORMAT_VERSION,
      document,
      view: VIEW,
    });

    const parsed = parseDocumentFileText(json);
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(document, VIEW),
    });
  });

  it("migra un envelope 1.x arkuml-usecase-json a schema 3 y lo añade como 3.x", () => {
    const document = sampleUseCaseDocument();
    const v1 = toV1(document);
    const parsed = parseDocumentFile(legacyV1File(v1, VIEW));
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(document, VIEW),
    });
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.document.schemaVersion).toBe(3);
    expect(parsed.value.format).toBe(DOCUMENT_FILE_FORMAT);
  });

  it("migra un envelope 2.x a schema 3 y lo añade como 3.x", () => {
    const document = sampleUseCaseDocument();
    const parsed = parseDocumentFile({
      format: DOCUMENT_FILE_FORMAT,
      formatVersion: DOCUMENT_FILE_FORMAT_VERSION_V2,
      document: toV2(document),
      view: VIEW,
    });
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(document, VIEW),
    });
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.document.schemaVersion).toBe(3);
    expect(parsed.value.formatVersion).toBe(DOCUMENT_FILE_FORMAT_VERSION);
  });

  it("hace round-trip de un documento class en formatVersion 3", () => {
    const document = createEmptyClassDocument({
      createId: sequentialIds(40),
      now: () => FIXED_NOW,
    });
    const json = serializeDocumentFile(document, VIEW);
    const parsed = parseDocumentFileText(json);
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(document, VIEW),
    });
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.document.kind).toBe("class");
    expect(parsed.value.formatVersion).toBe(3);
  });

  it("hace round-trip de un documento component en formatVersion 3", () => {
    const document = createEmptyComponentDocument({
      createId: sequentialIds(50),
      now: () => FIXED_NOW,
    });
    const json = serializeDocumentFile(document, VIEW);
    const parsed = parseDocumentFileText(json);
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(document, VIEW),
    });
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.document.kind).toBe("component");
    expect(parsed.value.formatVersion).toBe(3);
  });

  it("hace round-trip de un documento deployment en formatVersion 3", () => {
    const document = createEmptyDeploymentDocument({
      createId: sequentialIds(60),
      now: () => FIXED_NOW,
    });
    const json = serializeDocumentFile(document, VIEW);
    const parsed = parseDocumentFileText(json);
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(document, VIEW),
    });
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.document.kind).toBe("deployment");
    expect(parsed.value.formatVersion).toBe(3);
  });

  it("acepta un envelope 3.x válido construido a mano", () => {
    const file = toDocumentFile(sampleUseCaseDocument(), VIEW);
    expect(parseDocumentFile(file)).toEqual({ ok: true, value: file });
  });
});

describe("rechazo del archivo de usuario", () => {
  it("rechaza JSON malformado sin dump de Zod", () => {
    const result = parseDocumentFileText("{not-json");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe(INVALID_DOCUMENT_FILE_MESSAGE);
  });

  it("rechaza un WorkspaceSnapshot interno", () => {
    expectRejected(createWorkspaceSnapshot());
  });

  it("rechaza format desconocido", () => {
    expectRejected({
      ...toDocumentFile(sampleUseCaseDocument(), VIEW),
      format: "application/json",
    });
  });

  it("rechaza formatVersion no soportado", () => {
    expectRejected({
      ...toDocumentFile(sampleUseCaseDocument(), VIEW),
      formatVersion: 4,
    });
    expectRejected({
      ...legacyV1File(toV1(sampleUseCaseDocument()), VIEW),
      formatVersion: 2,
    });
    expectRejected({
      ...toDocumentFile(sampleUseCaseDocument(), VIEW),
      format: DOCUMENT_FILE_FORMAT_V1,
    });
  });

  it("rechaza schemaVersion 1 dentro del envelope 3.x", () => {
    const document = sampleUseCaseDocument();
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: toV1(document),
    });
  });

  it("rechaza schemaVersion 2 dentro del envelope 1.x", () => {
    const document = sampleUseCaseDocument();
    expectRejected({
      ...legacyV1File(toV1(document), VIEW),
      document,
    });
  });

  it("rechaza claves de más en el envelope", () => {
    expectRejected({
      ...toDocumentFile(sampleUseCaseDocument(), VIEW),
      storageVersion: 2,
    });
  });

  it("rechaza claves de más en el documento", () => {
    const document = sampleUseCaseDocument();
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: { ...document, selected: true },
    });
  });

  it("rechaza un kind de documento desconocido", () => {
    const document = sampleUseCaseDocument();
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: { ...document, kind: "entity-relationship" },
    });
  });

  it("rechaza un kind de elemento desconocido", () => {
    const document = sampleUseCaseDocument();
    const [boundary, ...rest] = document.elements;
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: {
        ...document,
        elements: [boundary, { ...rest[0], kind: "note" }, ...rest.slice(1)],
      },
    });
  });

  it("rechaza un kind de relación desconocido", () => {
    const document = sampleUseCaseDocument();
    const [relationship] = document.relationships;
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: {
        ...document,
        relationships: [{ ...relationship, kind: "generalization" }],
      },
    });
  });

  it("rechaza mezcla de kinds en un use-case 3.x", () => {
    const document = sampleUseCaseDocument();
    const lifeline = createLifeline(
      { name: "Huésped" },
      { createId: sequentialIds(90) },
    );
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: {
        ...document,
        elements: [...document.elements, lifeline],
      },
    });
  });

  it("rechaza mezcla de kinds en un secuencia 3.x", () => {
    const document = sampleSequenceDocument();
    const actor = createActor(
      { name: "Usuario", geometry: { x: 8, y: 40, width: 48, height: 96 } },
      { createId: sequentialIds(90) },
    );
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: {
        ...document,
        elements: [...document.elements, actor],
      },
    });
  });

  it("rechaza secuencia en envelope arkuml-usecase-json", () => {
    const sequence = sampleSequenceDocument();
    expectRejected({
      format: DOCUMENT_FILE_FORMAT_V1,
      formatVersion: DOCUMENT_FILE_FORMAT_VERSION_V1,
      document: { ...sequence, schemaVersion: 1 },
      view: VIEW,
    });
    expectRejected({
      ...legacyV1File(toV1(sampleUseCaseDocument()), VIEW),
      document: {
        ...toV1(sampleUseCaseDocument()),
        kind: "sequence",
      },
    });
  });

  it("no incluye el dump de Zod en el mensaje", () => {
    const result = parseDocumentFile({ extra: true });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe(INVALID_DOCUMENT_FILE_MESSAGE);
    expect(result.error.message).not.toMatch(/unrecognized|Zod|Expected/i);
  });
});

describe("documentFileFilename", () => {
  it("usa el título saneado y el sufijo .arkuml.json", () => {
    expect(documentFileFilename("Diagrama de casos de uso")).toBe(
      "Diagrama de casos de uso.arkuml.json",
    );
    expect(documentFileFilename("Diagrama de secuencia")).toBe(
      "Diagrama de secuencia.arkuml.json",
    );
    expect(documentFileFilename('a/b<>:"|?*.x')).toBe("a b .x.arkuml.json");
  });

  it("usa diagrama.arkuml.json si el título queda vacío", () => {
    expect(documentFileFilename("   ")).toBe("diagrama.arkuml.json");
    expect(documentFileFilename("...")).toBe("diagrama.arkuml.json");
  });
});

describe("strictObject del envelope", () => {
  it("no admite historial ni selección en el archivo", () => {
    expectRejected({
      ...toDocumentFile(sampleUseCaseDocument(), VIEW),
      history: [],
      selection: [],
      tool: "select",
    });
  });

  it("el payload del documento exportado es schema 3", () => {
    const document = sampleUseCaseDocument();
    const file = toDocumentFile(document, VIEW);
    expect(file.document.schemaVersion).toBe(3);
    expect(file.document.kind).toBe("use-case");
    expect(file.format).toBe(DOCUMENT_FILE_FORMAT);
    expect(file.formatVersion).toBe(DOCUMENT_FILE_FORMAT_VERSION);
    expect(file.document.elements.length).toBeGreaterThan(0);
  });
});

describe("geometría del documento importado", () => {
  it("rechaza geometría no finita", () => {
    const document = structuredClone(sampleUseCaseDocument());
    const boundary = document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    boundary.geometry.x = Number.POSITIVE_INFINITY;
    expectRejected(toDocumentFile(document, VIEW));
  });

  it("rechaza claves extra en geometría", () => {
    const document = sampleUseCaseDocument();
    expectRejected({
      ...toDocumentFile(document, VIEW),
      document: {
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
      },
    });
  });
});
