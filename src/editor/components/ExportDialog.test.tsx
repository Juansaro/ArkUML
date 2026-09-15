import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createDiagramDocument } from "../../domain/diagram/factories.ts";
import type { DiagramDocument } from "../../domain/diagram/model.ts";
import {
  CLIPBOARD_COPIED_MESSAGE,
  CLIPBOARD_COPY_FAILED_MESSAGE,
  ClipboardCopyError,
} from "../../export/copyExportImage.ts";
import {
  ExportError,
  type ExportDiagramResult,
} from "../../export/exportDiagram.ts";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";
import {
  ExportDialog,
  type ExportClipboard,
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
  copyImage = () => Promise.resolve(),
  queryViewport = () => document.createElement("div"),
  onCancel = () => {
    /* default no-op */
  },
  diagramDocument,
}: {
  runExport?: ExportRunner;
  download?: ExportDownloader;
  copyImage?: ExportClipboard;
  queryViewport?: () => HTMLElement | null;
  onCancel?: () => void;
  diagramDocument?: DiagramDocument;
} = {}) {
  const store = createEditorStore({
    document:
      diagramDocument ??
      createDiagramDocument({
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
          copyImage={copyImage}
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
    expect(screen.getByRole("button", { name: "Copiar" })).toBeDisabled();
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

  it("Copiar usa el raster elegido y no descarga archivo", async () => {
    let exportCalls = 0;
    let exportFormat: string | undefined;
    let exportScale: number | undefined;
    const runExport: ExportRunner = (input, options) => {
      exportCalls += 1;
      exportFormat = options.format;
      exportScale = options.scale;
      expect(input.bounds).toEqual({ x: -32, y: -32, width: 704, height: 464 });
      return Promise.resolve({
        blob: new Blob(["jpeg"], { type: "image/jpeg" }),
        width: 1408,
        height: 928,
      });
    };
    let downloadCalls = 0;
    let copyCalls = 0;
    let copiedType: string | undefined;
    let cancelCalls = 0;
    const { store, user } = renderDialog({
      runExport,
      download: () => {
        downloadCalls += 1;
      },
      copyImage: (blob, format) => {
        copyCalls += 1;
        copiedType = format;
        expect(blob.type).toBe("image/jpeg");
        return Promise.resolve();
      },
      onCancel: () => {
        cancelCalls += 1;
      },
    });
    const before = store.getState().document;

    await user.click(screen.getByRole("radio", { name: "JPG" }));
    await user.click(screen.getByRole("radio", { name: "2x" }));
    await user.click(screen.getByRole("button", { name: "Copiar" }));

    await waitFor(() => {
      expect(copyCalls).toBe(1);
    });
    expect(exportCalls).toBe(1);
    expect(exportFormat).toBe("jpg");
    expect(exportScale).toBe(2);
    expect(copiedType).toBe("jpg");
    expect(downloadCalls).toBe(0);
    expect(cancelCalls).toBe(1);
    expect(store.getState().document).toBe(before);
    expect(store.getState().ui.message).toBe(CLIPBOARD_COPIED_MESSAGE);
  });

  it("Copiar no lanza otra exportación si ya está ocupado", async () => {
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
    let copyCalls = 0;
    const { user } = renderDialog({
      runExport,
      copyImage: () => {
        copyCalls += 1;
        return Promise.resolve();
      },
    });

    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(screen.getByRole("button", { name: "Copiar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descargar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(exportCalls).toBe(1);

    resolveExport(SUCCESS_RESULT);
    await waitFor(() => {
      expect(copyCalls).toBe(1);
    });
  });

  it("permiso denegado muestra el aviso y deja descargar", async () => {
    let downloadCalls = 0;
    let cancelCalls = 0;
    const { store, user } = renderDialog({
      copyImage: () => Promise.reject(new ClipboardCopyError()),
      download: () => {
        downloadCalls += 1;
      },
      onCancel: () => {
        cancelCalls += 1;
      },
    });
    const before = store.getState().document;

    await user.click(screen.getByRole("button", { name: "Copiar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      CLIPBOARD_COPY_FAILED_MESSAGE,
    );
    expect(
      screen.getByRole("dialog", { name: "Exportar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar" })).toBeEnabled();
    expect(downloadCalls).toBe(0);
    expect(cancelCalls).toBe(0);
    expect(store.getState().document).toBe(before);
    expect(store.getState().ui.message).toBeUndefined();
  });

  it("2x que excede el techo no copia; sugiere 1x", async () => {
    const diagramDocument = oversizedDiagram();
    let exportCalls = 0;
    let copyCalls = 0;
    const { user } = renderDialog({
      diagramDocument,
      runExport: () => {
        exportCalls += 1;
        return Promise.resolve(SUCCESS_RESULT);
      },
      copyImage: () => {
        copyCalls += 1;
        return Promise.resolve();
      },
    });

    await user.click(screen.getByRole("radio", { name: "2x" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Prueba 1x/);
    expect(screen.getByRole("button", { name: "Copiar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descargar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(exportCalls).toBe(0);
    expect(copyCalls).toBe(0);
  });
});

function oversizedDiagram(): DiagramDocument {
  const document = createDiagramDocument({
    createId: () => "00000000-0000-4000-8000-000000000001",
    now: () => new Date("2026-09-07T12:00:00.000Z"),
  });
  return {
    ...document,
    elements: document.elements.map((element) =>
      element.kind === "system-boundary"
        ? {
            ...element,
            geometry: { x: 0, y: 0, width: 3000, height: 3000 },
          }
        : element,
    ),
  };
}
