import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { DiagramDocument, Geometry } from "../../domain/diagram/model.ts";
import {
  createElement,
  createRelationship,
  moveElements,
} from "../../domain/diagram/operations.ts";
import { createPerformanceDocument } from "../../test/performanceFixture.ts";
import { mapDocumentToReactFlow } from "./reactFlowMapper.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 48, height: 96 };
const USE_CASE_GEOMETRY: Geometry = { x: 80, y: 80, width: 160, height: 80 };

function createDocument(): DiagramDocument {
  return createDiagramDocument({
    createId: sequentialIds(),
    now: () => CREATED_AT,
  });
}

function expectOk<T>(
  result: { ok: true; value: T } | { ok: false; error: { message: string } },
): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

function boundaryOf(document: DiagramDocument) {
  const boundary = document.elements.find(
    (element) => element.kind === "system-boundary",
  );
  if (boundary === undefined) {
    throw new Error("Falta el boundary");
  }
  return boundary;
}

describe("mapDocumentToReactFlow", () => {
  it("es determinista y pinta el boundary default", () => {
    const document = createDocument();
    const first = mapDocumentToReactFlow(document);
    const second = mapDocumentToReactFlow(document);

    expect(first).toEqual(second);
    expect(first.nodes).toHaveLength(1);
    expect(first.edges).toEqual([]);
    expect(first.nodes[0]).toMatchObject({
      id: boundaryOf(document).id,
      type: "system-boundary",
      position: { x: 0, y: 0 },
      width: 640,
      height: 400,
      data: { kind: "system-boundary", name: "Sistema" },
      selected: false,
      ariaLabel: "Límite del sistema Sistema",
      style: {
        width: 640,
        height: 400,
        overflow: "visible",
      },
    });
    expect(first.nodes[0]).not.toHaveProperty("measured");
    expect(first.nodes[0]).not.toHaveProperty("parentId");
  });

  it("coloca el boundary antes que sus hijos aunque el documento los liste al revés", () => {
    const empty = createDocument();
    const boundary = boundaryOf(empty);
    const withChild = expectOk(
      createElement(
        empty,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundary.id,
        },
        { createId: sequentialIds(10), now: () => CREATED_AT },
      ),
    );
    const reversed: DiagramDocument = {
      ...withChild,
      elements: [...withChild.elements].reverse(),
    };
    expect(reversed.elements[0]?.kind).toBe("use-case");

    const { nodes } = mapDocumentToReactFlow(reversed);
    expect(nodes.map((node) => node.type)).toEqual([
      "system-boundary",
      "use-case",
    ]);
    expect(nodes[1]).toMatchObject({
      parentId: boundary.id,
      position: { x: USE_CASE_GEOMETRY.x, y: USE_CASE_GEOMETRY.y },
      data: { kind: "use-case", name: "Login" },
    });
  });

  it("proyecta selección, anchors a handles y tipos de edge", () => {
    const empty = createDocument();
    const boundary = boundaryOf(empty);
    const deps = { createId: sequentialIds(20), now: () => CREATED_AT };
    const withActor = expectOk(
      createElement(
        empty,
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
        deps,
      ),
    );
    const withLogin = expectOk(
      createElement(
        withActor,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundary.id,
        },
        deps,
      ),
    );
    const withLogout = expectOk(
      createElement(
        withLogin,
        {
          kind: "use-case",
          name: "Logout",
          geometry: { ...USE_CASE_GEOMETRY, y: 200 },
          parentId: boundary.id,
        },
        deps,
      ),
    );
    const actor = withLogout.elements.find(
      (element) => element.kind === "actor",
    );
    const login = withLogout.elements.find(
      (element) => element.kind === "use-case" && element.name === "Login",
    );
    const logout = withLogout.elements.find(
      (element) => element.kind === "use-case" && element.name === "Logout",
    );
    if (actor === undefined || login === undefined || logout === undefined) {
      throw new Error("Faltan actor o casos de uso");
    }

    const withAssociation = expectOk(
      createRelationship(
        withLogout,
        {
          kind: "association",
          sourceId: actor.id,
          targetId: login.id,
          sourceAnchor: "right",
          targetAnchor: "left",
        },
        deps,
      ),
    );
    const withInclude = expectOk(
      createRelationship(
        withAssociation,
        {
          kind: "include",
          sourceId: login.id,
          targetId: logout.id,
          sourceAnchor: "bottom",
          targetAnchor: "top",
        },
        deps,
      ),
    );
    const withExtend = expectOk(
      createRelationship(
        withInclude,
        {
          kind: "extend",
          sourceId: logout.id,
          targetId: login.id,
          sourceAnchor: "left",
          targetAnchor: "right",
        },
        deps,
      ),
    );

    const association = withExtend.relationships.find(
      (relationship) => relationship.kind === "association",
    );
    if (association === undefined) {
      throw new Error("Falta la asociación");
    }

    const { nodes, edges } = mapDocumentToReactFlow(withExtend, {
      elementIds: [actor.id],
      relationshipIds: [association.id],
    });

    const actorNode = nodes.find((node) => node.id === actor.id);
    expect(actorNode?.selected).toBe(true);
    expect(actorNode?.ariaLabel).toBe("Actor Usuario, seleccionado");
    expect(nodes.filter((node) => node.selected)).toHaveLength(1);

    expect(edges).toHaveLength(3);
    expect(edges.map((edge) => edge.type)).toEqual([
      "association",
      "include",
      "extend",
    ]);
    expect(edges[0]).toMatchObject({
      id: association.id,
      type: "association",
      source: actor.id,
      target: login.id,
      sourceHandle: "right",
      targetHandle: "left",
      className: "diagram-edge diagram-edge-association",
      data: { kind: "association" },
      selected: true,
      ariaLabel: `Asociación entre ${actor.name} y ${login.name}, seleccionada`,
    });
    expect(edges[1]).toMatchObject({
      type: "include",
      sourceHandle: "bottom",
      targetHandle: "top",
      selected: false,
    });
    expect(edges[2]).toMatchObject({
      type: "extend",
      sourceHandle: "left",
      targetHandle: "right",
      selected: false,
    });
  });

  it("reutiliza nodos y edges no afectados al mover o seleccionar", () => {
    const empty = createDocument();
    const boundary = boundaryOf(empty);
    const deps = { createId: sequentialIds(30), now: () => CREATED_AT };
    const withActor = expectOk(
      createElement(
        empty,
        { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
        deps,
      ),
    );
    const withUseCase = expectOk(
      createElement(
        withActor,
        {
          kind: "use-case",
          name: "Login",
          geometry: USE_CASE_GEOMETRY,
          parentId: boundary.id,
        },
        deps,
      ),
    );
    const actor = withUseCase.elements.find(
      (element) => element.kind === "actor",
    );
    const login = withUseCase.elements.find(
      (element) => element.kind === "use-case",
    );
    if (actor === undefined || login === undefined) {
      throw new Error("Faltan actor o caso de uso");
    }
    const document = expectOk(
      createRelationship(
        withUseCase,
        {
          kind: "association",
          sourceId: actor.id,
          targetId: login.id,
          sourceAnchor: "right",
          targetAnchor: "left",
        },
        deps,
      ),
    );

    const baseline = mapDocumentToReactFlow(document);
    const selected = mapDocumentToReactFlow(document, {
      elementIds: [actor.id],
      relationshipIds: [],
    });
    const actorNode = baseline.nodes.find((node) => node.id === actor.id);
    const loginNode = baseline.nodes.find((node) => node.id === login.id);
    const selectedActor = selected.nodes.find((node) => node.id === actor.id);
    const selectedLogin = selected.nodes.find((node) => node.id === login.id);

    expect(selectedLogin).toBe(loginNode);
    expect(selectedActor).not.toBe(actorNode);
    expect(selectedActor?.selected).toBe(true);
    expect(selectedActor?.ariaLabel).toBe("Actor Usuario, seleccionado");

    const moved = expectOk(
      moveElements(document, [{ id: actor.id, x: 12, y: 24 }], deps),
    );
    const afterMove = mapDocumentToReactFlow(moved);
    expect(afterMove.nodes.find((node) => node.id === login.id)).toBe(
      loginNode,
    );
    expect(afterMove.nodes.find((node) => node.id === actor.id)).not.toBe(
      actorNode,
    );
    expect(afterMove.edges[0]).toBe(baseline.edges[0]);
  });

  it("proyecta el escenario 100/150 con índices O(n)", () => {
    const document = createPerformanceDocument("target");
    const projection = mapDocumentToReactFlow(document);
    expect(projection.nodes).toHaveLength(100);
    expect(projection.edges).toHaveLength(150);
    expect(projection.nodes.some((node) => node.selected)).toBe(false);
  });
});
