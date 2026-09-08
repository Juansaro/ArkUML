import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import styles from "./AssociationEdge.module.css";

function AssociationEdgeView(props: EdgeProps<DiagramEdge>) {
  const [path] = getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  });

  return (
    <BaseEdge
      id={props.id}
      path={path}
      className={styles.path ?? ""}
      interactionWidth={EDGE_INTERACTION_WIDTH}
    />
  );
}

export const AssociationEdge = memo(AssociationEdgeView);
