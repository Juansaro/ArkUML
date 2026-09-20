import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import { relationshipLabel } from "../../domain/diagram/rules.ts";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import {
  ASSEMBLY_BALL_RADIUS,
  ASSEMBLY_SOCKET_RADIUS,
  openArrowPath,
  shortenLine,
  sourceBallCenter,
  targetSocketPath,
} from "./markers.ts";
import styles from "./ComponentRelationshipEdge.module.css";

function ComponentRelationshipEdgeView(props: EdgeProps<DiagramEdge>) {
  const kind = props.data?.kind ?? "component-usage";
  const line = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  };
  const isUsage = kind === "component-usage";
  const isAssembly = kind === "assembly-connector";
  const [path, labelX, labelY] = getStraightPath(
    shortenLine(
      line,
      isAssembly ? ASSEMBLY_BALL_RADIUS * 2 : 0,
      isAssembly ? ASSEMBLY_SOCKET_RADIUS : isUsage ? 0 : 0,
    ),
  );
  const stereotype = isUsage ? relationshipLabel(kind) : undefined;
  const customName =
    props.data?.name !== undefined && props.data.name.length > 0
      ? props.data.name
      : undefined;
  const labelText = stereotype ?? customName;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        className={`${styles.path ?? ""} ${isUsage ? styles.dashed ?? "" : ""}`}
        interactionWidth={EDGE_INTERACTION_WIDTH}
      />
      {isUsage ? (
        <path
          d={openArrowPath(line)}
          className={styles.marker ?? ""}
          data-testid="component-usage-arrow"
        />
      ) : null}
      {isAssembly ? (
        <>
          <circle
            {...sourceBallCenter(line)}
            r={ASSEMBLY_BALL_RADIUS}
            className={styles.ball ?? ""}
            data-testid="assembly-ball"
          />
          <path
            d={targetSocketPath(line)}
            className={styles.socket ?? ""}
            data-testid="assembly-socket"
          />
        </>
      ) : null}
      {labelText !== undefined ? (
        <StereotypeLabel x={labelX} y={labelY} text={labelText} />
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
      data-testid="component-relationship-label"
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

export const ComponentRelationshipEdge = memo(ComponentRelationshipEdgeView);
