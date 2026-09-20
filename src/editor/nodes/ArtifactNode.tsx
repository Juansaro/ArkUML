import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./ArtifactNode.module.css";

function ArtifactNodeView({
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
      <div className={styles.box} data-testid="artifact-box">
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          data-testid="artifact-icon"
        >
          <path className={styles.iconStroke} d="M7 3h7l5 5v13H7z" />
          <path className={styles.iconStroke} d="M14 3v5h5" />
        </svg>
        <div className={styles.name} data-testid="artifact-name">
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

export const ArtifactNode = memo(ArtifactNodeView);
