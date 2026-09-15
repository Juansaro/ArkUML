import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CanvasContextMenu } from "./CanvasContextMenu.tsx";

describe("CanvasContextMenu", () => {
  it("copia, pega y cierra; ignora acciones indisponibles", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onPaste = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <CanvasContextMenu
        x={24}
        y={32}
        canCopy
        canPaste={false}
        onCopy={onCopy}
        onPaste={onPaste}
        onClose={onClose}
      />,
    );

    const menu = screen.getByTestId("canvas-context-menu");
    expect(menu).toHaveAttribute("role", "menu");
    expect(screen.getByRole("menuitem", { name: "Copiar" })).toHaveFocus();
    expect(screen.getByRole("menuitem", { name: "Pegar" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await user.click(screen.getByRole("menuitem", { name: "Pegar" }));
    expect(onPaste).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("menuitem", { name: "Copiar" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <CanvasContextMenu
        x={24}
        y={32}
        canCopy={false}
        canPaste
        onCopy={onCopy}
        onPaste={onPaste}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("menuitem", { name: "Pegar" }));
    expect(onPaste).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
