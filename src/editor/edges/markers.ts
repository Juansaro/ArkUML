export const OPEN_ARROW_SIZE = 12;

export type EdgeLine = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

export type OpenArrowPoints = {
  leftX: number;
  leftY: number;
  tipX: number;
  tipY: number;
  rightX: number;
  rightY: number;
};

export function openArrowPoints(
  line: EdgeLine,
  size = OPEN_ARROW_SIZE,
): OpenArrowPoints {
  const dx = line.targetX - line.sourceX;
  const dy = line.targetY - line.sourceY;
  const length = Math.hypot(dx, dy);
  const ux = length === 0 ? 1 : dx / length;
  const uy = length === 0 ? 0 : dy / length;
  const px = -uy;
  const py = ux;
  const wing = size * 0.45;

  return {
    leftX: line.targetX - ux * size + px * wing,
    leftY: line.targetY - uy * size + py * wing,
    tipX: line.targetX,
    tipY: line.targetY,
    rightX: line.targetX - ux * size - px * wing,
    rightY: line.targetY - uy * size - py * wing,
  };
}

export function openArrowPath(line: EdgeLine, size = OPEN_ARROW_SIZE): string {
  const arrow = openArrowPoints(line, size);
  return `M ${arrow.leftX} ${arrow.leftY} L ${arrow.tipX} ${arrow.tipY} L ${arrow.rightX} ${arrow.rightY}`;
}

export function filledArrowPath(line: EdgeLine, size = OPEN_ARROW_SIZE): string {
  const arrow = openArrowPoints(line, size);
  return `M ${arrow.leftX} ${arrow.leftY} L ${arrow.tipX} ${arrow.tipY} L ${arrow.rightX} ${arrow.rightY} Z`;
}

export const CLASS_MARKER_SIZE = 14;

export type LineUnit = {
  ux: number;
  uy: number;
  px: number;
  py: number;
};

export function lineUnit(line: EdgeLine): LineUnit {
  const dx = line.targetX - line.sourceX;
  const dy = line.targetY - line.sourceY;
  const length = Math.hypot(dx, dy);
  const ux = length === 0 ? 1 : dx / length;
  const uy = length === 0 ? 0 : dy / length;
  return { ux, uy, px: -uy, py: ux };
}

export function shortenLine(
  line: EdgeLine,
  sourceTrim: number,
  targetTrim: number,
): EdgeLine {
  const { ux, uy } = lineUnit(line);
  return {
    sourceX: line.sourceX + ux * sourceTrim,
    sourceY: line.sourceY + uy * sourceTrim,
    targetX: line.targetX - ux * targetTrim,
    targetY: line.targetY - uy * targetTrim,
  };
}

export function sourceDiamondPath(
  line: EdgeLine,
  size = CLASS_MARKER_SIZE,
): string {
  const { ux, uy, px, py } = lineUnit(line);
  const nearX = line.sourceX;
  const nearY = line.sourceY;
  const farX = line.sourceX + ux * size;
  const farY = line.sourceY + uy * size;
  const midX = line.sourceX + ux * (size / 2);
  const midY = line.sourceY + uy * (size / 2);
  const half = size * 0.45;
  return `M ${nearX} ${nearY} L ${midX + px * half} ${midY + py * half} L ${farX} ${farY} L ${midX - px * half} ${midY - py * half} Z`;
}

export function targetTrianglePath(
  line: EdgeLine,
  size = CLASS_MARKER_SIZE,
): string {
  const { ux, uy, px, py } = lineUnit(line);
  const tipX = line.targetX;
  const tipY = line.targetY;
  const baseX = line.targetX - ux * size;
  const baseY = line.targetY - uy * size;
  const half = size * 0.5;
  return `M ${tipX} ${tipY} L ${baseX + px * half} ${baseY + py * half} L ${baseX - px * half} ${baseY - py * half} Z`;
}

export function multiplicityAnchor(
  line: EdgeLine,
  end: "source" | "target",
  along = 18,
  offset = 12,
): { x: number; y: number } {
  const { ux, uy, px, py } = lineUnit(line);
  if (end === "source") {
    return {
      x: line.sourceX + ux * along + px * offset,
      y: line.sourceY + uy * along + py * offset,
    };
  }
  return {
    x: line.targetX - ux * along + px * offset,
    y: line.targetY - uy * along + py * offset,
  };
}

export const ASSEMBLY_BALL_RADIUS = 5;
export const ASSEMBLY_SOCKET_RADIUS = 8;

export function sourceBallCenter(
  line: EdgeLine,
  radius = ASSEMBLY_BALL_RADIUS,
): { cx: number; cy: number } {
  const { ux, uy } = lineUnit(line);
  return {
    cx: line.sourceX + ux * radius,
    cy: line.sourceY + uy * radius,
  };
}

export function targetSocketPath(
  line: EdgeLine,
  radius = ASSEMBLY_SOCKET_RADIUS,
): string {
  const { ux, uy, px, py } = lineUnit(line);
  const cx = line.targetX - ux * radius;
  const cy = line.targetY - uy * radius;
  const startX = cx + px * radius;
  const startY = cy + py * radius;
  const endX = cx - px * radius;
  const endY = cy - py * radius;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
}
