export const MINIMAP_BASE_WIDTH = 200;
export const MINIMAP_BASE_HEIGHT = 150;
export const MINIMAP_PADDING_RATIO = 0.08;
export const MINIMAP_MIN_PADDING = 16;

export type MinimapBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MinimapNodeBox = {
  hidden?: boolean;
  internals: { positionAbsolute: { x: number; y: number } };
  measured?: { width?: number; height?: number };
  width?: number;
  height?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export function nodeBox(node: MinimapNodeBox): MinimapBounds {
  const width = node.width ?? node.measured?.width ?? node.initialWidth ?? 0;
  const height =
    node.height ?? node.measured?.height ?? node.initialHeight ?? 0;
  return {
    x: node.internals.positionAbsolute.x,
    y: node.internals.positionAbsolute.y,
    width,
    height,
  };
}

export function unionNodeBounds(
  nodes: Iterable<MinimapNodeBox>,
): MinimapBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;
  for (const node of nodes) {
    if (node.hidden === true) {
      continue;
    }
    const box = nodeBox(node);
    if (box.width <= 0 && box.height <= 0) {
      continue;
    }
    found = true;
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  if (!found) {
    return null;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function padMinimapBounds(bounds: MinimapBounds): MinimapBounds {
  const pad = Math.max(
    MINIMAP_MIN_PADDING,
    Math.max(bounds.width, bounds.height) * MINIMAP_PADDING_RATIO,
  );
  return {
    x: bounds.x - pad,
    y: bounds.y - pad,
    width: bounds.width + pad * 2,
    height: bounds.height + pad * 2,
  };
}

export function minimapFrameSize(
  bounds: MinimapBounds | null,
  expanded: boolean,
): { width: number; height: number } {
  if (bounds === null || bounds.width <= 0 || bounds.height <= 0) {
    return {
      width: MINIMAP_BASE_WIDTH * (expanded ? 2 : 1),
      height: MINIMAP_BASE_HEIGHT * (expanded ? 2 : 1),
    };
  }
  const padded = padMinimapBounds(bounds);
  const scale = Math.min(
    MINIMAP_BASE_WIDTH / padded.width,
    MINIMAP_BASE_HEIGHT / padded.height,
  );
  const width = Math.max(1, Math.round(padded.width * scale));
  const height = Math.max(1, Math.round(padded.height * scale));
  if (!expanded) {
    return { width, height };
  }
  return { width: width * 2, height: height * 2 };
}

export function boundsEqual(
  left: MinimapBounds | null,
  right: MinimapBounds | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (left === null || right === null) {
    return false;
  }
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}
