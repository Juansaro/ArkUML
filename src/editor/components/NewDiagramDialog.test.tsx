import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewDiagramDialog } from "./NewDiagramDialog.tsx";

describe("NewDiagramDialog", () => {
  it("atrapa el foco entre Cancelar y confirmar", async () => {
    const user = userEvent.setup();
    render(<NewDiagramDialog onCancel={vi.fn()} onConfirm={vi.fn()} />);

    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", {
      name: "Crear diagrama nuevo",
    });
    expect(cancel).toHaveFocus();

    await user.tab();
    expect(confirm).toHaveFocus();

    await user.tab();
    expect(cancel).toHaveFocus();

    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it("Cancelar no confirma", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<NewDiagramDialog onCancel={onCancel} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Escape cancela y no confirma", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<NewDiagramDialog onCancel={onCancel} onConfirm={onConfirm} />);

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Abrir archivo reutiliza el cuerpo y cambia título y confirmación", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <NewDiagramDialog
        title="Abrir archivo"
        confirmLabel="Abrir archivo"
        testId="open-file-dialog"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Abrir archivo" });
    expect(dialog).toHaveAttribute("data-testid", "open-file-dialog");
    expect(dialog).toHaveTextContent(
      "Se perderá el diagrama actual. Esta acción no se puede deshacer.",
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
