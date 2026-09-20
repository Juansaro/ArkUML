import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { ComponentRelationshipEdge } from "./ComponentRelationshipEdge.tsx";

const LINE = {
  sourceX: 0,
  sourceY: 16,
  targetX: 160,
  targetY: 16,
} as const;

function props(
  kind: "component-usage" | "assembly-connector",
  name = "",
): EdgeProps<DiagramEdge> {
  return {
    id: `${kind}-1`,
    source: "billing",
    target: "catalog",
    ...LINE,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { kind, name },
    selected: true,
    markerEnd: "url(#arrow)",
    markerStart: "url(#arrow)",
  };
}

describe("ComponentRelationshipEdge", () => {
  it("pinta uso con flecha abierta y estereotipo «use»", () => {
    const { container } = render(
      <svg>
        <ComponentRelationshipEdge {...props("component-usage")} />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="component-usage-arrow"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="component-relationship-label"]')
        ?.textContent,
    ).toBe("«use»");
    expect(container.querySelector('[data-testid="assembly-ball"]')).toBeNull();
  });

  it("pinta ensamblaje con bola, zócalo y nombre opcional", () => {
    const { container } = render(
      <svg>
        <ComponentRelationshipEdge {...props("assembly-connector", "link")} />
      </svg>,
    );
    expect(
      container.querySelector('[data-testid="assembly-ball"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="assembly-socket"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="component-relationship-label"]')
        ?.textContent,
    ).toBe("link");
  });
});
