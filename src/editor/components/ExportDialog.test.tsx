import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createDiagramDocument } from "../../domain/diagram/factories.ts";
import {
  ExportError,
  type ExportDiagramResult,
} from "../../export/exportDiagram.ts";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";
import {
  ExportDialog,
  type ExportDownloader,
  type ExportRunner,
} from "./ExportDialog.tsx";

const SUCCESS_RESULT: ExportDiagramResult = {
  blob: new Blob(["png"], { type: "image/png" }),
  width: 704,
  height: 464,
};

function renderDialog({
  runExport = () => Promise.resolve(SUCCESS_RESULT),
  download = () => {
    /* default no-op */
  },
  queryViewport = () => document.createElement("div"),
  onCancel = () => {
    /* default no-op */
  },
}: {
  runExport?: ExportRunner;
  download?: ExportDownloader;
  queryViewport?: () => HTMLElement | null;
  onCancel?: () => void;
} = {}) {
  const store = createEditorStore({
    document: createDiagramDocument({
      createId: () => "00000000-0000-4000-8000-000000000001",
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    }),
  });
  return {
    store,
    user: userEvent.setup(),
    ...render(
      <EditorStoreProvider store={store}>
        <ExportDialog
          onCancel={onCancel}
          runExport={runExport}
          download={download}
          queryViewport={queryViewport}
        />
      </EditorStoreProvider>,
    ),
  };
}

describe("ExportDialog", () => {
  it("muestra formato, escala y dimensiones 1x del diagrama", () => {
    renderDialog();
    expect(
      screen.getByRole("dialog", { name: "Exportar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "PNG" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "1x" })).toBeChecked();
    expect(screen.getByTestId("export-dimensions")).toHaveTextContent(
      "704 × 464 px",
    );
    expect(screen.getByTestId("export-dimensions")).toHaveTextContent(
      "Diagrama de casos de uso.png",
    );
  });

  it("cambia a JPG 2x y actualiza el nombre y el tamaño", async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole("radio", { name: "JPG" }));
    await user.click(screen.getByRole("radio", { name: "2x" }));
    expect(screen.getByTestId("export-dimensions")).toHaveTextContent(
      "1408 × 928 px",
    );
    expect(screen.getByTestId("export-dimensions")).toHaveTextContent(
      "Diagrama de casos de uso.jpg",
    );
  });

  it("descarga y cierra; un segundo clic no lanza otra exportación", async () => {
    let resolveExport: (value: ExportDiagramResult) => void = () => {
      /* assigned below */
    };
    let exportCalls = 0;
    const runExport: ExportRunner = () => {
      exportCalls += 1;
      return new Promise((resolve) => {
        resolveExport = resolve;
      });
    };
    let downloadCalls = 0;
    const download: ExportDownloader = () => {
      downloadCalls += 1;
    };
    let cancelCalls = 0;
    const { user } = renderDialog({
      runExport,
      download,
      onCancel: () => {
        cancelCalls += 1;
      },
    });

    await user.click(screen.getByRole("button", { name: "Descargar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Exportando…");
    expect(screen.getByRole("button", { name: "Descargar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Descargar" }));
    expect(exportCalls).toBe(1);

    resolveExport(SUCCESS_RESULT);
    await waitFor(() => {
      expect(downloadCalls).toBe(1);
      expect(cancelCalls).toBe(1);
    });
  });

  it("muestra un error reintentable de rasterización", async () => {
    const runExport: ExportRunner = () =>
      Promise.reject(
        new ExportError(
          "RASTERIZE",
          "No se pudo generar la imagen. Puedes reintentar.",
        ),
      );
    const { user } = renderDialog({ runExport });

    await user.click(screen.getByRole("button", { name: "Descargar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/reintentar/i);
    expect(screen.getByRole("button", { name: "Descargar" })).toBeEnabled();
  });

  it("Escape cancela y no descarga", async () => {
    let cancelCalls = 0;
    let downloadCalls = 0;
    const { user } = renderDialog({
      onCancel: () => {
        cancelCalls += 1;
      },
      download: () => {
        downloadCalls += 1;
      },
    });
    await user.keyboard("{Escape}");
    expect(cancelCalls).toBe(1);
    expect(downloadCalls).toBe(0);
  });
});
