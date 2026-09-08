import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./SystemBoundaryNode.module.css";

function SystemBoundaryNodeView({
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
      <div className={styles.rect} data-testid="system-boundary-rect">
        <InlineNameEditor id={id} name={data.name} className={styles.name} />
      </div>
      <NodeHandles />
    </div>
  );
}

export const SystemBoundaryNode = memo(SystemBoundaryNodeView);
