import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  createEmptySequenceDocument,
  createWorkspaceSnapshot,
  type IdFactory,
} from "../domain/diagram/factories.ts";
import type { DiagramDocumentV1, Viewport } from "../domain/diagram/model.ts";
import { migrateWorkspace } from "./migrateWorkspace.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");
const VIEW: Viewport = { x: 12, y: 24, zoom: 1.5 };

function expectOk<T>(
  result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function toV1Document(
  document: ReturnType<typeof createDiagramDocument>,
): DiagramDocumentV1 {
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

describe("migrateWorkspace", () => {
  it("acepta un snapshot v2 sin reescribirlo", () => {
    const snapshot = createWorkspaceSnapshot({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const result = expectOk(migrateWorkspace(snapshot));
    expect(result.migratedFromV1).toBe(false);
    expect(result.snapshot).toEqual(snapshot);
  });

  it("envuelve un workspace v1 y sube el documento schema 1", () => {
    const createId = sequentialIds();
    const document = createDiagramDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const v1 = {
      storageVersion: 1 as const,
      document: toV1Document(document),
      view: VIEW,
    };

    const result = expectOk(migrateWorkspace(v1));
    expect(result.migratedFromV1).toBe(true);
    expect(result.snapshot.storageVersion).toBe(2);
    expect(result.snapshot.activeDocumentId).toBe(document.id);
    expect(result.snapshot.documents).toEqual([
      {
        document: { ...document, schemaVersion: 3 },
        view: VIEW,
      },
    ]);
  });

  it("envuelve un workspace v1 cuyo documento ya es schema 3", () => {
    const document = createDiagramDocument({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const v1 = {
      storageVersion: 1 as const,
      document,
      view: VIEW,
    };

    const result = expectOk(migrateWorkspace(v1));
    expect(result.migratedFromV1).toBe(true);
    expect(result.snapshot.documents).toEqual([{ document, view: VIEW }]);
  });

  it("rechaza una biblioteca vacía", () => {
    const snapshot = createWorkspaceSnapshot({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const result = migrateWorkspace({ ...snapshot, documents: [] });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected parse error");
    }
    expect(result.error.code).toBe("PARSE_INVALID");
    expect(result.error.message).toMatch(/vacía/i);
  });

  it("rechaza un activeDocumentId huérfano", () => {
    const snapshot = createWorkspaceSnapshot({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const result = migrateWorkspace({
      ...snapshot,
      activeDocumentId: "00000000-0000-4000-8000-ffffffffffff",
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected parse error");
    }
    expect(result.error.code).toBe("PARSE_INVALID");
  });

  it("rechaza storageVersion desconocido", () => {
    const result = migrateWorkspace({ storageVersion: 3 });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected parse error");
    }
    expect(result.error.code).toBe("PARSE_INVALID");
    expect(result.error.message).toMatch(/no soportado/i);
  });

  it("envuelve un envelope de un documento etiquetado como storageVersion 2", () => {
    const document = createDiagramDocument({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const mislabeled = {
      storageVersion: 2 as const,
      document,
      view: VIEW,
    };

    const result = expectOk(migrateWorkspace(mislabeled));
    expect(result.migratedFromV1).toBe(true);
    expect(result.snapshot.storageVersion).toBe(2);
    expect(result.snapshot.activeDocumentId).toBe(document.id);
    expect(result.snapshot.documents).toEqual([{ document, view: VIEW }]);
  });

  it("puede incluir un documento de secuencia junto a uno de casos de uso", () => {
    const createId = sequentialIds();
    const useCase = createDiagramDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const sequence = createEmptySequenceDocument({
      createId,
      now: () => FIXED_NOW,
    });
    const snapshot = {
      storageVersion: 2 as const,
      activeDocumentId: sequence.id,
      documents: [
        { document: useCase, view: VIEW },
        { document: sequence, view: { x: 0, y: 0, zoom: 1 } },
      ],
    };
    const result = expectOk(migrateWorkspace(snapshot));
    expect(result.migratedFromV1).toBe(false);
    expect(result.snapshot).toEqual(snapshot);
  });

  it("sube documentos schema 2 de una biblioteca storageVersion 2 a schema 3", () => {
    const snapshot = createWorkspaceSnapshot({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });
    const entry = snapshot.documents[0];
    if (entry === undefined) {
      throw new Error("Falta la entrada");
    }
    const v2 = {
      ...snapshot,
      documents: [
        {
          document: { ...entry.document, schemaVersion: 2 as const },
          view: entry.view,
        },
      ],
    };
    const result = expectOk(migrateWorkspace(v2));
    expect(result.migratedFromV1).toBe(false);
    expect(result.snapshot.documents[0]?.document.schemaVersion).toBe(3);
    expect(result.snapshot.documents[0]?.document.elements).toEqual(
      entry.document.elements,
    );
  });
});
