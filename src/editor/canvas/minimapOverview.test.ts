import { describe, expect, it } from "vitest";
import {
  MINIMAP_BASE_HEIGHT,
  MINIMAP_BASE_WIDTH,
  boundsEqual,
  minimapFrameSize,
  padMinimapBounds,
  unionNodeBounds,
} from "./minimapOverview.ts";

function node(
  x: number,
  y: number,
  width: number,
  height: number,
  hidden = false,
) {
  return {
    hidden,
    internals: { positionAbsolute: { x, y } },
    width,
    height,
  };
}

describe("minimapOverview", () => {
  it("une boundary y actor para el plano completo", () => {
    const bounds = unionNodeBounds([
      node(0, 0, 640, 400),
      node(80, 480, 48, 96),
    ]);
    expect(bounds).toEqual({ x: 0, y: 0, width: 640, height: 576 });
  });

  it("ajusta el marco al aspecto del plano y lo duplica al ampliar", () => {
    const bounds = { x: 0, y: 0, width: 640, height: 400 };
    const collapsed = minimapFrameSize(bounds, false);
    const expanded = minimapFrameSize(bounds, true);
    expect(collapsed.width).toBeLessThanOrEqual(MINIMAP_BASE_WIDTH);
    expect(collapsed.height).toBeLessThanOrEqual(MINIMAP_BASE_HEIGHT);
    expect(collapsed.width / collapsed.height).toBeCloseTo(
      padMinimapBounds(bounds).width / padMinimapBounds(bounds).height,
      2,
    );
    expect(expanded.width).toBe(collapsed.width * 2);
    expect(expanded.height).toBe(collapsed.height * 2);
  });

  it("compara bounds por valor", () => {
    expect(
      boundsEqual(
        { x: 1, y: 2, width: 3, height: 4 },
        { x: 1, y: 2, width: 3, height: 4 },
      ),
    ).toBe(true);
    expect(boundsEqual(null, null)).toBe(true);
    expect(
      boundsEqual(
        { x: 1, y: 2, width: 3, height: 4 },
        { x: 1, y: 2, width: 3, height: 5 },
      ),
    ).toBe(false);
  });
});
