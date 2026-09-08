import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { DEFAULT_DOCUMENT_TITLE } from "../../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../../domain/diagram/factories.ts";
import type { Geometry, Result } from "../../../domain/diagram/model.ts";
import { deleteElements } from "../../../domain/diagram/operations.ts";
import { createEditorStore } from "../../store/editorStore.ts";
import { EditorStoreProvider } from "../../store/EditorStoreProvider.tsx";
import { EditorShell } from "./EditorShell.tsx";
import { PALETTE_RELATIONSHIP_TOOLS } from "./paletteTools.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 48, height: 96 };

describe("EditorShell", () => {
  it("expone landmarks del chrome", () => {
    render(<EditorShell />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Paleta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Lienzo" })).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Inspector" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Estado del editor" }),
    ).toBeInTheDocument();
  });

  it("muestra el producto, el título del diagrama y ayuda breve", () => {
    render(<EditorShell />);

    expect(
      screen.getByRole("heading", { name: "ArkUML", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_DOCUMENT_TITLE)).toBeInTheDocument();
    expect(
      screen.getByText("Editor de diagramas de casos de uso"),
    ).toBeInTheDocument();
  });

  it("activa las herramientas de elemento y Asociación, y mantiene Include/Extend inertes", async () => {
    const user = userEvent.setup();
    render(<EditorShell />);

    const actor = screen.getByRole("button", { name: "Actor" });
    const useCase = screen.getByRole("button", { name: "Caso de uso" });
    const boundary = screen.getByRole("button", { name: "Límite del sistema" });
    const association = screen.getByRole("button", { name: "Asociación" });

    expect(actor).not.toHaveAttribute("aria-disabled", "true");
    expect(useCase).not.toHaveAttribute("aria-disabled", "true");
    expect(boundary).toHaveAttribute("aria-disabled", "true");
    expect(boundary).toHaveAttribute(
      "title",
      "Ya existe un límite del sistema. El documento admite uno solo.",
    );
    expect(association).not.toHaveAttribute("aria-disabled", "true");

    await user.click(actor);
    expect(actor).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Escape}");
    expect(actor).toHaveAttribute("aria-pressed", "false");

    await user.click(association);
    expect(association).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Escape}");
    expect(association).toHaveAttribute("aria-pressed", "false");

    for (const tool of PALETTE_RELATIONSHIP_TOOLS) {
      if (!("reason" in tool)) {
        continue;
      }
      const button = screen.getByRole("button", { name: tool.label });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("title", tool.reason);
    }
  });

  it("habilita el boundary cuando el documento no tiene uno", () => {
    const createId = sequentialIds();
    const deps = {
      createId,
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    };
    const document = createDiagramDocument(deps);
    const boundary = document.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    const store = createEditorStore({
      document: expectOk(deleteElements(document, [boundary.id], deps)),
      deps,
    });

    render(
      <EditorStoreProvider store={store}>
        <EditorShell />
      </EditorStoreProvider>,
    );

    const button = screen.getByRole("button", { name: "Límite del sistema" });
    expect(button).not.toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("explica por qué las acciones aún no operativas del top bar están inertes", () => {
    render(<EditorShell />);

    const actions = [
      ["Nuevo", "Nuevo diagrama aún no está disponible."],
      ["Exportar", "Exportar aún no está disponible."],
    ] as const;

    for (const [name, reason] of actions) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("title", reason);
    }
  });

  it("habilita deshacer y rehacer según canUndo/canRedo", async () => {
    const user = userEvent.setup();
    const createId = sequentialIds();
    const deps = {
      createId,
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    };
    const store = createEditorStore({
      document: createDiagramDocument(deps),
      deps: { ...deps, now: () => new Date("2026-09-08T08:00:00.000Z") },
    });

    render(
      <EditorStoreProvider store={store}>
        <EditorShell />
      </EditorStoreProvider>,
    );

    const undo = screen.getByRole("button", { name: "Deshacer" });
    const redo = screen.getByRole("button", { name: "Rehacer" });
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();

    act(() => {
      expectOk(
        store
          .getState()
          .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
      );
    });
    expect(undo).toBeEnabled();
    expect(redo).toBeDisabled();

    await user.click(undo);
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(false);
    expect(undo).toBeDisabled();
    expect(redo).toBeEnabled();

    await user.click(redo);
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(true);
  });

  it("abre la ayuda con la lista de atajos", async () => {
    const user = userEvent.setup();
    render(<EditorShell />);

    await user.click(screen.getByRole("button", { name: "Ayuda" }));
    const dialog = screen.getByRole("dialog", { name: "Ayuda" });
    expect(dialog).toHaveTextContent("Ctrl/Cmd+Z");
    expect(dialog).toHaveTextContent("Ctrl/Cmd+D");
    expect(dialog).toHaveTextContent("Delete / Backspace");
    expect(dialog).toHaveTextContent("Editor de diagramas de casos de uso");

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(
      screen.queryByRole("dialog", { name: "Ayuda" }),
    ).not.toBeInTheDocument();
  });

  it("muestra zoom y un estado de guardado que no finge persistencia", () => {
    render(<EditorShell zoomPercent={100} />);

    const status = screen.getByRole("status", { name: "Estado del editor" });
    expect(status).toHaveTextContent("Zoom 100%");
    expect(status).toHaveTextContent("Guardado: —");
  });

  it("conserva el aviso de viewport estrecho en el árbol", () => {
    render(<EditorShell />);

    expect(screen.getByRole("alert", { hidden: true })).toHaveTextContent(
      /el diagrama no se borra/i,
    );
  });

  it("abre y cierra el drawer de paleta", async () => {
    const user = userEvent.setup();
    render(<EditorShell />);

    const toggle = screen.getByRole("button", { name: "Paleta" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Cerrar paneles" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar paneles" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Cerrar paneles" }),
    ).not.toBeInTheDocument();
  });

  it("cierra drawers con Escape", async () => {
    const user = userEvent.setup();
    render(<EditorShell />);

    const toggle = screen.getByRole("button", { name: "Inspector" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
