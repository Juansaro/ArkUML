import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type { DiagramEdgeData } from "../adapters/reactFlowMapper.ts";
import { ErLinkEdge } from "./ErLinkEdge.tsx";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";

const LINE = {
  sourceX: 0,
  sourceY: 16,
  targetX: 160,
  targetY: 16,
} as const;

function props(data: DiagramEdgeData): EdgeProps<DiagramEdge> {
  return {
    id: "er-link-1",
    source: "a",
    target: "b",
    ...LINE,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data,
    selected: true,
  };
}

describe("ErLinkEdge", () => {
  it("muestra cardinalidad en el extremo entidad", () => {
    const { container } = render(
      <svg>
        <ErLinkEdge
          {...props({
            kind: "er-link",
            cardinality: "1",
            cardinalityEnd: "source",
          })}
        />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="er-cardinality"]')?.textContent,
    ).toBe("1");
  });

  it("omite la etiqueta si no hay cardinalidad", () => {
    const { container } = render(
      <svg>
        <ErLinkEdge {...props({ kind: "er-link" })} />
      </svg>,
    );
    expect(container.querySelector('[data-testid="er-cardinality"]')).toBeNull();
  });
});
