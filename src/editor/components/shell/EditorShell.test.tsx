import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { DEFAULT_DOCUMENT_TITLE } from "../../../domain/diagram/defaults.ts";
import {
  INVALID_DOCUMENT_FILE_MESSAGE,
  serializeDocumentFile,
} from "../../../domain/diagram/documentFile.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../../domain/diagram/factories.ts";
import type {
  Geometry,
  Result,
  Viewport,
} from "../../../domain/diagram/model.ts";
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
    const mark = screen
      .getByRole("banner")
      .querySelector("svg[aria-hidden='true']");
    expect(mark).not.toBeNull();
  });

  it("activa las herramientas de elemento y de relación", async () => {
    const user = userEvent.setup();
    render(<EditorShell />);

    const actor = screen.getByRole("button", { name: "Actor" });
    const useCase = screen.getByRole("button", { name: "Caso de uso" });
    const boundary = screen.getByRole("button", { name: "Límite del sistema" });
    const association = screen.getByRole("button", { name: "Asociación" });
    const include = screen.getByRole("button", { name: "Include" });
    const extend = screen.getByRole("button", { name: "Extend" });

    expect(actor).not.toHaveAttribute("aria-disabled", "true");
    expect(useCase).not.toHaveAttribute("aria-disabled", "true");
    expect(boundary).toHaveAttribute("aria-disabled", "true");
    expect(boundary).not.toHaveAttribute("disabled");
    expect(association).not.toHaveAttribute("aria-disabled", "true");
    expect(include).not.toHaveAttribute("aria-disabled", "true");
    expect(extend).not.toHaveAttribute("aria-disabled", "true");

    await user.click(boundary);
    expect(screen.getByTestId("editor-tooltip")).toHaveTextContent(
      "Ya existe un límite del sistema. El documento admite uno solo.",
    );
    await user.keyboard("{Escape}");
    await user.click(include);
    expect(screen.getByTestId("editor-tooltip")).toHaveTextContent(
      "Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte.",
    );
    await user.keyboard("{Escape}");
    await user.click(extend);
    expect(screen.getByTestId("editor-tooltip")).toHaveTextContent(
      "Origen: caso que extiende. Destino: caso base. Arrastra del origen al destino; el sentido no se invierte.",
    );
    await user.keyboard("{Escape}");

    await user.click(actor);
    expect(actor).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Escape}");
    await user.keyboard("{Escape}");
    expect(actor).toHaveAttribute("aria-pressed", "false");

    for (const tool of PALETTE_RELATIONSHIP_TOOLS) {
      const button = screen.getByRole("button", { name: tool.label });
      await user.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      await user.keyboard("{Escape}");
      await user.keyboard("{Escape}");
      expect(button).toHaveAttribute("aria-pressed", "false");
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

  it("abre el diálogo de exportar", async () => {
    const user = userEvent.setup();
    render(<EditorShell />);

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    const dialog = screen.getByRole("dialog", { name: "Exportar" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "PNG" })).toBeChecked();
    expect(dialog).toHaveTextContent("704 × 464 px");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("dialog", { name: "Exportar" }),
    ).not.toBeInTheDocument();
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
    expect(undo).toHaveAttribute("aria-disabled", "true");
    expect(redo).toHaveAttribute("aria-disabled", "true");
    expect(undo).not.toHaveAttribute("disabled");
    expect(redo).not.toHaveAttribute("disabled");

    act(() => {
      expectOk(
        store
          .getState()
          .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
      );
    });
    expect(undo).not.toHaveAttribute("aria-disabled");
    expect(redo).toHaveAttribute("aria-disabled", "true");

    await user.click(undo);
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(false);
    expect(undo).toHaveAttribute("aria-disabled", "true");
    expect(redo).not.toHaveAttribute("aria-disabled");

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

  it("muestra zoom y el estado de guardado idle", () => {
    render(<EditorShell zoomPercent={100} />);

    const status = screen.getByRole("status", { name: "Estado del editor" });
    expect(status).toHaveTextContent("Zoom 100%");
    expect(status).toHaveTextContent("—");
    expect(screen.getByTestId("save-status")).toHaveAttribute(
      "data-state",
      "idle",
    );
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
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("Nuevo cancelado conserva el documento; confirmado resetea a Sistema", async () => {
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

    act(() => {
      expectOk(
        store
          .getState()
          .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
      );
    });
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = screen.getByRole("dialog", { name: "Nuevo diagrama" });
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("dialog", { name: "Nuevo diagrama" }),
    ).not.toBeInTheDocument();
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    await user.click(
      screen.getByRole("button", { name: "Crear diagrama nuevo" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Nuevo diagrama" }),
    ).not.toBeInTheDocument();
    expect(
      store
        .getState()
        .document.elements.some((element) => element.kind === "actor"),
    ).toBe(false);
    expect(
      store
        .getState()
        .document.elements.find((element) => element.kind === "system-boundary")
        ?.name,
    ).toBe("Sistema");
    expect(store.getState().history.past).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Deshacer" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("devuelve el foco al control que abrió el diálogo", async () => {
    const user = userEvent.setup();
    render(<EditorShell />);

    const help = screen.getByRole("button", { name: "Ayuda" });
    await user.click(help);
    expect(screen.getByRole("dialog", { name: "Ayuda" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(help).toHaveFocus();

    const exportButton = screen.getByRole("button", { name: "Exportar" });
    await user.click(exportButton);
    expect(
      screen.getByRole("dialog", { name: "Exportar" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(exportButton).toHaveFocus();
  });

  it("expone Abrir y Guardar JSON icon-only con el input de archivo", () => {
    render(<EditorShell />);

    expect(screen.getByRole("button", { name: "Abrir" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar JSON" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("document-file-input")).toHaveAttribute(
      "accept",
      ".json,application/json",
    );
  });

  it("Abrir archivo cancelado no muta; confirmado sustituye documento, viewport e historial", async () => {
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
    const imported = createDiagramDocument({
      createId: sequentialIds(80),
      now: () => new Date("2026-09-09T10:00:00.000Z"),
    });
    const importedView: Viewport = { x: 48, y: -24, zoom: 1.25 };
    const json = serializeDocumentFile(
      {
        ...imported,
        metadata: { ...imported.metadata, title: "Importado" },
      },
      importedView,
    );

    render(
      <EditorStoreProvider store={store}>
        <EditorShell />
      </EditorStoreProvider>,
    );

    act(() => {
      expectOk(
        store
          .getState()
          .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
      );
    });
    const before = store.getState().document;

    await user.upload(
      screen.getByTestId("document-file-input"),
      new File([json], "Importado.arkuml.json", { type: "application/json" }),
    );

    const dialog = await screen.findByRole("dialog", { name: "Abrir archivo" });
    expect(dialog).toHaveTextContent(
      "Se perderá el diagrama actual. Esta acción no se puede deshacer.",
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("dialog", { name: "Abrir archivo" }),
    ).not.toBeInTheDocument();
    expect(store.getState().document).toBe(before);

    await user.upload(
      screen.getByTestId("document-file-input"),
      new File([json], "Importado.arkuml.json", { type: "application/json" }),
    );
    await screen.findByRole("dialog", { name: "Abrir archivo" });
    await user.click(screen.getByRole("button", { name: "Abrir archivo" }));

    expect(
      screen.queryByRole("dialog", { name: "Abrir archivo" }),
    ).not.toBeInTheDocument();
    expect(store.getState().document.metadata.title).toBe("Importado");
    expect(store.getState().viewport).toEqual(importedView);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.future).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Deshacer" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("rechaza JSON inválido con el mensaje visible y sin mutar el documento", async () => {
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

    act(() => {
      expectOk(
        store
          .getState()
          .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
      );
    });
    const before = store.getState().document;

    await user.upload(
      screen.getByTestId("document-file-input"),
      new File(["{not-json"], "basura.json", { type: "application/json" }),
    );

    expect(
      await screen.findByRole("alertdialog", {
        name: INVALID_DOCUMENT_FILE_MESSAGE,
      }),
    ).toBeInTheDocument();
    expect(store.getState().document).toBe(before);
    expect(screen.getByTestId("editor-live")).toHaveTextContent(
      INVALID_DOCUMENT_FILE_MESSAGE,
    );
  });
});
