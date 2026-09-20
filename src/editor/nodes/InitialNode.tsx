import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./InitialNode.module.css";

function InitialNodeView({
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
      <div className={styles.circle} data-testid="initial-node-circle" />
      <NodeHandles />
    </div>
  );
}

export const InitialNode = memo(InitialNodeView);
