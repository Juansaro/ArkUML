import { render } from "@testing-library/react";
import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type { EdgeProps } from "@xyflow/react";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { AssociationEdge } from "./AssociationEdge.tsx";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";

const PROPS: EdgeProps<DiagramEdge> = {
  id: "association-1",
  source: "actor",
  target: "use-case",
  sourceX: 0,
  sourceY: 16,
  targetX: 120,
  targetY: 16,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  data: { kind: "association" },
  selected: true,
  markerEnd: "url(#arrow)",
  markerStart: "url(#arrow)",
};

describe("AssociationEdge", () => {
  it("pinta una línea sólida sin flecha y con hit area ampliada", () => {
    const { container } = render(
      <svg>
        <AssociationEdge {...PROPS} />
      </svg>,
    );

    const visible = container.querySelector(".react-flow__edge-path");
    expect(visible).not.toBeNull();
    expect(visible).not.toHaveAttribute("marker-end");
    expect(visible).not.toHaveAttribute("marker-start");
    expect(visible?.getAttribute("d") ?? "").toMatch(/^M /);

    const hitArea = container.querySelector(".react-flow__edge-interaction");
    expect(hitArea).not.toBeNull();
    expect(hitArea).toHaveAttribute(
      "stroke-width",
      String(EDGE_INTERACTION_WIDTH),
    );
  });
});
