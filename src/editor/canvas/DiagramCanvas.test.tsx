import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_VERSION } from "../../domain/diagram/defaults.ts";
import { parseWorkspaceSnapshot } from "../../domain/diagram/schema.ts";
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

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubCompactLayout(compact: boolean): void {
  vi.stubGlobal("matchMedia", (query: string): MediaQueryList => ({
    matches: query === "(max-width: 1023px)" ? compact : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

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
    expect(screen.getByTestId("element-name")).toHaveTextContent("Sistema");
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

  it("muestra el minimap a chrome completo y no escribe historial ni documento", () => {
    stubCompactLayout(false);
    const { store } = renderCanvas();
    const history = store.getState().history;
    const before = JSON.stringify(store.getState().document);

    const minimap = screen.getByTestId("diagram-minimap");
    expect(minimap).toHaveAttribute("aria-label", "Mapa del diagrama");
    expect(minimap.querySelector(".react-flow__minimap")).not.toBeNull();
    expect(screen.getByTestId("minimap-expand")).toBeInTheDocument();

    store.getState().setViewport({ x: 12, y: 24, zoom: 1.5 });
    expect(store.getState().history).toBe(history);
    expect(JSON.stringify(store.getState().document)).toBe(before);

    const document = store.getState().document;
    const snapshot = {
      storageVersion: STORAGE_VERSION,
      activeDocumentId: document.id,
      documents: [
        {
          document,
          view: store.getState().viewport,
        },
      ],
    };
    expect(Object.keys(snapshot).sort()).toEqual([
      "activeDocumentId",
      "documents",
      "storageVersion",
    ]);
    expect(document.schemaVersion).toBe(2);
    expect(
      parseWorkspaceSnapshot(JSON.parse(JSON.stringify(snapshot))),
    ).toEqual({
      ok: true,
      value: snapshot,
    });
  });

  it("no monta el minimap bajo 1024 px", () => {
    stubCompactLayout(true);
    renderCanvas();
    expect(screen.queryByTestId("diagram-minimap")).not.toBeInTheDocument();
  });

  it("pinta boundary, actor y caso con la notación del lienzo", () => {
    stubCompactLayout(false);
    const store = createEditorStore();
    store.getState().createActor({
      name: "Usuario",
      geometry: { x: -80, y: 480, width: 48, height: 96 },
    });
    const boundary = store
      .getState()
      .document.elements.find((element) => element.kind === "system-boundary");
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    store.getState().createUseCase({
      name: "Login",
      geometry: { x: 80, y: 80, width: 160, height: 80 },
      parentId: boundary.id,
    });
    renderCanvas(store);

    const minimap = screen.getByTestId("diagram-minimap");
    expect(
      minimap.querySelector('[data-minimap-kind="system-boundary"] rect'),
    ).not.toBeNull();
    expect(
      minimap.querySelector('[data-minimap-kind="use-case"] ellipse'),
    ).not.toBeNull();
    expect(
      minimap.querySelector('[data-minimap-kind="actor"] circle'),
    ).not.toBeNull();
    expect(
      minimap.querySelector('[data-minimap-kind="system-boundary"]'),
    ).toHaveTextContent("Sistema");
    expect(
      minimap.querySelector('[data-minimap-kind="use-case"]'),
    ).toHaveTextContent("Login");

    const svg = minimap.querySelector("svg.react-flow__minimap-svg");
    const viewBox = svg?.getAttribute("viewBox")?.split(" ").map(Number) ?? [];
    expect(viewBox).toHaveLength(4);
    const mapX = viewBox[0];
    const mapY = viewBox[1];
    const mapW = viewBox[2];
    const mapH = viewBox[3];
    expect(mapX).toBeDefined();
    expect(mapY).toBeDefined();
    expect(mapW).toBeDefined();
    expect(mapH).toBeDefined();
    if (
      mapX === undefined ||
      mapY === undefined ||
      mapW === undefined ||
      mapH === undefined
    ) {
      throw new Error("Falta viewBox del minimap");
    }
    expect(mapX + mapW).toBeGreaterThan(640);
    expect(mapY + mapH).toBeGreaterThan(480 + 96);
    expect(minimap.querySelector(".react-flow__minimap-mask")).not.toBeNull();
  });

  it("amplía el minimap al doble sin escribir historial ni documento", async () => {
    stubCompactLayout(false);
    const user = userEvent.setup();
    const { store } = renderCanvas();
    const history = store.getState().history;
    const before = JSON.stringify(store.getState().document);

    const minimap = screen.getByTestId("diagram-minimap");
    const width = Number.parseFloat(minimap.style.width);
    const height = Number.parseFloat(minimap.style.height);
    expect(width).toBeGreaterThan(0);
    expect(minimap).toHaveAttribute("data-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Ampliar mapa" }));
    expect(minimap).toHaveAttribute("data-expanded", "true");
    expect(Number.parseFloat(minimap.style.width)).toBe(width * 2);
    expect(Number.parseFloat(minimap.style.height)).toBe(height * 2);
    expect(store.getState().history).toBe(history);
    expect(JSON.stringify(store.getState().document)).toBe(before);

    await user.click(screen.getByRole("button", { name: "Reducir mapa" }));
    expect(minimap).toHaveAttribute("data-expanded", "false");
    expect(Number.parseFloat(minimap.style.width)).toBe(width);
  });
});
