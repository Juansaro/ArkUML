import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./ActivityFinalNode.module.css";

function ActivityFinalNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<DiagramNode>) {
  return (
    <div
      className={`${styles.node} ${handleHostClassName}`}
      data-kind={data.kind}
      data-selected={selected ? "true" : "false"}
      data-testid={`diagram-node-${id}`}
      style={{ width, height }}
    >
      <div className={styles.bullseye} data-testid="activity-final-bullseye">
        <div className={styles.outer} />
        <div className={styles.inner} />
      </div>
      <NodeHandles />
    </div>
  );
}

export const ActivityFinalNode = memo(ActivityFinalNodeView);
