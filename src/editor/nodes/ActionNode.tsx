import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./ActionNode.module.css";

function ActionNodeView({
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
      <div className={styles.box} data-testid="action-box">
        <div className={styles.name} data-testid="action-name">
          <InlineNameEditor
            id={id}
            name={data.name}
            className={styles.nameText}
            editing={data.editing === true}
          />
        </div>
      </div>
      <NodeHandles />
    </div>
  );
}

export const ActionNode = memo(ActionNodeView);
