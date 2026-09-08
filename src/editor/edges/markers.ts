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
