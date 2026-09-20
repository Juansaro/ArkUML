import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./ComponentNode.module.css";

function ComponentNodeView({
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
      <div className={styles.box} data-testid="component-box">
        <svg
          className={styles.icon}
          viewBox="0 0 22 18"
          aria-hidden="true"
          focusable="false"
          data-testid="component-icon"
        >
          <rect
            className={styles.iconMain}
            x="6"
            y="1"
            width="15"
            height="16"
          />
          <rect className={styles.iconPort} x="1" y="4" width="8" height="4" />
          <rect className={styles.iconPort} x="1" y="10" width="8" height="4" />
        </svg>
        <div className={styles.name} data-testid="component-name">
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

export const ComponentNode = memo(ComponentNodeView);
