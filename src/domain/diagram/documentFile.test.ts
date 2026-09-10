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
import type { DiagramDocument, Viewport, WorkspaceSnapshot } from "./model.ts";

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
    const snapshot = sampleSnapshot();
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
    const snapshot = sampleSnapshot();
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
    expectRejected(sampleSnapshot());
  });

  it("rechaza format distinto de arkuml-usecase-json", () => {
    const snapshot = sampleSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      format: "application/json",
    });
  });

  it("rechaza formatVersion distinto de 1", () => {
    const snapshot = sampleSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      formatVersion: 2,
    });
  });

  it("rechaza schemaVersion distinto de 1", () => {
    const snapshot = sampleSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: { ...snapshot.document, schemaVersion: 2 },
    });
  });

  it("rechaza claves de más en el envelope", () => {
    const snapshot = sampleSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      storageVersion: 1,
    });
  });

  it("rechaza claves de más en el documento", () => {
    const snapshot = sampleSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: { ...snapshot.document, selected: true },
    });
  });

  it("rechaza un kind de documento desconocido", () => {
    const snapshot = sampleSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      document: { ...snapshot.document, kind: "class" },
    });
  });

  it("rechaza un kind de elemento desconocido", () => {
    const snapshot = sampleSnapshot();
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
    const snapshot = sampleSnapshot();
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
    const snapshot = sampleSnapshot();
    expectRejected({
      ...toDocumentFile(snapshot.document, snapshot.view),
      history: [],
      selection: [],
      tool: "select",
    });
  });

  it("el payload del documento sigue siendo schema 1", () => {
    const snapshot = sampleSnapshot();
    const file = toDocumentFile(snapshot.document, VIEW);
    expect(file.document.schemaVersion).toBe(1);
    expect(file.document.kind).toBe("use-case");
    const asDocument: DiagramDocument = file.document;
    expect(asDocument.elements.length).toBeGreaterThan(0);
  });
});

describe("geometría del documento importado", () => {
  it("rechaza geometría no finita", () => {
    const snapshot = structuredClone(sampleSnapshot());
    const boundary = snapshot.document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    boundary.geometry.x = Number.POSITIVE_INFINITY;
    expectRejected(toDocumentFile(snapshot.document, snapshot.view));
  });

  it("rechaza claves extra en geometría", () => {
    const snapshot = sampleSnapshot();
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
