import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import { openArrowPath } from "./markers.ts";
import styles from "./ControlFlowEdge.module.css";

function ControlFlowEdgeView(props: EdgeProps<DiagramEdge>) {
  const line = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  };
  const [path, labelX, labelY] = getStraightPath(line);
  const guard = props.data?.guard?.trim() ?? "";
  const guardText = guard.length > 0 ? `[${guard}]` : undefined;

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
        className={styles.marker ?? ""}
        data-testid="control-flow-arrow"
      />
      {guardText !== undefined ? (
        <GuardLabel x={labelX} y={labelY} text={guardText} />
      ) : null}
    </>
  );
}

function GuardLabel({
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
      data-testid="control-flow-guard"
      pointerEvents="all"
      transform={`translate(${x}, ${y - 16})`}
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

export const ControlFlowEdge = memo(ControlFlowEdgeView);
