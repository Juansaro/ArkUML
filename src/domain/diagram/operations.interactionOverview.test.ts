import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACTIVITY_FINAL_GEOMETRY,
  DEFAULT_DECISION_NODE_GEOMETRY,
  DEFAULT_FORK_NODE_GEOMETRY,
  DEFAULT_INITIAL_NODE_GEOMETRY,
  DEFAULT_INTERACTION_OCCURRENCE_GEOMETRY,
  DEFAULT_INTERACTION_OVERVIEW_DOCUMENT_TITLE,
  DUPLICATE_OFFSET,
  MIN_INTERACTION_OCCURRENCE_HEIGHT,
  MIN_INTERACTION_OCCURRENCE_WIDTH,
} from "./defaults.ts";
import {
  createActor,
  createEmptyActivityDocument,
  createEmptyInteractionOverviewDocument,
  createEmptySequenceDocument,
  type IdFactory,
} from "./factories.ts";
import type { DiagramDocument, Geometry, Result } from "./model.ts";
import {
  createAction,
  createActivityFinal,
  createDecisionNode,
  createElement,
  createForkNode,
  createInitialNode,
  createInteractionOccurrence,
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
const OCCURRENCE_GEOMETRY: Geometry = {
  x: 40,
  y: 40,
  width: 200,
  height: 80,
};
const OTHER_OCCURRENCE_GEOMETRY: Geometry = {
  x: 280,
  y: 40,
  width: 200,
  height: 80,
};

function emptyIod(
  createId: IdFactory = sequentialIds(),
): DiagramDocument {
  return createEmptyInteractionOverviewDocument({
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

function twoOccurrences(createId: IdFactory = sequentialIds()): {
  document: DiagramDocument;
  sourceId: string;
  targetId: string;
} {
  const withFirst = expectOk(
    createInteractionOccurrence(
      emptyIod(createId),
      { name: "Login", geometry: OCCURRENCE_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const withSecond = expectOk(
    createInteractionOccurrence(
      withFirst,
      { name: "Checkout", geometry: OTHER_OCCURRENCE_GEOMETRY },
      { createId, now: () => UPDATED_AT },
    ),
  );
  const source = withSecond.elements[0];
  const target = withSecond.elements[1];
  if (source === undefined || target === undefined) {
    throw new Error("Faltan ocurrencias");
  }
  return {
    document: withSecond,
    sourceId: source.id,
    targetId: target.id,
  };
}

describe("createEmptyInteractionOverviewDocument", () => {
  it("crea un documento interaction-overview vacío con título por defecto", () => {
    const document = emptyIod();
    expect(document.schemaVersion).toBe(3);
    expect(document.kind).toBe("interaction-overview");
    expect(document.metadata.title).toBe(
      DEFAULT_INTERACTION_OVERVIEW_DOCUMENT_TITLE,
    );
    expect(document.elements).toEqual([]);
    expect(document.relationships).toEqual([]);
    expect(parseDiagramDocument(document)).toEqual({
      ok: true,
      value: document,
    });
  });
});

describe("operaciones de interacción general", () => {
  it("crea occurrence + nodos de control, renombra, mueve, redimensiona y borra con cascada", () => {
    const createId = sequentialIds();
    const withOccurrence = expectOk(
      createInteractionOccurrence(
        emptyIod(createId),
        { name: "  Login  " },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(withOccurrence.elements[0]).toMatchObject({
      kind: "interaction-occurrence",
      name: "Login",
      geometry: DEFAULT_INTERACTION_OCCURRENCE_GEOMETRY,
    });

    const withInitial = expectOk(
      createInitialNode(withOccurrence, {}, { createId, now: () => UPDATED_AT }),
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

    const occurrenceId = withJoin.elements[0]?.id;
    const initialId = withJoin.elements[1]?.id;
    if (occurrenceId === undefined || initialId === undefined) {
      throw new Error("Faltan ids");
    }

    const renamedOccurrence = expectOk(
      renameElement(withJoin, occurrenceId, "Checkout", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamedOccurrence.elements[0]).toMatchObject({ name: "Checkout" });

    const renamedInitial = expectOk(
      renameElement(renamedOccurrence, initialId, "", {
        now: () => UPDATED_AT,
      }),
    );
    expect(renamedInitial.elements[1]).toMatchObject({ name: "" });

    expectCode(
      renameElement(renamedInitial, occurrenceId, ""),
      "INVALID_NAME",
    );

    const moved = expectOk(
      moveElements(renamedInitial, [{ id: occurrenceId, x: 16, y: 24 }], {
        now: () => UPDATED_AT,
      }),
    );
    expect(moved.elements[0]?.geometry).toMatchObject({ x: 16, y: 24 });

    const resized = expectOk(
      resizeElement(
        moved,
        {
          id: occurrenceId,
          geometry: { x: 16, y: 24, width: 220, height: 96 },
        },
        { now: () => UPDATED_AT },
      ),
    );
    expect(resized.elements[0]?.geometry).toEqual({
      x: 16,
      y: 24,
      width: 220,
      height: 96,
    });

    expectCode(
      resizeElement(resized, {
        id: occurrenceId,
        geometry: {
          x: 16,
          y: 24,
          width: MIN_INTERACTION_OCCURRENCE_WIDTH - 1,
          height: MIN_INTERACTION_OCCURRENCE_HEIGHT,
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
    const { document, sourceId, targetId } = twoOccurrences(createId);

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

  it("acepta ref string 1–80; un UUID-as-ref no se rechaza", () => {
    const createId = sequentialIds();
    const uuidRef = "00000000-0000-4000-8000-0000000000aa";
    const withUuidRef = expectOk(
      createInteractionOccurrence(
        emptyIod(createId),
        { name: uuidRef },
        { createId, now: () => UPDATED_AT },
      ),
    );
    expect(withUuidRef.elements[0]).toMatchObject({ name: uuidRef });

    expectCode(
      createInteractionOccurrence(emptyIod(createId), { name: "" }),
      "INVALID_NAME",
    );
    expectCode(
      createInteractionOccurrence(emptyIod(createId), {
        name: "x".repeat(81),
      }),
      "INVALID_NAME",
    );
  });

  it("duplica nodos sin flujos", () => {
    const createId = sequentialIds();
    const { document, sourceId, targetId } = twoOccurrences(createId);
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
      x: OCCURRENCE_GEOMETRY.x + DUPLICATE_OFFSET,
      y: OCCURRENCE_GEOMETRY.y + DUPLICATE_OFFSET,
    });
  });

  it("rechaza action en IOD y no mezcla kinds", () => {
    const createId = sequentialIds();
    const iodDocument = emptyIod(createId);
    expectCode(
      createAction(iodDocument, { name: "Validar" }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createElement(
        iodDocument,
        {
          kind: "actor",
          name: "Usuario",
          geometry: { x: 0, y: 0, width: 48, height: 96 },
        },
        { now: () => UPDATED_AT },
      ),
      "UNKNOWN_KIND",
    );

    const mixedAction = parseDiagramDocument({
      ...iodDocument,
      elements: [
        {
          id: "00000000-0000-4000-8000-0000000000a1",
          kind: "action",
          name: "Validar",
          geometry: { x: 0, y: 0, width: 160, height: 64 },
        },
      ],
    });
    expect(mixedAction.ok).toBe(false);
    if (!mixedAction.ok) {
      expect(mixedAction.error.code).toBe("UNKNOWN_KIND");
    }

    const mixedActor = parseDiagramDocument({
      ...iodDocument,
      elements: [
        createActor(
          { name: "Usuario", geometry: { x: 0, y: 0, width: 48, height: 96 } },
          { createId },
        ),
      ],
    });
    expect(mixedActor.ok).toBe(false);
    if (!mixedActor.ok) {
      expect(mixedActor.error.code).toBe("UNKNOWN_KIND");
    }

    expectCode(
      createInteractionOccurrence(createEmptySequenceDocument({ createId }), {
        name: "X",
      }),
      "UNKNOWN_KIND",
    );
    expectCode(
      createInteractionOccurrence(createEmptyActivityDocument({ createId }), {
        name: "X",
      }),
      "UNKNOWN_KIND",
    );
  });
});
