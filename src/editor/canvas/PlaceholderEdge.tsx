import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";

function PlaceholderEdgeView(props: EdgeProps<DiagramEdge>) {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });

  return <BaseEdge id={props.id} path={path} />;
}

export const PlaceholderEdge = memo(PlaceholderEdgeView);
