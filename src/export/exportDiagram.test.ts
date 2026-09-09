import { describe, expect, it } from "vitest";
import { evaluateExportScale } from "./bounds.ts";
import {
  excludeExportChrome,
  ExportError,
  exportDiagram,
  isExportError,
} from "./exportDiagram.ts";

describe("excludeExportChrome", () => {
  it("incluye nodos sin getAttribute (html-to-image recorre Text)", () => {
    expect(excludeExportChrome({} as HTMLElement)).toBe(true);
  });

  it("excluye handles, grid, selección, inspector y avisos de overlay", () => {
    function node(attributes: Record<string, string>): HTMLElement {
      return {
        getAttribute: (name: string) => attributes[name] ?? null,
      } as unknown as HTMLElement;
    }

    expect(excludeExportChrome(node({ class: "react-flow__handle" }))).toBe(
      false,
    );
    expect(
      excludeExportChrome(node({ class: "react-flow__edge-interaction" })),
    ).toBe(false);
    expect(excludeExportChrome(node({ class: "react-flow__background" }))).toBe(
      false,
    );
    expect(excludeExportChrome(node({ class: "react-flow__controls" }))).toBe(
      false,
    );
    expect(
      excludeExportChrome(node({ class: "react-flow__attribution" })),
    ).toBe(false);
    expect(
      excludeExportChrome(node({ class: "react-flow__resize-control" })),
    ).toBe(false);
    expect(excludeExportChrome(node({ class: "react-flow__selection" }))).toBe(
      false,
    );
    expect(excludeExportChrome(node({ "data-testid": "inspector" }))).toBe(
      false,
    );
    expect(
      excludeExportChrome(node({ "data-testid": "inspector-warning" })),
    ).toBe(false);
    expect(excludeExportChrome(node({ role: "alert" }))).toBe(false);
    expect(excludeExportChrome(node({ class: "react-flow__edge-path" }))).toBe(
      true,
    );
  });
});

describe("exportDiagram limits", () => {
  it("lanza un error reintentable y sugiere 1x si 2x excede", async () => {
    const bounds = { x: 0, y: 0, width: 3000, height: 3000 };
    expect(evaluateExportScale(bounds, 2).suggestScale).toBe(1);

    const error = await exportDiagram(
      {
        viewportElement: document.createElement("div"),
        bounds,
      },
      { format: "png", scale: 2 },
    ).catch((caught: unknown) => caught);

    expect(isExportError(error)).toBe(true);
    if (!isExportError(error)) {
      throw new Error("Expected ExportError");
    }
    expect(error).toBeInstanceOf(ExportError);
    expect(error.code).toBe("SIZE_LIMIT");
    expect(error.retryable).toBe(true);
    expect(error.suggestScale).toBe(1);
    expect(error.message).toMatch(/1x/);
  });
});
