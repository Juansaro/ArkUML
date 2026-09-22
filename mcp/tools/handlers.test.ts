import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createSession,
  handleCreateElement,
  handleCreateRelationship,
  handleCreateDocument,
  handleDeleteElement,
  handleDeleteRelationship,
  handleDescribeRules,
  handleListElements,
  handleLoadDocument,
  handleSaveDocument,
  handleUpdateElement,
  handleValidateDocument,
} from "./handlers.ts";
import { kindResource, kindsResource } from "../resources/catalog.ts";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { force: true, recursive: true })),
  );
});

describe("MCP reading and session handlers", () => {
  it("exposes the kind catalog resources", () => {
    expect(kindsResource().text).toContain('"kind":"use-case"');
    const activity = kindResource("activity");
    expect(activity?.uri).toBe("arkuml://kind/activity");
    expect(activity?.text.includes("control-flow")).toBe(true);
    expect(kindResource("state-machine")).toBeUndefined();
  });

  it("creates, validates and lists the active document without mutation", async () => {
    const session = createSession();
    const created = handleCreateDocument(session, {
      kind: "class",
      title: "Pedidos",
    });
    if (!created.ok) {
      throw new Error(created.error.message);
    }
    const snapshot = JSON.stringify(created.value);

    const validated = await handleValidateDocument(session, {});
    const listed = await handleListElements(session, {});
    const rules = handleDescribeRules(session, {});

    expect(validated.ok).toBe(true);
    expect(listed).toMatchObject({
      ok: true,
      value: { kind: "class", title: "Pedidos", elements: [] },
    });
    expect(rules).toMatchObject({ ok: true, value: { kind: "class" } });
    expect(JSON.stringify(session.document)).toBe(snapshot);
  });

  it("saves and loads a schema 3 envelope through the session", async () => {
    const directory = await mkdtemp(join(tmpdir(), "arkuml-mcp-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "orders.arkuml.json");
    const writer = createSession();
    const created = handleCreateDocument(writer, {
      kind: "component",
      title: "Pedidos",
    });
    if (!created.ok) {
      throw new Error(created.error.message);
    }

    expect(await handleSaveDocument(writer, { path })).toEqual({
      ok: true,
      value: { path },
    });
    const saved = await readFile(path, "utf8");
    expect(saved).toContain('"format":"arkuml-document-json"');
    expect(saved).toContain('"formatVersion":3');

    const reader = createSession();
    expect(await handleLoadDocument(reader, { path })).toMatchObject({
      ok: true,
      value: { kind: "component" },
    });
    expect(await handleListElements(reader, { path })).toMatchObject({
      ok: true,
      value: { kind: "component", title: "Pedidos" },
    });
  });

  it("returns structured failures when a document is unavailable", async () => {
    const session = createSession();
    expect(await handleValidateDocument(session, {})).toMatchObject({
      ok: false,
      error: { code: "NO_ACTIVE_DOCUMENT" },
    });
    expect(
      await handleLoadDocument(session, { path: "does-not-exist.arkuml.json" }),
    ).toMatchObject({ ok: false, error: { code: "FILE_READ_FAILED" } });
  });

  it("mutates a use-case document through the domain facade", () => {
    const session = createSession();
    expect(handleCreateDocument(session, { kind: "use-case" }).ok).toBe(true);

    const actor = handleCreateElement(session, {
      kind: "actor",
      name: "Cliente",
    });
    const useCase = handleCreateElement(session, {
      kind: "use-case",
      name: "Comprar",
      geometry: { x: 240, y: 40 },
    });
    if (!actor.ok || !useCase.ok) {
      throw new Error("No se pudieron crear los elementos de prueba.");
    }

    const actorId = actor.value.elements.at(-1)?.id;
    const useCaseId = useCase.value.elements.at(-1)?.id;
    if (actorId === undefined || useCaseId === undefined) {
      throw new Error("Falta un id de elemento de prueba.");
    }
    expect(
      handleCreateRelationship(session, {
        kind: "association",
        sourceId: useCaseId,
        targetId: actorId,
      }),
    ).toMatchObject({
      ok: true,
      value: {
        relationships: [
          { kind: "association", sourceId: actorId, targetId: useCaseId },
        ],
      },
    });
    const updated = handleUpdateElement(session, {
      id: actorId,
      name: "Comprador",
    });
    expect(updated.ok).toBe(true);
    expect(
      session.document?.elements.find((element) => element.id === actorId),
    ).toMatchObject({ name: "Comprador" });
    const relationshipId = session.document?.relationships[0]?.id;
    if (relationshipId === undefined) {
      throw new Error("Falta una relación de prueba.");
    }
    expect(
      handleDeleteRelationship(session, { id: relationshipId }),
    ).toMatchObject({ ok: true, value: { relationships: [] } });
  });

  it("returns the domain error for an illegal connection without mutating", () => {
    const session = createSession();
    const created = handleCreateDocument(session, { kind: "use-case" });
    if (!created.ok) {
      throw new Error(created.error.message);
    }
    const first = handleCreateElement(session, { kind: "actor", name: "A" });
    const second = handleCreateElement(session, { kind: "actor", name: "B" });
    if (!first.ok || !second.ok) {
      throw new Error("No se pudieron crear los actores de prueba.");
    }
    const firstId = first.value.elements.at(-1)?.id;
    const secondId = second.value.elements.at(-1)?.id;
    if (firstId === undefined || secondId === undefined) {
      throw new Error("Falta un id de actor de prueba.");
    }
    const before = JSON.stringify(session.document);

    expect(
      handleCreateRelationship(session, {
        kind: "include",
        sourceId: firstId,
        targetId: secondId,
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_CONNECTION" } });
    expect(JSON.stringify(session.document)).toBe(before);
  });

  it("deletes incident relationships and preserves the graph through save/load", async () => {
    const directory = await mkdtemp(join(tmpdir(), "arkuml-mcp-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "class.arkuml.json");
    const writer = createSession();
    handleCreateDocument(writer, { kind: "class" });
    const first = handleCreateElement(writer, { kind: "class", name: "Order" });
    const second = handleCreateElement(writer, { kind: "class", name: "Line" });
    if (!first.ok || !second.ok) {
      throw new Error("No se pudieron crear las clases de prueba.");
    }
    const firstId = first.value.elements.at(-1)?.id;
    const secondId = second.value.elements.at(-1)?.id;
    if (firstId === undefined || secondId === undefined) {
      throw new Error("Falta un id de clase de prueba.");
    }
    expect(
      handleCreateRelationship(writer, {
        kind: "class-association",
        sourceId: firstId,
        targetId: secondId,
      }),
    ).toMatchObject({ ok: true });
    expect(handleDeleteElement(writer, { id: firstId })).toMatchObject({
      ok: true,
      value: { elements: [{ id: secondId }], relationships: [] },
    });

    expect(await handleSaveDocument(writer, { path })).toMatchObject({
      ok: true,
    });
    const reader = createSession();
    expect(await handleLoadDocument(reader, { path })).toMatchObject({
      ok: true,
      value: { elements: [{ id: secondId }], relationships: [] },
    });
  });
});
