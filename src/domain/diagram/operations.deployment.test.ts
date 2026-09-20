import { describe, expect, it } from "vitest";
import {
  DEFAULT_ARTIFACT_GEOMETRY,
  DEFAULT_DEPLOYMENT_DOCUMENT_TITLE,
  DEFAULT_NODE_GEOMETRY,
  DUPLICATE_OFFSET,
  MIN_ARTIFACT_HEIGHT,
  MIN_ARTIFACT_WIDTH,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
} from "./defaults.ts";
import {
  createActor,
  createEmptyClassDocument,
  createEmptyComponentDocument,
  createEmptyDeploymentDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, Geometry, Result } from "./model.ts";
import {
  createArtifact,
  createElement,
  createNode,
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
const NODE_GEOMETRY: Geometry = {
  x: 40,
  y: 40,
  width: 200,
  height: 120,
};
const ARTIFACT_GEOMETRY: Geometry = {
  x: 40,
  y: 200,
  width: 140,
  height: 80,
};

function emptyDeployment(
  createId: IdFactory = sequentialIds(),
): DiagramDocument {
  return createEmptyDeploymentDocument({
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

function nodeAndArtifact(createId: IdFactory = sequentialIds()): {
  document: DiagramDocument;
  nodeId: string;
  artifactId: string;
  otherNodeId: string;
} {
  const withNode = expectOk(
    createNode(
      emptyDeployment(createId),
      { name: "AppServer", geometry: NODE_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withOther = expectOk(
    createNode(
      withNode,
      {
        name: "DbServer",
        geometry: { x: 300, y: 40, width: 200, height: 120 },
      },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withArtifact = expectOk(
    createArtifact(
      withOther,
      { name: "app.war", geometry: ARTIFACT_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const node = withArtifact.elements[0];
  const otherNode = withArtifact.elements[1];
  const artifact = withArtifact.elements[2];
  if (
    node === undefined ||
    otherNode === undefined ||
    artifact === undefined
  ) {
    throw new Error("Faltan nodos o artefacto");
  }
  return {
    document: withArtifact,
    nodeId: node.id,
    otherNodeId: otherNode.id,
    artifactId: artifact.id,
  };
}

describe("createEmptyDeploymentDocument", () => {
  it("crea un documento deployment vacío con título por defecto", () => {
    const document = emptyDeployment();
    expect(document.schemaVersion).toBe(3);
    expect(document.kind).toBe("deployment");
    expect(document.metadata.title).toBe(DEFAULT_DEPLOYMENT_DOCUMENT_TITLE);
    expect(document.elements).toEqual([]);
    expect(document.relationships).toEqual([]);
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });
});

describe("operaciones de despliegue", () => {
  it("crea, renombra, mueve, redimensiona y borra nodo y artefacto", () => {
    const createId = sequentialIds();
    const createdNode = expectOk(
      createNode(
        emptyDeployment(createId),
        { name: "  AppServer  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(createdNode.elements[0]).toMatchObject({
      kind: "node",
      name: "AppServer",
      geometry: DEFAULT_NODE_GEOMETRY,
    });

    const createdArtifact = expectOk(
      createArtifact(
        createdNode,
        { name: "  app.war  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(createdArtifact.elements[1]).toMatchObject({
      kind: "artifact",
      name: "app.war",
      geometry: DEFAULT_ARTIFACT_GEOMETRY,
    });

    const nodeId = createdArtifact.elements[0]?.id;
    const artifactId = createdArtifact.elements[1]?.id;
    if (nodeId === undefined || artifactId === undefined) {
      throw new Error("Faltan ids");
    }

    const renamed = expectOk(
      renameElement(createdArtifact, nodeId, "Servidor", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamed.elements[0]).toMatchObject({ name: "Servidor" });

    const moved = expectOk(
      moveElements(renamed, [{ id: nodeId, x: 16, y: 24 }], {
        now: () => UPDATED_AT,
      }),
    );
    expect(moved.elements[0]?.geometry).toMatchObject({ x: 16, y: 24 });

    const resizedNode = expectOk(
      resizeElement(
        moved,
        { id: nodeId, geometry: { x: 16, y: 24, width: 220, height: 140 } },
        { now: () => UPDATED_AT },
      ),
    );
    expect(resizedNode.elements[0]?.geometry).toEqual({
      x: 16,
      y: 24,
      width: 220,
      height: 140,
    });

    expectCode(
      resizeElement(resizedNode, {
        id: nodeId,
        geometry: {
          x: 16,
          y: 24,
          width: MIN_NODE_WIDTH - 1,
          height: MIN_NODE_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );
    expectCode(
      resizeElement(resizedNode, {
        id: artifactId,
        geometry: {
          x: 40,
          y: 200,
          width: MIN_ARTIFACT_WIDTH - 1,
          height: MIN_ARTIFACT_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );

    const deleted = expectOk(
      deleteElements(resizedNode, [nodeId, artifactId], {
        now: () => UPDATED_AT,
      }),
    );
    expect(deleted.elements).toEqual([]);
  });

  it("crea communication-path y deploy", () => {
    const createId = sequentialIds();
    const { document, nodeId, otherNodeId, artifactId } =
      nodeAndArtifact(createId);

    const path = expectOk(
      createRelationship(
        document,
        {
          kind: "communication-path",
          sourceId: nodeId,
          targetId: otherNodeId,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(path.relationships[0]).toMatchObject({
      kind: "communication-path",
      sourceId: nodeId,
      targetId: otherNodeId,
      name: "",
    });

    const deploy = expectOk(
      createRelationship(
        path,
        {
          kind: "deploy",
          sourceId: artifactId,
          targetId: nodeId,
          name: "war",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(deploy.relationships).toHaveLength(2);
    expect(deploy.relationships[1]).toMatchObject({
      kind: "deploy",
      sourceId: artifactId,
      targetId: nodeId,
      name: "war",
    });
    expect(parseDiagramDocument(deploy).ok).toBe(true);
  });

  it("rechaza self, artefacto–artefacto en path, permite duplicados y cascada", () => {
    const createId = sequentialIds();
    const { document, nodeId, otherNodeId, artifactId } =
      nodeAndArtifact(createId);

    expectCode(
      createRelationship(document, {
        kind: "communication-path",
        sourceId: nodeId,
        targetId: nodeId,
      }),
      "SELF_RELATIONSHIP",
    );
    expectCode(
      canConnect(document, {
        kind: "deploy",
        sourceId: artifactId,
        targetId: artifactId,
      }),
      "SELF_RELATIONSHIP",
    );
    expectCode(
      canConnect(document, {
        kind: "communication-path",
        sourceId: artifactId,
        targetId: artifactId,
      }),
      "SELF_RELATIONSHIP",
    );

    const secondArtifact = expectOk(
      createArtifact(
        document,
        {
          name: "lib.jar",
          geometry: { x: 200, y: 200, width: 140, height: 80 },
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const otherArtifactId = secondArtifact.elements[3]?.id;
    if (otherArtifactId === undefined) {
      throw new Error("Falta el segundo artefacto");
    }
    expectCode(
      canConnect(secondArtifact, {
        kind: "communication-path",
        sourceId: artifactId,
        targetId: otherArtifactId,
      }),
      "INVALID_CONNECTION",
    );
    expectCode(
      canConnect(secondArtifact, {
        kind: "deploy",
        sourceId: nodeId,
        targetId: artifactId,
      }),
      "INVALID_CONNECTION",
    );

    const first = expectOk(
      createRelationship(
        document,
        {
          kind: "communication-path",
          sourceId: nodeId,
          targetId: otherNodeId,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const duplicate = expectOk(
      createRelationship(
        first,
        {
          kind: "communication-path",
          sourceId: nodeId,
          targetId: otherNodeId,
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(duplicate.relationships).toHaveLength(2);

    const withDeploy = expectOk(
      createRelationship(
        duplicate,
        { kind: "deploy", sourceId: artifactId, targetId: nodeId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const deleted = expectOk(
      deleteElements(withDeploy, [nodeId], { now: () => UPDATED_AT }),
    );
    expect(deleted.elements).toHaveLength(2);
    expect(deleted.relationships).toEqual([]);
  });

  it("renombra una relación y duplica sin relaciones", () => {
    const createId = sequentialIds();
    const { document, nodeId, otherNodeId } = nodeAndArtifact(createId);
    const connected = expectOk(
      createRelationship(
        document,
        {
          kind: "communication-path",
          sourceId: nodeId,
          targetId: otherNodeId,
          name: "lan",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const relationshipId = connected.relationships[0]?.id;
    if (relationshipId === undefined) {
      throw new Error("Falta la relación");
    }
    const renamed = expectOk(
      renameRelationship(connected, relationshipId, "  ethernet  ", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamed.relationships[0]).toMatchObject({ name: "ethernet" });

    const duplicated = expectOk(
      duplicateElements(renamed, [nodeId], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    expect(duplicated.elements).toHaveLength(4);
    expect(duplicated.relationships).toHaveLength(1);
    const copy = duplicated.elements[3];
    expect(copy?.geometry).toMatchObject({
      x: NODE_GEOMETRY.x + DUPLICATE_OFFSET,
      y: NODE_GEOMETRY.y + DUPLICATE_OFFSET,
    });
  });

  it("no mezcla actor en deployment ni deployment en kinds previos", () => {
    const createId = sequentialIds();
    const deploymentDocument = emptyDeployment(createId);
    expectCode(
      createElement(
        deploymentDocument,
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
      ...deploymentDocument,
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
      createNode(createEmptySequenceDocument({ createId }), { name: "X" }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createNode(createEmptyClassDocument({ createId }), { name: "X" }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createArtifact(createEmptyComponentDocument({ createId }), {
        name: "X",
      }),
      "UNKNOWN_KIND",
    );
  });
});
