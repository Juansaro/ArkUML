import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type {
  DiagramEdge,
  DiagramEdgeData,
} from "../adapters/reactFlowMapper.ts";
import { ControlFlowEdge } from "./ControlFlowEdge.tsx";

const LINE = {
  sourceX: 0,
  sourceY: 16,
  targetX: 160,
  targetY: 16,
} as const;

function props(data: DiagramEdgeData): EdgeProps<DiagramEdge> {
  return {
    id: "flow-1",
    source: "a",
    target: "b",
    ...LINE,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data,
    selected: true,
  };
}

describe("ControlFlowEdge", () => {
  it("pinta flecha abierta sin guarda cuando el texto está vacío", () => {
    const { container } = render(
      <svg>
        <ControlFlowEdge {...props({ kind: "control-flow", guard: "" })} />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="control-flow-arrow"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="control-flow-guard"]'),
    ).toBeNull();
  });

  it("muestra [guard] junto al trazo", () => {
    const { container } = render(
      <svg>
        <ControlFlowEdge {...props({ kind: "control-flow", guard: "ok" })} />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="control-flow-guard"]')?.textContent,
    ).toBe("[ok]");
  });
});
