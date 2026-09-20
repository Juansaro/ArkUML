import type { MouseEvent } from "react";
import { useStore, type MiniMapNodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import styles from "./DiagramCanvas.module.css";

const ACTOR_VIEWBOX = { width: 48, height: 72 } as const;
const NOTATION_STROKE = 2;
const BOUNDARY_FILL = "rgb(255 255 255 / 0.28)";
const NAME_FONT_SIZE = 13;

export function minimapNodeClassName(node: DiagramNode): string {
  return node.type ?? "actor";
}

export function FlowDiagramMinimapNode(props: MiniMapNodeProps) {
  const name = useStore((state) => {
    const data = state.nodeLookup.get(props.id)?.internals.userNode.data;
    if (
      typeof data === "object" &&
      data !== null &&
      "name" in data &&
      typeof data.name === "string"
    ) {
      return data.name;
    }
    return "";
  });
  return <DiagramMinimapNode {...props} name={name} />;
}

export function DiagramMinimapNode({
  id,
  x,
  y,
  width,
  height,
  className,
  name = "",
  onClick,
}: MiniMapNodeProps & { name?: string }) {
  const handleClick = onClick
    ? (event: MouseEvent) => {
        onClick(event, id);
      }
    : undefined;
  const inset = NOTATION_STROKE / 2;

  if (className === "system-boundary") {
    return (
      <g data-minimap-kind="system-boundary" onClick={handleClick}>
        <rect
          className={styles.minimapBoundary}
          x={x + inset}
          y={y + inset}
          width={Math.max(0, width - NOTATION_STROKE)}
          height={Math.max(0, height - NOTATION_STROKE)}
          fill={BOUNDARY_FILL}
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        {name === "" ? null : (
          <text
            className={styles.minimapLabel}
            x={x + width / 2}
            y={y + 4 + NAME_FONT_SIZE}
            textAnchor="middle"
            fontSize={NAME_FONT_SIZE}
            aria-hidden="true"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  if (className === "use-case") {
    return (
      <g data-minimap-kind="use-case" onClick={handleClick}>
        <ellipse
          className={styles.minimapUseCase}
          cx={x + width / 2}
          cy={y + height / 2}
          rx={Math.max(0, width / 2 - inset)}
          ry={Math.max(0, height / 2 - inset)}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        {name === "" ? null : (
          <text
            className={styles.minimapLabel}
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={NAME_FONT_SIZE}
            aria-hidden="true"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  if (className === "lifeline") {
    const headHeight = Math.min(height, 40);
    return (
      <g data-minimap-kind="lifeline" onClick={handleClick}>
        <rect
          x={x + inset}
          y={y + inset}
          width={Math.max(0, width - NOTATION_STROKE)}
          height={Math.max(0, headHeight - NOTATION_STROKE)}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        <line
          x1={x + width / 2}
          y1={y + headHeight}
          x2={x + width / 2}
          y2={y + height}
          stroke="var(--color-fg)"
          strokeDasharray="4 3"
          strokeWidth={NOTATION_STROKE}
        />
        {name === "" ? null : (
          <text
            className={styles.minimapLabel}
            x={x + width / 2}
            y={y + headHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={NAME_FONT_SIZE}
            aria-hidden="true"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  if (className === "component" || className === "class" || className === "artifact" || className === "entity" || className === "action" || className === "interaction-occurrence") {
    const radius = className === "action" ? 8 : 0;
    return (
      <g data-minimap-kind={className} onClick={handleClick}>
        <rect
          x={x + inset}
          y={y + inset}
          width={Math.max(0, width - NOTATION_STROKE)}
          height={Math.max(0, height - NOTATION_STROKE)}
          rx={radius}
          ry={radius}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        {name === "" ? null : (
          <text
            className={styles.minimapLabel}
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={NAME_FONT_SIZE}
            aria-hidden="true"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  if (className === "attribute") {
    return (
      <g data-minimap-kind="attribute" onClick={handleClick}>
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={Math.max(0, width / 2 - inset)}
          ry={Math.max(0, height / 2 - inset)}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        {name === "" ? null : (
          <text
            className={styles.minimapLabel}
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={NAME_FONT_SIZE}
            aria-hidden="true"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  if (
    className === "er-relationship" ||
    className === "decision-node" ||
    className === "merge-node"
  ) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    return (
      <g data-minimap-kind={className} onClick={handleClick}>
        <polygon
          points={`${cx},${y + inset} ${x + width - inset},${cy} ${cx},${y + height - inset} ${x + inset},${cy}`}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        {name === "" ? null : (
          <text
            className={styles.minimapLabel}
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={NAME_FONT_SIZE}
            aria-hidden="true"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  if (className === "initial-node") {
    return (
      <g data-minimap-kind="initial-node" onClick={handleClick}>
        <circle
          cx={x + width / 2}
          cy={y + height / 2}
          r={Math.max(0, Math.min(width, height) / 2 - inset)}
          fill="var(--color-fg)"
          stroke="none"
        />
      </g>
    );
  }

  if (className === "activity-final") {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const outer = Math.max(0, Math.min(width, height) / 2 - inset);
    return (
      <g data-minimap-kind="activity-final" onClick={handleClick}>
        <circle
          cx={cx}
          cy={cy}
          r={outer}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        <circle
          cx={cx}
          cy={cy}
          r={outer * 0.45}
          fill="var(--color-fg)"
          stroke="none"
        />
      </g>
    );
  }

  if (className === "fork-node" || className === "join-node") {
    return (
      <g data-minimap-kind={className} onClick={handleClick}>
        <rect
          x={x + inset}
          y={y + inset}
          width={Math.max(0, width - NOTATION_STROKE)}
          height={Math.max(0, height - NOTATION_STROKE)}
          fill="var(--color-fg)"
          stroke="none"
        />
      </g>
    );
  }

  if (className === "node") {
    const top = 8;
    const skew = 8;
    return (
      <g data-minimap-kind="node" onClick={handleClick}>
        <path
          d={`M ${x + inset} ${y + top} L ${x + width - skew - inset} ${y + top} L ${x + width - inset} ${y + inset} L ${x + skew + inset} ${y + inset} Z`}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        <rect
          x={x + inset}
          y={y + top}
          width={Math.max(0, width - skew - NOTATION_STROKE)}
          height={Math.max(0, height - top - inset)}
          fill="var(--color-surface)"
          stroke="var(--color-fg)"
          strokeWidth={NOTATION_STROKE}
        />
        {name === "" ? null : (
          <text
            className={styles.minimapLabel}
            x={x + (width - skew) / 2}
            y={y + top + (height - top) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={NAME_FONT_SIZE}
            aria-hidden="true"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  const scale = Math.min(
    width / ACTOR_VIEWBOX.width,
    height / ACTOR_VIEWBOX.height,
  );
  const ox = x + (width - ACTOR_VIEWBOX.width * scale) / 2;

  return (
    <g data-minimap-kind="actor" onClick={handleClick}>
      <g
        className={styles.minimapActor}
        transform={`translate(${ox} ${y}) scale(${scale})`}
      >
        <circle cx={24} cy={12} r={8} />
        <line x1={24} y1={20} x2={24} y2={42} />
        <line x1={10} y1={30} x2={38} y2={30} />
        <line x1={24} y1={42} x2={12} y2={66} />
        <line x1={24} y1={42} x2={36} y2={66} />
      </g>
      {name === "" ? null : (
        <text
          className={styles.minimapLabel}
          x={x + width / 2}
          y={y + height - 2}
          textAnchor="middle"
          fontSize={NAME_FONT_SIZE}
          aria-hidden="true"
        >
          {name}
        </text>
      )}
    </g>
  );
}
