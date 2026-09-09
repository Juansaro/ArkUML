import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDARY_GEOMETRY } from "../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../domain/diagram/factories.ts";
import type { Result } from "../domain/diagram/model.ts";
import { createElement, deleteElements } from "../domain/diagram/operations.ts";
import {
  diagramContentBounds,
  evaluateExportScale,
  exportViewportTransform,
  isWithinExportLimits,
  paddedExportBounds,
  rasterDimensions,
} from "./bounds.ts";

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
    throw new Error(result.error.message);
  }
  return result.value;
}

function documentWithDeps() {
  const createId = sequentialIds();
  const deps = {
    createId,
    now: () => new Date("2026-09-07T12:00:00.000Z"),
  };
  return { deps, document: createDiagramDocument(deps) };
}

describe("export bounds", () => {
  it("une la geometría absoluta de todos los elementos y añade padding 32", () => {
    const { document } = documentWithDeps();
    const content = diagramContentBounds(document);
    expect(content).toEqual({
      x: DEFAULT_BOUNDARY_GEOMETRY.x,
      y: DEFAULT_BOUNDARY_GEOMETRY.y,
      width: DEFAULT_BOUNDARY_GEOMETRY.width,
      height: DEFAULT_BOUNDARY_GEOMETRY.height,
    });
    expect(paddedExportBounds(content)).toEqual({
      x: -32,
      y: -32,
      width: 704,
      height: 464,
    });
  });

  it("incluye actores fuera del viewport y casos relativos al boundary", () => {
    const { deps, document: initial } = documentWithDeps();
    const boundary = initial.elements[0];
    if (boundary === undefined) {
      throw new Error("Falta el boundary");
    }
    const withActor = expectOk(
      createElement(
        initial,
        {
          kind: "actor",
          name: "Usuario",
          geometry: { x: -120, y: 40, width: 48, height: 96 },
        },
        deps,
      ),
    );
    const withUseCase = expectOk(
      createElement(
        withActor,
        {
          kind: "use-case",
          name: "Login",
          geometry: { x: 80, y: 80, width: 160, height: 80 },
          parentId: boundary.id,
        },
        deps,
      ),
    );

    expect(diagramContentBounds(withUseCase)).toEqual({
      x: -120,
      y: 0,
      width: 760,
      height: 400,
    });
  });

  it("usa un caja vacía si no hay elementos", () => {
    const { deps, document } = documentWithDeps();
    const ids = document.elements.map((element) => element.id);
    const empty = expectOk(deleteElements(document, ids, deps));
    expect(diagramContentBounds(empty)).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    expect(paddedExportBounds(diagramContentBounds(empty))).toEqual({
      x: -32,
      y: -32,
      width: 64,
      height: 64,
    });
  });

  it("no muta el viewport: el transform es translate del origen padded a 0,0", () => {
    const bounds = { x: -32, y: -48, width: 200, height: 100 };
    expect(exportViewportTransform(bounds)).toEqual({
      x: 32,
      y: 48,
      zoom: 1,
    });
  });
});

describe("export scale and limits", () => {
  it("escala 1x y 2x de forma coherente", () => {
    const bounds = { x: -32, y: -32, width: 704, height: 464 };
    expect(rasterDimensions(bounds, 1)).toEqual({ width: 704, height: 464 });
    expect(rasterDimensions(bounds, 2)).toEqual({ width: 1408, height: 928 });
  });

  it("acepta 4000x4000 y rechaza 4096x4096 por megapíxeles", () => {
    expect(isWithinExportLimits(4000, 4000)).toBe(true);
    expect(isWithinExportLimits(4096, 4096)).toBe(false);
    expect(isWithinExportLimits(4100, 100)).toBe(false);
  });

  it("sugiere 1x cuando 2x supera el límite y 1x cabe", () => {
    const bounds = { x: 0, y: 0, width: 3000, height: 3000 };
    expect(evaluateExportScale(bounds, 2)).toEqual({
      width: 6000,
      height: 6000,
      allowed: false,
      suggestScale: 1,
    });
    expect(evaluateExportScale(bounds, 1)).toMatchObject({
      allowed: true,
      suggestScale: undefined,
    });
  });

  it("no sugiere escala si 1x también excede", () => {
    const bounds = { x: 0, y: 0, width: 5000, height: 100 };
    expect(evaluateExportScale(bounds, 1)).toEqual({
      width: 5000,
      height: 100,
      allowed: false,
      suggestScale: undefined,
    });
  });
});
