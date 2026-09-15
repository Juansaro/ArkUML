import { describe, expect, it } from "vitest";
import {
  DOCUMENT_FILE_FORMAT,
  DOCUMENT_FILE_FORMAT_VERSION,
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
  createRelationship,
  createUseCase,
  createWorkspaceSnapshot,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, DiagramDocumentV1, Viewport } from "./model.ts";

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

function sampleFileSnapshot(): {
  document: DiagramDocumentV1;
  view: Viewport;
} {
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

  const document = toV1({
    ...entry.document,
    elements: [...entry.document.elements, actor, useCase],
    relationships: [relationship],
  });

  return {
    document,
    view: VIEW,
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
  it("exporta el envelope público y hace round-trip", () => {
    const snapshot = sampleFileSnapshot();
    const json = serializeDocumentFile(snapshot.document, snapshot.view);
    const parsedJson: unknown = JSON.parse(json);

    expect(parsedJson).toEqual({
      format: DOCUMENT_FILE_FORMAT,
      formatVersion: DOCUMENT_FILE_FORMAT_VERSION,
      document: snapshot.document,
      view: VIEW,
    });
    expect(json).not.toMatch(/storageVersion|history|selection|"tool"/);

    const parsed = parseDocumentFileText(json);
    expect(parsed).toEqual({
      ok: true,
      value: toDocumentFile(snapshot.document, snapshot.view),
    });
  });

  it("acepta un envelope válido construido a mano", () => {
    const snapshot = sampleFileSnapshot();
    const file = toDocumentFile(snapshot.document, snapshot.view);
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

  it("rechaza format distinto de arkuml-usecase-json", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      format: "application/json",
    });
  });

  it("rechaza formatVersion distinto de 1", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      formatVersion: 2,
    });
  });

  it("rechaza schemaVersion distinto de 1", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: { ...snapshot.document, schemaVersion: 2 },
    });
  });

  it("rechaza claves de más en el envelope", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      storageVersion: 1,
    });
  });

  it("rechaza claves de más en el documento", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: { ...snapshot.document, selected: true },
    });
  });

  it("rechaza un kind de documento desconocido", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: { ...snapshot.document, kind: "class" },
    });
  });

  it("rechaza un kind de elemento desconocido", () => {
    const snapshot = sampleFileSnapshot();
    const [boundary, ...rest] = snapshot.document.elements;
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: {
        ...snapshot.document,
        elements: [boundary, { ...rest[0], kind: "note" }, ...rest.slice(1)],
      },
    });
  });

  it("rechaza un kind de relación desconocido", () => {
    const snapshot = sampleFileSnapshot();
    const [relationship] = snapshot.document.relationships;
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: {
        ...snapshot.document,
        relationships: [{ ...relationship, kind: "generalization" }],
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
    expect(documentFileFilename('a/b<>:"|?*.x')).toBe("a b .x.arkuml.json");
  });

  it("usa diagrama.arkuml.json si el título queda vacío", () => {
    expect(documentFileFilename("   ")).toBe("diagrama.arkuml.json");
    expect(documentFileFilename("...")).toBe("diagrama.arkuml.json");
  });
});

describe("strictObject del envelope", () => {
  it("no admite historial ni selección en el archivo", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      history: [],
      selection: [],
      tool: "select",
    });
  });

  it("el payload del documento sigue siendo schema 1", () => {
    const snapshot = sampleFileSnapshot();
    const file = toDocumentFile(snapshot.document, VIEW);
    expect(file.document.schemaVersion).toBe(1);
    expect(file.document.kind).toBe("use-case");
    const asDocument: DiagramDocumentV1 = file.document;
    expect(asDocument.elements.length).toBeGreaterThan(0);
  });
});

describe("geometría del documento importado", () => {
  it("rechaza geometría no finita", () => {
    const snapshot = structuredClone(sampleFileSnapshot());
    const boundary = snapshot.document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    boundary.geometry.x = Number.POSITIVE_INFINITY;
    expectRejected(toDocumentFile(snapshot.document, snapshot.view));
  });

  it("rechaza claves extra en geometría", () => {
    const snapshot = sampleFileSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
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
    });
  });
});
