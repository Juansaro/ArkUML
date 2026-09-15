import { describe, expect, it } from "vitest";
import {
  sequenceMessageArrowLine,
  sequenceMessagePath,
  SELF_MESSAGE_HEIGHT,
  SELF_MESSAGE_WIDTH,
} from "./sequenceMessagePath.ts";

describe("sequenceMessagePath", () => {
  it("traza una flecha horizontal entre dos lifelines", () => {
    expect(
      sequenceMessagePath({ sourceX: 60, targetX: 300, y: 80, self: false }),
    ).toBe("M 60 80 L 300 80");
  });

  it("traza un self-message en U a la derecha del stem", () => {
    expect(
      sequenceMessagePath({ sourceX: 60, targetX: 60, y: 80, self: true }),
    ).toBe(
      `M 60 80 L ${60 + SELF_MESSAGE_WIDTH} 80 L ${60 + SELF_MESSAGE_WIDTH} ${80 + SELF_MESSAGE_HEIGHT} L 60 ${80 + SELF_MESSAGE_HEIGHT}`,
    );
  });
});

describe("sequenceMessageArrowLine", () => {
  it("apunta al destino en un mensaje entre lifelines", () => {
    expect(
      sequenceMessageArrowLine({
        sourceX: 60,
        targetX: 300,
        y: 80,
        self: false,
      }),
    ).toEqual({
      sourceX: 60,
      sourceY: 80,
      targetX: 300,
      targetY: 80,
    });
  });

  it("apunta al stem en un self-message", () => {
    expect(
      sequenceMessageArrowLine({
        sourceX: 60,
        targetX: 60,
        y: 80,
        self: true,
      }),
    ).toEqual({
      sourceX: 60 + SELF_MESSAGE_WIDTH,
      sourceY: 80 + SELF_MESSAGE_HEIGHT,
      targetX: 60,
      targetY: 80 + SELF_MESSAGE_HEIGHT,
    });
  });
});
