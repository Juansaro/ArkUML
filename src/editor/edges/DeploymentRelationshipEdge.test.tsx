import { render } from "@testing-library/react";
import { Position, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { DeploymentRelationshipEdge } from "./DeploymentRelationshipEdge.tsx";

const LINE = {
  sourceX: 0,
  sourceY: 16,
  targetX: 160,
  targetY: 16,
} as const;

function props(
  kind: "communication-path" | "deploy",
  name = "",
): EdgeProps<DiagramEdge> {
  return {
    id: `${kind}-1`,
    source: "app",
    target: "db",
    ...LINE,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { kind, name },
    selected: true,
    markerEnd: "url(#arrow)",
    markerStart: "url(#arrow)",
  };
}

describe("DeploymentRelationshipEdge", () => {
  it("pinta camino continuo sin flecha", () => {
    const { container } = render(
      <svg>
        <DeploymentRelationshipEdge {...props("communication-path")} />
      </svg>,
    );
    expect(container.querySelector('[data-testid="deploy-arrow"]')).toBeNull();
    expect(
      container.querySelector('[data-testid="deployment-relationship-label"]'),
    ).toBeNull();
  });

  it("pinta deploy discontinuo con flecha y estereotipo «deploy»", () => {
    const { container } = render(
      <svg>
        <DeploymentRelationshipEdge {...props("deploy")} />
      </svg>,
    );
    expect(container.querySelector('[data-testid="deploy-arrow"]')).not.toBeNull();
    expect(
      container.querySelector('[data-testid="deployment-relationship-label"]'),
    ).toHaveTextContent("«deploy»");
  });
});
