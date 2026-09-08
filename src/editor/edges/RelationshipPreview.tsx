import { memo } from "react";
import {
  getStraightPath,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import styles from "./RelationshipPreview.module.css";

function RelationshipPreviewView({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}: ConnectionLineComponentProps<DiagramNode>) {
  const [path] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <path
      d={path}
      className={styles.line}
      data-testid="relationship-preview"
      data-status={connectionStatus ?? "pending"}
    />
  );
}

export const RelationshipPreview = memo(RelationshipPreviewView);
