import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { createEmptySequenceDocument } from "../../domain/diagram/factories.ts";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import { filledArrowPath, openArrowPath } from "./markers.ts";
import { SequenceMessageEdge } from "./SequenceMessageEdge.tsx";
import { sequenceMessageArrowLine, sequenceMessagePath } from "./sequenceMessagePath.ts";

const LINE = {
  sourceX: 60,
  sourceY: 160,
  targetX: 300,
  targetY: 160,
} as const;

function props(
  kind: "sync-message" | "reply-message",
  extra?: Partial<EdgeProps<DiagramEdge>>,
): EdgeProps<DiagramEdge> {
  return {
    id: `${kind}-1`,
    source: "a",
    target: kind === "reply-message" ? "a" : "b",
    ...LINE,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { kind, name: kind === "sync-message" ? "ping()" : "", y: 80 },
    selected: true,
    ...extra,
  };
}

function renderEdge(edgeProps: EdgeProps<DiagramEdge>) {
  const store = createEditorStore({
    document: createEmptySequenceDocument(),
  });
  return render(
    <EditorStoreProvider store={store}>
      <svg>
        <SequenceMessageEdge {...edgeProps} />
      </svg>
    </EditorStoreProvider>,
  );
}

describe("SequenceMessageEdge", () => {
  it("pinta sync con trazo continuo, punta llena y firma", () => {
    const { container } = renderEdge(props("sync-message"));
    const geometry = {
      sourceX: LINE.sourceX,
      targetX: LINE.targetX,
      y: 80,
      self: false,
    };
    const visible = container.querySelector(".react-flow__edge-path");
    expect(visible).toHaveAttribute("d", sequenceMessagePath(geometry));
    expect(
      container.querySelector('[data-testid="sequence-message-arrow"]'),
    ).toHaveAttribute("d", filledArrowPath(sequenceMessageArrowLine(geometry)));
    expect(
      container.querySelector('[data-testid="sequence-message-label"]'),
    ).toHaveTextContent("ping()");
    expect(
      container.querySelector(".react-flow__edge-interaction"),
    ).toHaveAttribute("stroke-width", String(EDGE_INTERACTION_WIDTH));
  });

  it("pinta reply a sí mismo en U con punta abierta", () => {
    const selfProps = props("reply-message", {
      sourceX: 60,
      targetX: 60,
    });
    const { container } = renderEdge(selfProps);
    const geometry = { sourceX: 60, targetX: 60, y: 80, self: true };
    expect(
      container.querySelector('[data-testid="sequence-message"]'),
    ).toHaveAttribute("data-self", "true");
    expect(
      container.querySelector(".react-flow__edge-path"),
    ).toHaveAttribute("d", sequenceMessagePath(geometry));
    expect(
      container.querySelector('[data-testid="sequence-message-arrow"]'),
    ).toHaveAttribute("d", openArrowPath(sequenceMessageArrowLine(geometry)));
  });
});
