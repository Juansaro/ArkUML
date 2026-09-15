import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import {
  DiagramMinimapNode,
  minimapNodeClassName,
} from "./DiagramMinimapNode.tsx";

function typed(type: DiagramNode["type"]): DiagramNode {
  return { type } as DiagramNode;
}

describe("DiagramMinimapNode", () => {
  it("clasifica el nodo por tipo UML", () => {
    expect(minimapNodeClassName(typed("system-boundary"))).toBe(
      "system-boundary",
    );
    expect(minimapNodeClassName(typed("use-case"))).toBe("use-case");
    expect(minimapNodeClassName(typed("actor"))).toBe("actor");
  });

  it("pinta rectángulo, elipse y figura de palo", () => {
    const { container, rerender } = render(
      <svg>
        <DiagramMinimapNode
          id="boundary"
          x={0}
          y={0}
          width={320}
          height={240}
          className="system-boundary"
          borderRadius={0}
          shapeRendering="auto"
          selected={false}
        />
      </svg>,
    );
    expect(
      container.querySelector('[data-minimap-kind="system-boundary"] rect'),
    ).not.toBeNull();
    const boundary = container.querySelector(
      '[data-minimap-kind="system-boundary"] rect',
    );
    expect(boundary?.getAttribute("stroke")).toBe("var(--color-fg)");
    expect(boundary?.getAttribute("fill")).toBe("rgb(255 255 255 / 0.28)");
    expect(boundary?.getAttribute("stroke-width")).toBe("2");
    expect(boundary?.getAttribute("vector-effect")).toBeNull();

    rerender(
      <svg>
        <DiagramMinimapNode
          id="use-case"
          x={10}
          y={20}
          width={160}
          height={80}
          className="use-case"
          name="Login"
          borderRadius={0}
          shapeRendering="auto"
          selected={false}
        />
      </svg>,
    );
    const ellipse = container.querySelector(
      '[data-minimap-kind="use-case"] ellipse',
    );
    expect(ellipse).not.toBeNull();
    expect(ellipse?.getAttribute("stroke")).toBe("var(--color-fg)");
    expect(ellipse?.getAttribute("fill")).toBe("var(--color-surface)");
    expect(ellipse?.getAttribute("stroke-width")).toBe("2");
    expect(ellipse?.getAttribute("vector-effect")).toBeNull();
    expect(
      container.querySelector('[data-minimap-kind="use-case"]')?.textContent,
    ).toBe("Login");

    rerender(
      <svg>
        <DiagramMinimapNode
          id="actor"
          x={0}
          y={0}
          width={48}
          height={96}
          className="actor"
          borderRadius={0}
          shapeRendering="auto"
          selected={false}
        />
      </svg>,
    );
    const actor = container.querySelector('[data-minimap-kind="actor"]');
    expect(actor?.querySelectorAll("circle")).toHaveLength(1);
    expect(actor?.querySelectorAll("line")).toHaveLength(4);
  });
});
