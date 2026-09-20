import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./AttributeNode.module.css";

function AttributeNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<DiagramNode>) {
  const isKey = data.isKey === true;

  return (
    <div
      className={`${styles.node} ${handleHostClassName}`}
      data-kind={data.kind}
      data-key={isKey ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      data-testid={`diagram-node-${id}`}
      style={{ width, height }}
    >
      <div className={styles.ellipse} data-testid="attribute-ellipse">
        <div className={styles.name} data-testid="attribute-name">
          <InlineNameEditor
            id={id}
            name={data.name}
            className={`${styles.nameText} ${isKey ? styles.keyName : ""}`}
            editing={data.editing === true}
          />
        </div>
      </div>
      <NodeHandles />
    </div>
  );
}

export const AttributeNode = memo(AttributeNodeView);
