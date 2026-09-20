import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACTION_GEOMETRY,
  DEFAULT_ACTIVITY_DOCUMENT_TITLE,
  DEFAULT_ACTIVITY_FINAL_GEOMETRY,
  DEFAULT_DECISION_NODE_GEOMETRY,
  DEFAULT_FORK_NODE_GEOMETRY,
  DEFAULT_INITIAL_NODE_GEOMETRY,
  DUPLICATE_OFFSET,
  MIN_ACTION_HEIGHT,
  MIN_ACTION_WIDTH,
} from "./defaults.ts";
import {
  createActor,
  createEmptyActivityDocument,
  createEmptyErDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, Geometry, Result } from "./model.ts";
import {
  createAction,
  createActivityFinal,
  createDecisionNode,
  createElement,
  createEntity,
  createForkNode,
  createInitialNode,
  createJoinNode,
  createMergeNode,
  createRelationship,
  deleteElements,
  duplicateElements,
  moveElements,
  renameElement,
  resizeElement,
  setControlFlowGuard,
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
const ACTION_GEOMETRY: Geometry = {
  x: 40,
  y: 40,
  width: 160,
  height: 64,
};
const OTHER_ACTION_GEOMETRY: Geometry = {
  x: 240,
  y: 40,
  width: 160,
  height: 64,
};

function emptyActivity(createId: IdFactory = sequentialIds()): DiagramDocument {
  return createEmptyActivityDocument({
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

function twoActions(createId: IdFactory = sequentialIds()): {
  document: DiagramDocument;
  sourceId: string;
  targetId: string;
} {
  const withFirst = expectOk(
    createAction(
      emptyActivity(createId),
      { name: "Validar", geometry: ACTION_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withSecond = expectOk(
    createAction(
      withFirst,
      { name: "Guardar", geometry: OTHER_ACTION_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const source = withSecond.elements[0];
  const target = withSecond.elements[1];
  if (source === undefined || target === undefined) {
    throw new Error("Faltan acciones");
  }
  return {
    document: withSecond,
    sourceId: source.id,
    targetId: target.id,
  };
}

describe("createEmptyActivityDocument", () => {
  it("crea un documento activity vacío con título por defecto", () => {
    const document = emptyActivity();
    expect(document.schemaVersion).toBe(3);
    expect(document.kind).toBe("activity");
    expect(document.metadata.title).toBe(DEFAULT_ACTIVITY_DOCUMENT_TITLE);
    expect(document.elements).toEqual([]);
    expect(document.relationships).toEqual([]);
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });
});

describe("operaciones de actividades", () => {
  it("crea los siete nodos, renombra, mueve, redimensiona y borra con cascada", () => {
    const createId = sequentialIds();
    const withAction = expectOk(
      createAction(
        emptyActivity(createId),
        { name: "  Validar  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(withAction.elements[0]).toMatchObject({
      kind: "action",
      name: "Validar",
      geometry: DEFAULT_ACTION_GEOMETRY,
    });

    const withInitial = expectOk(
      createInitialNode(withAction, {}, { createId, now: () => UPDATED_AT }),
    );
    expect(withInitial.elements[1]).toMatchObject({
      kind: "initial-node",
      name: "",
      geometry: DEFAULT_INITIAL_NODE_GEOMETRY,
    });

    const withFinal = expectOk(
      createActivityFinal(withInitial, {}, { createId, now: () => UPDATED_AT }),
    );
    expect(withFinal.elements[2]).toMatchObject({
      kind: "activity-final",
      name: "",
      geometry: DEFAULT_ACTIVITY_FINAL_GEOMETRY,
    });

    const withDecision = expectOk(
      createDecisionNode(withFinal, {}, { createId, now: () => UPDATED_AT }),
    );
    expect(withDecision.elements[3]).toMatchObject({
      kind: "decision-node",
      geometry: DEFAULT_DECISION_NODE_GEOMETRY,
    });

    const withMerge = expectOk(
      createMergeNode(withDecision, {}, { createId, now: () => UPDATED_AT }),
    );
    expect(withMerge.elements[4]).toMatchObject({ kind: "merge-node" });

    const withFork = expectOk(
      createForkNode(withMerge, {}, { createId, now: () => UPDATED_AT }),
    );
    expect(withFork.elements[5]).toMatchObject({
      kind: "fork-node",
      geometry: DEFAULT_FORK_NODE_GEOMETRY,
    });

    const withJoin = expectOk(
      createJoinNode(withFork, {}, { createId, now: () => UPDATED_AT }),
    );
    expect(withJoin.elements).toHaveLength(7);
    expect(withJoin.elements[6]).toMatchObject({ kind: "join-node" });

    const actionId = withJoin.elements[0]?.id;
    const initialId = withJoin.elements[1]?.id;
    if (actionId === undefined || initialId === undefined) {
      throw new Error("Faltan ids");
    }

    const renamedAction = expectOk(
      renameElement(withJoin, actionId, "Procesar", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamedAction.elements[0]).toMatchObject({ name: "Procesar" });

    const renamedInitial = expectOk(
      renameElement(renamedAction, initialId, "", { now: () => UPDATED_AT }),
    );
    expect(renamedInitial.elements[1]).toMatchObject({ name: "" });

    expectCode(renameElement(renamedInitial, actionId, ""), "INVALID_NAME");

    const moved = expectOk(
      moveElements(renamedInitial, [{ id: actionId, x: 16, y: 24 }], {
        now: () => UPDATED_AT,
      }),
    );
    expect(moved.elements[0]?.geometry).toMatchObject({ x: 16, y: 24 });

    const resized = expectOk(
      resizeElement(
        moved,
        { id: actionId, geometry: { x: 16, y: 24, width: 180, height: 72 } },
        { now: () => UPDATED_AT },
      ),
    );
    expect(resized.elements[0]?.geometry).toEqual({
      x: 16,
      y: 24,
      width: 180,
      height: 72,
    });

    expectCode(
      resizeElement(resized, {
        id: actionId,
        geometry: {
          x: 16,
          y: 24,
          width: MIN_ACTION_WIDTH - 1,
          height: MIN_ACTION_HEIGHT,
        },
      }),
      "INVALID_GEOMETRY",
    );

    const decisionId = resized.elements[3]?.id;
    const joinId = resized.elements[6]?.id;
    if (decisionId === undefined || joinId === undefined) {
      throw new Error("Faltan extremos");
    }

    const withFlow = expectOk(
      createRelationship(
        resized,
        { kind: "control-flow", sourceId: decisionId, targetId: joinId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(withFlow.relationships).toHaveLength(1);

    const deleted = expectOk(
      deleteElements(withFlow, [decisionId], { now: () => UPDATED_AT }),
    );
    expect(deleted.elements).toHaveLength(6);
    expect(deleted.relationships).toEqual([]);
  });

  it("crea control-flow con guarda y rechaza self, initial destino y final origen", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoActions(createId);

    const withInitial = expectOk(
      createInitialNode(document, {}, { createId, now: () => UPDATED_AT }),
    );
    const withFinal = expectOk(
      createActivityFinal(withInitial, {}, { createId, now: () => UPDATED_AT }),
    );
    const initialId = withFinal.elements[2]?.id;
    const finalId = withFinal.elements[3]?.id;
    if (initialId === undefined || finalId === undefined) {
      throw new Error("Faltan nodos de control");
    }

    const flow = expectOk(
      createRelationship(
        withFinal,
        {
          kind: "control-flow",
          sourceId,
          targetId,
          guard: "  ok  ",
        },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(flow.relationships[0]).toMatchObject({
      kind: "control-flow",
      sourceId,
      targetId,
      guard: "ok",
    });

    const flowId = flow.relationships[0]?.id;
    if (flowId === undefined) {
      throw new Error("Falta el flujo");
    }
    const cleared = expectOk(
      setControlFlowGuard(
        flow,
        { id: flowId, guard: "" },
        { now: () => UPDATED_AT },
      ),
    );
    expect(cleared.relationships[0]).toMatchObject({ guard: "" });
    expect(parseDiagramDocument(cleared).ok).toBe(true);

    expectCode(
      createRelationship(withFinal, {
        kind: "control-flow",
        sourceId,
        targetId: sourceId,
      }),
      "SELF_RELATIONSHIP",
    );
    expectCode(
      canConnect(withFinal, {
        kind: "control-flow",
        sourceId,
        targetId: initialId,
      }),
      "INVALID_CONNECTION",
    );
    expectCode(
      canConnect(withFinal, {
        kind: "control-flow",
        sourceId: finalId,
        targetId,
      }),
      "INVALID_CONNECTION",
    );
    expectOk(
      canConnect(withFinal, {
        kind: "control-flow",
        sourceId: initialId,
        targetId,
      }),
    );
    expectOk(
      canConnect(withFinal, {
        kind: "control-flow",
        sourceId,
        targetId: finalId,
      }),
    );
  });

  it("duplica nodos sin flujos", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoActions(createId);
    const connected = expectOk(
      createRelationship(
        document,
        { kind: "control-flow", sourceId, targetId },
        { createId, now: () => UPDATED_AT },
      ),
    );
    const duplicated = expectOk(
      duplicateElements(connected, [sourceId], {
        createId,
        now: () => UPDATED_AT,
      }),
    );
    expect(duplicated.elements).toHaveLength(3);
    expect(duplicated.relationships).toHaveLength(1);
    const copy = duplicated.elements[2];
    expect(copy?.geometry).toMatchObject({
      x: ACTION_GEOMETRY.x + DUPLICATE_OFFSET,
      y: ACTION_GEOMETRY.y + DUPLICATE_OFFSET,
    });
  });

  it("no mezcla actor en activity ni activity en kinds previos", () => {
    const createId = sequentialIds();
    const activityDocument = emptyActivity(createId);
    expectCode(
      createElement(
        activityDocument,
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
      ...activityDocument,
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
      createAction(createEmptySequenceDocument({ createId }), {
        name: "X",
      }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createAction(createEmptyErDocument({ createId }), { name: "X" }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createEntity(emptyActivity(createId), { name: "X" }),
      "UNKNOWN_KIND",
    );
  });
});
