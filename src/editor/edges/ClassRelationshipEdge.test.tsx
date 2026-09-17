import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import { ClassRelationshipEdge } from "./ClassRelationshipEdge.tsx";

const LINE = {
  sourceX: 0,
  sourceY: 16,
  targetX: 160,
  targetY: 16,
} as const;

function props(
  kind: "class-association" | "aggregation" | "composition" | "generalization",
): EdgeProps<DiagramEdge> {
  return {
    id: `${kind}-1`,
    source: "pedido",
    target: "cliente",
    ...LINE,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      kind,
      ...(kind === "generalization"
        ? {}
        : { sourceMultiplicity: "1", targetMultiplicity: "0..*" }),
    },
    selected: true,
    markerEnd: "url(#arrow)",
    markerStart: "url(#arrow)",
  };
}

describe("ClassRelationshipEdge", () => {
  it("pinta asociación con multiplicidades y sin marcador", () => {
    const { container } = render(
      <svg>
        <ClassRelationshipEdge {...props("class-association")} />
      </svg>,
    );
    expect(container.querySelector(".react-flow__edge-path")).not.toBeNull();
    expect(container.querySelector('[data-testid="aggregation-diamond"]')).toBeNull();
    expect(container.querySelector('[data-testid="generalization-triangle"]')).toBeNull();
    expect(
      container.querySelector('[data-testid="multiplicity-source"]')?.textContent,
    ).toBe("1");
    expect(
      container.querySelector('[data-testid="multiplicity-target"]')?.textContent,
    ).toBe("0..*");
    expect(
      container.querySelector(".react-flow__edge-interaction"),
    ).toHaveAttribute("stroke-width", String(EDGE_INTERACTION_WIDTH));
  });

  it("pinta diamante vacío, diamante relleno y triángulo de generalization", () => {
    const { container, rerender } = render(
      <svg>
        <ClassRelationshipEdge {...props("aggregation")} />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="aggregation-diamond"]'),
    ).not.toBeNull();

    rerender(
      <svg>
        <ClassRelationshipEdge {...props("composition")} />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="composition-diamond"]'),
    ).not.toBeNull();

    rerender(
      <svg>
        <ClassRelationshipEdge {...props("generalization")} />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="generalization-triangle"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="multiplicity-source"]')).toBeNull();
  });
});
