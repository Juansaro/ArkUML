import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HelpDialog } from "./HelpDialog.tsx";

describe("HelpDialog", () => {
  it("atrapa el foco y Escape cierra", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HelpDialog titleId="help-title" onClose={onClose} />);

    const close = screen.getByRole("button", { name: "Cerrar" });
    expect(close).toHaveFocus();

    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
