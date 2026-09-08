import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";
import { DiagramCanvas } from "./DiagramCanvas.tsx";
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
      <EditorStoreProvider store={store}>
        <div style={{ width: 800, height: 600 }}>
          <DiagramCanvas />
        </div>
      </EditorStoreProvider>,
    ),
  };
}

describe("DiagramCanvas", () => {
  it("expone testid estable y el boundary del documento default", () => {
    renderCanvas();

    expect(screen.getByTestId("diagram-canvas")).toBeInTheDocument();
    expect(screen.getByText("Sistema")).toBeInTheDocument();
    expect(screen.getByTestId("system-boundary-rect")).toBeInTheDocument();
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
});
