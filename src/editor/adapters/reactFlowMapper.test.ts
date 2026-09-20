import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  createEmptyClassDocument,
  createEmptyComponentDocument,
  createEmptyDeploymentDocument,
  createEmptyErDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { DiagramDocument, Geometry } from "../../domain/diagram/model.ts";
import {
  createArtifact,
  createAttribute,
  createClass,
  createComponent,
  createElement,
  createEntity,
  createErRelationship,
  createLifeline,
  createNode,
  createRelationship,
  moveElements,
  setClassMembers,
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

  it("proyecta lifelines con stem y mensajes horizontales sin anclas", () => {
    const deps = { createId: sequentialIds(80), now: () => CREATED_AT };
    const empty = createEmptySequenceDocument(deps);
    const withA = expectOk(
      createLifeline(
        empty,
        { name: "A", geometry: { x: 0, y: 0, width: 120, height: 40 } },
        deps,
      ),
    );
    const withB = expectOk(
      createLifeline(
        withA,
        { name: "B", geometry: { x: 240, y: 0, width: 120, height: 40 } },
        deps,
      ),
    );
    const a = withB.elements[0];
    const b = withB.elements[1];
    if (a === undefined || b === undefined) {
      throw new Error("Faltan lifelines");
    }
    const withSync = expectOk(
      createRelationship(
        withB,
        {
          kind: "sync-message",
          sourceId: a.id,
          targetId: b.id,
          name: "ping()",
          y: 80,
        },
        deps,
      ),
    );
    const withReply = expectOk(
      createRelationship(
        withSync,
        {
          kind: "reply-message",
          sourceId: a.id,
          targetId: a.id,
          y: 120,
        },
        deps,
      ),
    );

    const { nodes, edges } = mapDocumentToReactFlow(withReply, {
      elementIds: [a.id],
      relationshipIds: [withReply.relationships[0]?.id ?? ""],
    });

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({
      type: "lifeline",
      width: 120,
      height: 320,
      data: { kind: "lifeline", name: "A", stemLength: 280 },
      selected: true,
    });
    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({
      type: "sync-message",
      sourceHandle: "stem",
      targetHandle: "stem",
      reconnectable: false,
      data: { kind: "sync-message", name: "ping()", y: 80 },
      selected: true,
    });
    expect(edges[1]).toMatchObject({
      type: "reply-message",
      source: a.id,
      target: a.id,
      data: { kind: "reply-message", name: "", y: 120 },
    });
  });

  it("proyecta clases con compartimentos y relaciones con multiplicidad", () => {
    const deps = { createId: sequentialIds(90), now: () => CREATED_AT };
    const empty = createEmptyClassDocument(deps);
    const withPedido = expectOk(
      createClass(empty, { name: "Pedido", geometry: { x: 0, y: 0, width: 180, height: 96 } }, deps),
    );
    const withCliente = expectOk(
      createClass(
        withPedido,
        { name: "Cliente", geometry: { x: 280, y: 0, width: 180, height: 96 } },
        deps,
      ),
    );
    const pedido = withCliente.elements[0];
    const cliente = withCliente.elements[1];
    if (pedido === undefined || cliente === undefined) {
      throw new Error("Faltan clases");
    }
    const withMembers = expectOk(
      setClassMembers(
        withCliente,
        { id: pedido.id, attributes: ["id: UUID"], operations: ["total()"] },
        deps,
      ),
    );
    const withAssoc = expectOk(
      createRelationship(
        withMembers,
        {
          kind: "class-association",
          sourceId: pedido.id,
          targetId: cliente.id,
        },
        deps,
      ),
    );
    const withGen = expectOk(
      createRelationship(
        withAssoc,
        {
          kind: "generalization",
          sourceId: pedido.id,
          targetId: cliente.id,
        },
        deps,
      ),
    );

    const { nodes, edges } = mapDocumentToReactFlow(withGen, {
      elementIds: [pedido.id],
      relationshipIds: [withGen.relationships[0]?.id ?? ""],
    });

    expect(nodes[0]).toMatchObject({
      type: "class",
      width: 180,
      height: 96,
      data: {
        kind: "class",
        name: "Pedido",
        attributes: ["id: UUID"],
        operations: ["total()"],
      },
      selected: true,
    });
    expect(edges[0]).toMatchObject({
      type: "class-association",
      reconnectable: false,
      data: {
        kind: "class-association",
        sourceMultiplicity: "1",
        targetMultiplicity: "1",
      },
      selected: true,
    });
    expect(edges[1]).toMatchObject({
      type: "generalization",
      data: { kind: "generalization" },
    });
    expect(edges[1]?.data).not.toHaveProperty("sourceMultiplicity");
  });

  it("proyecta componentes con uso y ensamblaje", () => {
    const deps = { createId: sequentialIds(120), now: () => CREATED_AT };
    const empty = createEmptyComponentDocument(deps);
    const withBilling = expectOk(
      createComponent(
        empty,
        {
          name: "Billing",
          geometry: { x: 0, y: 0, width: 200, height: 120 },
        },
        deps,
      ),
    );
    const withCatalog = expectOk(
      createComponent(
        withBilling,
        {
          name: "Catalog",
          geometry: { x: 280, y: 0, width: 200, height: 120 },
        },
        deps,
      ),
    );
    const billing = withCatalog.elements[0];
    const catalog = withCatalog.elements[1];
    if (billing === undefined || catalog === undefined) {
      throw new Error("Faltan componentes");
    }
    const withUsage = expectOk(
      createRelationship(
        withCatalog,
        {
          kind: "component-usage",
          sourceId: billing.id,
          targetId: catalog.id,
        },
        deps,
      ),
    );
    const withAssembly = expectOk(
      createRelationship(
        withUsage,
        {
          kind: "assembly-connector",
          sourceId: billing.id,
          targetId: catalog.id,
          name: "link",
        },
        deps,
      ),
    );

    const { nodes, edges } = mapDocumentToReactFlow(withAssembly, {
      elementIds: [billing.id],
      relationshipIds: [withAssembly.relationships[0]?.id ?? ""],
    });

    expect(nodes[0]).toMatchObject({
      type: "component",
      width: 200,
      height: 120,
      data: { kind: "component", name: "Billing" },
      selected: true,
    });
    expect(edges[0]).toMatchObject({
      type: "component-usage",
      reconnectable: false,
      data: { kind: "component-usage", name: "" },
      selected: true,
    });
    expect(edges[1]).toMatchObject({
      type: "assembly-connector",
      data: { kind: "assembly-connector", name: "link" },
    });
  });

  it("proyecta nodos y artefactos con camino y deploy", () => {
    const deps = { createId: sequentialIds(140), now: () => CREATED_AT };
    const empty = createEmptyDeploymentDocument(deps);
    const withApp = expectOk(
      createNode(
        empty,
        {
          name: "AppServer",
          geometry: { x: 0, y: 0, width: 200, height: 120 },
        },
        deps,
      ),
    );
    const withDb = expectOk(
      createNode(
        withApp,
        {
          name: "DbServer",
          geometry: { x: 280, y: 0, width: 200, height: 120 },
        },
        deps,
      ),
    );
    const withWar = expectOk(
      createArtifact(
        withDb,
        {
          name: "app.war",
          geometry: { x: 40, y: 180, width: 140, height: 80 },
        },
        deps,
      ),
    );
    const app = withWar.elements[0];
    const db = withWar.elements[1];
    const war = withWar.elements[2];
    if (app === undefined || db === undefined || war === undefined) {
      throw new Error("Faltan elementos de despliegue");
    }
    const withPath = expectOk(
      createRelationship(
        withWar,
        {
          kind: "communication-path",
          sourceId: app.id,
          targetId: db.id,
        },
        deps,
      ),
    );
    const document = expectOk(
      createRelationship(
        withPath,
        {
          kind: "deploy",
          sourceId: war.id,
          targetId: app.id,
          name: "",
        },
        deps,
      ),
    );

    const { nodes, edges } = mapDocumentToReactFlow(document, {
      elementIds: [app.id],
      relationshipIds: [document.relationships[0]!.id],
    });

    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toMatchObject({
      type: "node",
      width: 200,
      height: 120,
      data: { kind: "node", name: "AppServer" },
      selected: true,
    });
    expect(nodes[2]).toMatchObject({
      type: "artifact",
      data: { kind: "artifact", name: "app.war" },
    });
    expect(edges[0]).toMatchObject({
      type: "communication-path",
      reconnectable: false,
      data: { kind: "communication-path", name: "" },
      selected: true,
    });
    expect(edges[1]).toMatchObject({
      type: "deploy",
      data: { kind: "deploy", name: "" },
    });
  });

  it("proyecta entidad, atributo clave, rombo y er-link con cardinalidad", () => {
    const deps = { createId: sequentialIds(200), now: () => CREATED_AT };
    const empty = createEmptyErDocument(deps);
    const withEntity = expectOk(
      createEntity(
        empty,
        {
          name: "Cliente",
          geometry: { x: 0, y: 0, width: 160, height: 80 },
        },
        deps,
      ),
    );
    const withAttr = expectOk(
      createAttribute(
        withEntity,
        {
          name: "id",
          geometry: { x: 0, y: 120, width: 120, height: 56 },
          isKey: true,
        },
        deps,
      ),
    );
    const withRombo = expectOk(
      createErRelationship(
        withAttr,
        {
          name: "hace",
          geometry: { x: 220, y: 0, width: 120, height: 80 },
        },
        deps,
      ),
    );
    const entity = withRombo.elements[0];
    const attribute = withRombo.elements[1];
    const rombo = withRombo.elements[2];
    if (entity === undefined || attribute === undefined || rombo === undefined) {
      throw new Error("Faltan elementos ER");
    }
    const withAttrLink = expectOk(
      createRelationship(
        withRombo,
        {
          kind: "er-link",
          sourceId: attribute.id,
          targetId: entity.id,
        },
        deps,
      ),
    );
    const document = expectOk(
      createRelationship(
        withAttrLink,
        {
          kind: "er-link",
          sourceId: entity.id,
          targetId: rombo.id,
        },
        deps,
      ),
    );

    const { nodes, edges } = mapDocumentToReactFlow(document, {
      elementIds: [entity.id],
      relationshipIds: [document.relationships[1]!.id],
    });

    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toMatchObject({
      type: "entity",
      data: { kind: "entity", name: "Cliente" },
      selected: true,
    });
    expect(nodes[1]).toMatchObject({
      type: "attribute",
      data: { kind: "attribute", name: "id", isKey: true },
    });
    expect(nodes[2]).toMatchObject({
      type: "er-relationship",
      data: { kind: "er-relationship", name: "hace" },
    });
    expect(edges[0]).toMatchObject({
      type: "er-link",
      data: { kind: "er-link" },
    });
    expect(edges[0]?.data?.cardinality).toBeUndefined();
    expect(edges[1]).toMatchObject({
      type: "er-link",
      selected: true,
      data: {
        kind: "er-link",
        cardinality: "N",
        cardinalityEnd: "source",
      },
    });
  });
});
