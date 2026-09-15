import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../common/Tooltip.tsx";
import { DiagramSwitcher } from "./DiagramSwitcher.tsx";
import {
  LAST_DOCUMENT_DELETE_REASON,
  type LibraryDocument,
} from "./library.ts";

const LIBRARY: LibraryDocument[] = [
  { id: "a", title: "Diagrama de casos de uso", kind: "use-case" },
  { id: "b", title: "Login", kind: "use-case" },
  { id: "c", title: "Diagrama de secuencia", kind: "sequence" },
];

function renderSwitcher(
  props: Partial<{
    documents: readonly LibraryDocument[];
    activeDocumentId: string;
    onActivate: (id: string) => void;
    onDelete: (id: string) => void;
  }> = {},
) {
  const onActivate = props.onActivate ?? vi.fn();
  const onDelete = props.onDelete ?? vi.fn();
  render(
    <TooltipProvider>
      <DiagramSwitcher
        documents={props.documents ?? LIBRARY}
        activeDocumentId={props.activeDocumentId ?? "a"}
        onActivate={onActivate}
        onDelete={onDelete}
      />
    </TooltipProvider>,
  );
  return { onActivate, onDelete };
}

describe("DiagramSwitcher", () => {
  it("expone el combobox con el título activo y no usa el título como nombre", () => {
    renderSwitcher();
    const combobox = screen.getByRole("combobox", { name: "Diagrama activo" });
    expect(combobox).toHaveAttribute("aria-haspopup", "listbox");
    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(combobox).toHaveTextContent("Diagrama de casos de uso");
    expect(combobox).toHaveTextContent("Casos de uso");
    expect(
      screen.queryByRole("combobox", { name: "Diagrama de casos de uso" }),
    ).not.toBeInTheDocument();
  });

  it("filtra en vivo, muestra vacío y Escape cierra el listbox", async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole("combobox", { name: "Diagrama activo" }));
    const search = screen.getByRole("searchbox", { name: "Buscar diagrama" });
    expect(search).toHaveFocus();
    expect(screen.getByRole("option", { name: /Login/ })).toBeInTheDocument();

    await user.type(search, "zzz");
    expect(screen.getByText("Sin coincidencias.")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "  LOGIN ");
    expect(screen.getByRole("option", { name: /Login/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Diagrama de casos/ }),
    ).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Diagrama activo" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("activa una fila con Enter y con click", async () => {
    const user = userEvent.setup();
    const { onActivate } = renderSwitcher();
    await user.click(screen.getByRole("combobox", { name: "Diagrama activo" }));
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(onActivate).toHaveBeenCalledWith("b");

    await user.click(screen.getByRole("combobox", { name: "Diagrama activo" }));
    await user.click(
      screen.getByRole("option", { name: /Diagrama de secuencia/ }),
    );
    expect(onActivate).toHaveBeenCalledWith("c");
  });

  it("no borra el último diagrama y pide confirmación para otro", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderSwitcher({
      documents: [LIBRARY[0]!],
      activeDocumentId: "a",
    });
    await user.click(screen.getByRole("combobox", { name: "Diagrama activo" }));
    const only = screen.getByRole("button", { name: "Eliminar diagrama" });
    expect(only).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(only).toHaveFocus();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      LAST_DOCUMENT_DELETE_REASON,
    );
    await user.click(only);
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: "Eliminar diagrama" }),
    ).not.toBeInTheDocument();
  });

  it("confirma el borrado de un diagrama que no es el último", async () => {
    const user = userEvent.setup();
    const { onDelete, onActivate } = renderSwitcher();
    await user.click(screen.getByRole("combobox", { name: "Diagrama activo" }));
    const row = screen.getByRole("option", { name: /Login/ });
    await user.click(
      within(row).getByRole("button", { name: "Eliminar diagrama" }),
    );
    expect(onActivate).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Eliminar diagrama" });
    expect(dialog).toHaveTextContent(
      "Se perderá este diagrama. Esta acción no se puede deshacer.",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Eliminar diagrama" }),
    );
    expect(onDelete).toHaveBeenCalledWith("b");
  });
});
