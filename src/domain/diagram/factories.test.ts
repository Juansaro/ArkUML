import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOUNDARY_GEOMETRY,
  DEFAULT_BOUNDARY_NAME,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_VIEWPORT,
} from "./defaults.ts";
import {
  createActor,
  createDiagramDocument,
  createRelationship,
  createSystemBoundary,
  createUseCase,
  createUuid,
  createWorkspaceSnapshot,
  type IdFactory,
} from "./factories.ts";

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

const FIXED_NOW = new Date("2026-09-07T12:00:00.000Z");

describe("createWorkspaceSnapshot", () => {
  it("crea un snapshot v1 con boundary Sistema, ids y timestamps", () => {
    const createId = sequentialIds();
    const snapshot = createWorkspaceSnapshot({
      createId,
      now: () => FIXED_NOW,
    });

    expect(snapshot.storageVersion).toBe(1);
    expect(snapshot.document.schemaVersion).toBe(1);
    expect(snapshot.document.kind).toBe("use-case");
    expect(snapshot.document.id).toBe("00000000-0000-4000-8000-000000000001");
    expect(snapshot.document.metadata).toEqual({
      title: DEFAULT_DOCUMENT_TITLE,
      createdAt: "2026-09-07T12:00:00.000Z",
      updatedAt: "2026-09-07T12:00:00.000Z",
    });
    expect(snapshot.document.relationships).toEqual([]);
    expect(snapshot.document.elements).toEqual([
      {
        id: "00000000-0000-4000-8000-000000000002",
        kind: "system-boundary",
        name: DEFAULT_BOUNDARY_NAME,
        geometry: DEFAULT_BOUNDARY_GEOMETRY,
      },
    ]);
    expect(snapshot.view).toEqual(DEFAULT_VIEWPORT);
  });

  it("no incluye selección, historial ni herramienta", () => {
    const snapshot = createWorkspaceSnapshot({
      createId: sequentialIds(),
      now: () => FIXED_NOW,
    });

    expect(Object.keys(snapshot).sort()).toEqual([
      "document",
      "storageVersion",
      "view",
    ]);
    expect(snapshot).not.toHaveProperty("selection");
    expect(snapshot).not.toHaveProperty("history");
    expect(snapshot).not.toHaveProperty("tool");
  });

  it("genera UUID v4 y timestamps ISO sin dependencias inyectadas", () => {
    const snapshot = createWorkspaceSnapshot();
    const boundary = snapshot.document.elements[0];

    expect(snapshot.document.id).toMatch(UUID_V4);
    expect(boundary?.id).toMatch(UUID_V4);
    expect(boundary?.id).not.toBe(snapshot.document.id);
    expect(snapshot.document.metadata.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(createUuid()).toMatch(UUID_V4);
  });
});

describe("element factories", () => {
  it("crea actor, caso de uso, boundary y relación con ids inyectados", () => {
    const createId = sequentialIds();
    const actor = createActor(
      { name: "  Usuario ", geometry: { x: 1, y: 2, width: 3, height: 4 } },
      { createId },
    );
    const boundary = createSystemBoundary(
      { name: "Sistema", geometry: DEFAULT_BOUNDARY_GEOMETRY },
      { createId },
    );
    const useCase = createUseCase(
      {
        name: "Login",
        geometry: { x: 10, y: 20, width: 120, height: 60 },
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

    expect(actor).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      kind: "actor",
      name: "Usuario",
      geometry: { x: 1, y: 2, width: 3, height: 4 },
    });
    expect(actor).not.toHaveProperty("parentId");
    expect(useCase.parentId).toBe(boundary.id);
    expect(relationship.kind).toBe("association");
    expect(createDiagramDocument({ createId }).kind).toBe("use-case");
  });
});
