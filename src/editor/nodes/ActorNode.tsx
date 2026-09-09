import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./ActorNode.module.css";

function ActorNodeView({
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
      <svg
        className={styles.figure}
        viewBox="0 0 48 72"
        aria-hidden="true"
        data-testid="actor-figure"
        focusable="false"
      >
        <circle cx="24" cy="12" r="8" />
        <line x1="24" y1="20" x2="24" y2="42" />
        <line x1="10" y1="30" x2="38" y2="30" />
        <line x1="24" y1="42" x2="12" y2="66" />
        <line x1="24" y1="42" x2="36" y2="66" />
      </svg>
      <InlineNameEditor
        id={id}
        name={data.name}
        className={styles.name}
        editing={data.editing === true}
      />
      <NodeHandles />
    </div>
  );
}

export const ActorNode = memo(ActorNodeView);
