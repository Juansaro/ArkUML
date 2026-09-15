import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName } from "./NodeHandles.tsx";
import handleStyles from "./NodeHandles.module.css";
import styles from "./LifelineNode.module.css";

function LifelineNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<DiagramNode>) {
  const stemLength = data.stemLength ?? 0;
  const boxHeight = height ?? 0;
  const headHeight = Math.max(0, boxHeight - stemLength);

  return (
    <div
      className={`${styles.node} ${handleHostClassName}`}
      data-kind={data.kind}
      data-selected={selected ? "true" : "false"}
      data-testid={`diagram-node-${id}`}
      style={{ width, height }}
    >
      <div
        className={styles.head}
        data-testid="lifeline-head"
        style={{ height: headHeight }}
      >
        <InlineNameEditor
          id={id}
          name={data.name}
          className={styles.name}
          editing={data.editing === true}
        />
      </div>
      <svg
        className={styles.stem}
        data-testid="lifeline-stem"
        aria-hidden="true"
        focusable="false"
      >
        <line x1="50%" y1="0" x2="50%" y2="100%" />
      </svg>
      <Handle
        id="stem"
        type="target"
        position={Position.Left}
        className={`${handleStyles.handle} ${styles.stemHandle}`}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Handle
        id="stem"
        type="source"
        position={Position.Right}
        className={`${handleStyles.handle} ${styles.stemHandle}`}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

export const LifelineNode = memo(LifelineNodeView);
