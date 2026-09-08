import { describe, expect, it } from "vitest";
import { openArrowPath, openArrowPoints } from "./markers.ts";

describe("openArrowPoints", () => {
  it("apunta al target y deja las alas detrás en un trazo horizontal", () => {
    const arrow = openArrowPoints({
      sourceX: 0,
      sourceY: 16,
      targetX: 120,
      targetY: 16,
    });

    expect(arrow.tipX).toBe(120);
    expect(arrow.tipY).toBe(16);
    expect(arrow.leftX).toBeLessThan(arrow.tipX);
    expect(arrow.rightX).toBeLessThan(arrow.tipX);
    expect(Math.sign(arrow.leftY - arrow.tipY)).not.toBe(
      Math.sign(arrow.rightY - arrow.tipY),
    );
  });

  it("apunta al target en un trazo inverso sin reescribir el sentido", () => {
    const arrow = openArrowPoints({
      sourceX: 200,
      sourceY: 40,
      targetX: 40,
      targetY: 40,
    });

    expect(arrow.tipX).toBe(40);
    expect(arrow.leftX).toBeGreaterThan(arrow.tipX);
    expect(arrow.rightX).toBeGreaterThan(arrow.tipX);
  });

  it("usa dirección por defecto si origen y destino coinciden", () => {
    const arrow = openArrowPoints({
      sourceX: 10,
      sourceY: 10,
      targetX: 10,
      targetY: 10,
    });

    expect(arrow.tipX).toBe(10);
    expect(arrow.tipY).toBe(10);
    expect(arrow.leftX).toBeLessThan(arrow.tipX);
  });
});

describe("openArrowPath", () => {
  it("serializa un chevron abierto SVG", () => {
    const path = openArrowPath({
      sourceX: 0,
      sourceY: 0,
      targetX: 40,
      targetY: 0,
    });

    expect(path).toMatch(/^M /);
    expect(path).toContain(" L 40 0 L ");
    expect(path).not.toMatch(/Z$/i);
  });
});
