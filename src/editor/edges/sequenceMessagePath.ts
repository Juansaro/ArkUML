import type { EdgeLine } from "./markers.ts";

export const SELF_MESSAGE_WIDTH = 40;
export const SELF_MESSAGE_HEIGHT = 24;

export function isSelfMessage(sourceId: string, targetId: string): boolean {
  return sourceId === targetId;
}

export function sequenceMessagePath(input: {
  sourceX: number;
  targetX: number;
  y: number;
  self: boolean;
}): string {
  if (input.self) {
    const right = input.sourceX + SELF_MESSAGE_WIDTH;
    const bottom = input.y + SELF_MESSAGE_HEIGHT;
    return `M ${input.sourceX} ${input.y} L ${right} ${input.y} L ${right} ${bottom} L ${input.sourceX} ${bottom}`;
  }
  return `M ${input.sourceX} ${input.y} L ${input.targetX} ${input.y}`;
}

export function sequenceMessageArrowLine(input: {
  sourceX: number;
  targetX: number;
  y: number;
  self: boolean;
}): EdgeLine {
  if (input.self) {
    const bottom = input.y + SELF_MESSAGE_HEIGHT;
    return {
      sourceX: input.sourceX + SELF_MESSAGE_WIDTH,
      sourceY: bottom,
      targetX: input.sourceX,
      targetY: bottom,
    };
  }
  return {
    sourceX: input.sourceX,
    sourceY: input.y,
    targetX: input.targetX,
    targetY: input.y,
  };
}
