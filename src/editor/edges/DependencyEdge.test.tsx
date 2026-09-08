import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  INCLUDE_STEREOTYPE,
  EXTEND_STEREOTYPE,
} from "../../domain/diagram/rules.ts";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import { DependencyEdge } from "./DependencyEdge.tsx";
import { openArrowPath } from "./markers.ts";

const LINE = {
  sourceX: 0,
  sourceY: 16,
  targetX: 160,
  targetY: 16,
} as const;

function props(kind: "include" | "extend"): EdgeProps<DiagramEdge> {
  return {
    id: `${kind}-1`,
    source: "login",
    target: "logout",
    ...LINE,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { kind },
    selected: true,
    markerEnd: "url(#arrow)",
    markerStart: "url(#arrow)",
  };
}

describe("DependencyEdge", () => {
  it("pinta include con dash, flecha abierta al target y estereotipo UML", () => {
    const { container } = render(
      <svg>
        <DependencyEdge {...props("include")} />
      </svg>,
    );

    const visible = container.querySelector(".react-flow__edge-path");
    expect(visible).not.toBeNull();
    expect(visible).not.toHaveAttribute("marker-end");
    expect(visible).not.toHaveAttribute("marker-start");
    expect(visible?.getAttribute("class") ?? "").not.toBe("");

    const arrow = container.querySelector('[data-testid="dependency-arrow"]');
    expect(arrow).not.toBeNull();
    expect(arrow).toHaveAttribute("d", openArrowPath(LINE));
    expect(arrow?.getAttribute("d") ?? "").toContain(
      `L ${LINE.targetX} ${LINE.targetY} L `,
    );

    const stereotype = container.querySelector(
      '[data-testid="dependency-stereotype"]',
    );
    expect(stereotype).toHaveTextContent(INCLUDE_STEREOTYPE);

    const hitArea = container.querySelector(".react-flow__edge-interaction");
    expect(hitArea).toHaveAttribute(
      "stroke-width",
      String(EDGE_INTERACTION_WIDTH),
    );
  });

  it("pinta extend con el mismo marker y el estereotipo extend", () => {
    const { container } = render(
      <svg>
        <DependencyEdge {...props("extend")} />
      </svg>,
    );

    expect(
      container.querySelector('[data-testid="dependency-stereotype"]'),
    ).toHaveTextContent(EXTEND_STEREOTYPE);
    expect(
      container.querySelector('[data-testid="dependency-arrow"]'),
    ).toHaveAttribute("d", openArrowPath(LINE));
  });
});
