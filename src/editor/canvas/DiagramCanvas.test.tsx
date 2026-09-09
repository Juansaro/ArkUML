import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "../components/common/Tooltip.tsx";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";
import {
  CANVAS_FIT_VIEW_OPTIONS,
  CANVAS_MAX_ZOOM,
  CANVAS_MIN_ZOOM,
  DiagramCanvas,
} from "./DiagramCanvas.tsx";
import { edgeTypes } from "./edgeTypes.ts";
import { nodeTypes } from "./nodeTypes.ts";

function renderCanvas(
  store = createEditorStore({
    viewport: { x: 48, y: -24, zoom: 1.25 },
  }),
) {
  return {
    store,
    ...render(
      <TooltipProvider>
        <EditorStoreProvider store={store}>
          <div style={{ width: 800, height: 600 }}>
            <DiagramCanvas />
          </div>
        </EditorStoreProvider>
      </TooltipProvider>,
    ),
  };
}

describe("DiagramCanvas", () => {
  it("expone testid estable y el boundary del documento default", () => {
    renderCanvas();

    expect(screen.getByTestId("diagram-canvas")).toBeInTheDocument();
    expect(screen.getByText("Sistema")).toBeInTheDocument();
    expect(screen.getByTestId("system-boundary-rect")).toBeInTheDocument();
    expect(screen.queryByTestId("alignment-guides")).not.toBeInTheDocument();
  });

  it("restaura el viewport del store en el primer pintado", () => {
    renderCanvas();
    const viewport = document.querySelector(".react-flow__viewport");
    expect(viewport).not.toBeNull();
    expect(viewport?.getAttribute("style") ?? "").toMatch(/48px/);
    expect(viewport?.getAttribute("style") ?? "").toMatch(/-24px/);
    expect(viewport?.getAttribute("style") ?? "").toMatch(/1\.25/);
  });

  it("no registra historial al cambiar solo el viewport", () => {
    const { store } = renderCanvas();
    const history = store.getState().history;
    store.getState().setViewport({ x: 10, y: 20, zoom: 1.5 });
    expect(store.getState().history).toBe(history);
    expect(store.getState().document.elements).toHaveLength(1);
  });

  it("exporta nodeTypes y edgeTypes a nivel de módulo", () => {
    expect(Object.keys(nodeTypes)).toEqual([
      "actor",
      "use-case",
      "system-boundary",
    ]);
    expect(Object.keys(edgeTypes)).toEqual([
      "association",
      "include",
      "extend",
    ]);
  });

  it("expone controles de viewport propios y no escribe historial al usarlos", async () => {
    const user = userEvent.setup();
    const { store } = renderCanvas();
    const history = store.getState().history;
    const zoomIn = screen.getByRole("button", { name: "Acercar" });
    const zoomOut = screen.getByRole("button", { name: "Alejar" });
    const fit = screen.getByRole("button", { name: "Ajustar vista" });

    await user.click(zoomIn);
    await user.click(zoomOut);
    await user.click(fit);

    expect(store.getState().history).toBe(history);
    expect(CANVAS_FIT_VIEW_OPTIONS).toEqual({ padding: 0.2, duration: 0 });
  });

  it("marca acercar y alejar indisponibles en los topes de zoom", () => {
    const maxed = createEditorStore({
      viewport: { x: 0, y: 0, zoom: CANVAS_MAX_ZOOM },
    });
    const { unmount } = renderCanvas(maxed);
    expect(screen.getByRole("button", { name: "Acercar" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    unmount();

    renderCanvas(
      createEditorStore({
        viewport: { x: 0, y: 0, zoom: CANVAS_MIN_ZOOM },
      }),
    );
    expect(screen.getByRole("button", { name: "Alejar" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
