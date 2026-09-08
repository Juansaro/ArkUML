import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import { relationshipLabel } from "../../domain/diagram/rules.ts";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import styles from "./DependencyEdge.module.css";
import { openArrowPath } from "./markers.ts";

function DependencyEdgeView(props: EdgeProps<DiagramEdge>) {
  const kind = props.data?.kind;
  const stereotype =
    kind === "include" || kind === "extend"
      ? relationshipLabel(kind)
      : undefined;
  const line = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  };
  const [path, labelX, labelY] = getStraightPath(line);

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        className={styles.path ?? ""}
        interactionWidth={EDGE_INTERACTION_WIDTH}
      />
      <path
        d={openArrowPath(line)}
        className={styles.marker}
        data-testid="dependency-arrow"
      />
      {stereotype !== undefined ? (
        <StereotypeLabel x={labelX} y={labelY} text={stereotype} />
      ) : null}
    </>
  );
}

function StereotypeLabel({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) {
  const width = text.length * 7.25 + 10;
  const height = 18;

  return (
    <g
      data-testid="dependency-stereotype"
      pointerEvents="none"
      transform={`translate(${x}, ${y})`}
    >
      <rect
        className={styles.labelBg}
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={2}
      />
      <text
        className={styles.label}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  );
}

export const DependencyEdge = memo(DependencyEdgeView);
