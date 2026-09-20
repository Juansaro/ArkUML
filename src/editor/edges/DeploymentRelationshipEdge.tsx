import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import { relationshipLabel } from "../../domain/diagram/rules.ts";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import { openArrowPath } from "./markers.ts";
import styles from "./DeploymentRelationshipEdge.module.css";

function DeploymentRelationshipEdgeView(props: EdgeProps<DiagramEdge>) {
  const kind = props.data?.kind ?? "communication-path";
  const line = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  };
  const isDeploy = kind === "deploy";
  const [path, labelX, labelY] = getStraightPath(line);
  const stereotype = isDeploy ? relationshipLabel(kind) : undefined;
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
        className={`${styles.path ?? ""} ${isDeploy ? styles.dashed ?? "" : ""}`}
        interactionWidth={EDGE_INTERACTION_WIDTH}
      />
      {isDeploy ? (
        <path
          d={openArrowPath(line)}
          className={styles.marker ?? ""}
          data-testid="deploy-arrow"
        />
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
      data-testid="deployment-relationship-label"
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

export const DeploymentRelationshipEdge = memo(DeploymentRelationshipEdgeView);
