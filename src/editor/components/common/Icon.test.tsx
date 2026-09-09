import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon.tsx";
import { ICON_NAMES } from "./icons.tsx";

describe("Icon", () => {
  it("marca cada glifo como decorativo y cubre el inventario", () => {
    for (const name of ICON_NAMES) {
      const { unmount } = render(<Icon name={name} />);
      const svg = document.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      unmount();
    }
  });

  it("distingue Include y Extend por la letra, no solo por el trazo discontinuo", () => {
    const { rerender } = render(<Icon name="include" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M18 8v8");
    rerender(<Icon name="extend" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M17 8v8");
    expect(document.querySelector("svg")?.innerHTML).toContain("M17 8h3.5");
  });
});
