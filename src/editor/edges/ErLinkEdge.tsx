import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import { multiplicityAnchor } from "./markers.ts";
import styles from "./ErLinkEdge.module.css";

function ErLinkEdgeView(props: EdgeProps<DiagramEdge>) {
  const line = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  };
  const [path] = getStraightPath(line);
  const cardinality = props.data?.cardinality;
  const cardinalityEnd = props.data?.cardinalityEnd;
  const labelPosition =
    cardinality === undefined || cardinalityEnd === undefined
      ? undefined
      : multiplicityAnchor(line, cardinalityEnd);

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        className={styles.path ?? ""}
        interactionWidth={EDGE_INTERACTION_WIDTH}
      />
      {labelPosition !== undefined && cardinality !== undefined ? (
        <text
          className={styles.cardinality ?? ""}
          x={labelPosition.x}
          y={labelPosition.y}
          textAnchor="middle"
          data-testid="er-cardinality"
        >
          {cardinality}
        </text>
      ) : null}
    </>
  );
}

export const ErLinkEdge = memo(ErLinkEdgeView);
