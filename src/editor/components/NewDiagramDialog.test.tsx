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

  it("Eliminar diagrama usa copy de pérdida de ese diagrama", () => {
    render(
      <NewDiagramDialog
        title="Eliminar diagrama"
        confirmLabel="Eliminar diagrama"
        description="Se perderá este diagrama. Esta acción no se puede deshacer."
        testId="delete-diagram-dialog"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Eliminar diagrama" });
    expect(dialog).toHaveAttribute("data-testid", "delete-diagram-dialog");
    expect(dialog).toHaveTextContent(
      "Se perderá este diagrama. Esta acción no se puede deshacer.",
    );
  });

  it("permite elegir Casos de uso o Secuencia", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <NewDiagramDialog
        description="Se añade a la biblioteca y queda como diagrama activo."
        kindOptions={[
          { value: "use-case", label: "Casos de uso" },
          { value: "sequence", label: "Secuencia" },
        ]}
        defaultKind="use-case"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const useCase = screen.getByRole("radio", { name: "Casos de uso" });
    const sequence = screen.getByRole("radio", { name: "Secuencia" });
    expect(useCase).toBeChecked();
    await user.click(sequence);
    expect(sequence).toBeChecked();
    await user.click(
      screen.getByRole("button", { name: "Crear diagrama nuevo" }),
    );
    expect(onConfirm).toHaveBeenCalledWith("sequence");
  });
});
