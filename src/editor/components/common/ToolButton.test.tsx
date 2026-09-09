import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { ToolButton } from "./ToolButton.tsx";
import { TooltipProvider } from "./Tooltip.tsx";

function renderButton(props: Partial<ComponentProps<typeof ToolButton>> = {}) {
  const onClick = vi.fn();
  render(
    <TooltipProvider>
      <ToolButton
        icon="undo"
        label="Deshacer"
        description="Deshacer (Ctrl/Cmd+Z)."
        placement="bottom"
        onClick={onClick}
        {...props}
      />
    </TooltipProvider>,
  );
  return { onClick };
}

describe("ToolButton", () => {
  it("conserva el nombre accesible en pressed y explica indisponible", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TooltipProvider>
        <ToolButton
          icon="actor"
          label="Actor"
          description="Crear actor."
          placement="right"
          variant="row"
          pressed
        />
      </TooltipProvider>,
    );
    const actor = screen.getByRole("button", { name: "Actor" });
    expect(actor).toHaveAttribute("aria-pressed", "true");
    expect(actor).not.toHaveAttribute("aria-disabled");

    rerender(
      <TooltipProvider>
        <ToolButton
          icon="undo"
          label="Deshacer"
          description="Nada que deshacer (Ctrl/Cmd+Z)."
          placement="bottom"
          unavailable
        />
      </TooltipProvider>,
    );
    const undo = screen.getByRole("button", { name: "Deshacer" });
    expect(undo).toHaveAttribute("aria-disabled", "true");
    expect(undo).not.toHaveAttribute("disabled");
    await user.tab();
    expect(undo).toHaveFocus();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Nada que deshacer (Ctrl/Cmd+Z).",
    );
  });

  it("no dispara click, Enter ni Space cuando está indisponible", async () => {
    const user = userEvent.setup();
    const { onClick } = renderButton({
      unavailable: true,
      description: "Nada que deshacer (Ctrl/Cmd+Z).",
    });
    const button = screen.getByRole("button", { name: "Deshacer" });
    await user.click(button);
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).not.toHaveBeenCalled();
  });
});
