import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./EntityNode.module.css";

function EntityNodeView({
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
      <div className={styles.box} data-testid="entity-box">
        <div className={styles.name} data-testid="entity-name">
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

export const EntityNode = memo(EntityNodeView);
