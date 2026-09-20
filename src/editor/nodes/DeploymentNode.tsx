import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { InlineNameEditor } from "./InlineNameEditor.tsx";
import { handleHostClassName, NodeHandles } from "./NodeHandles.tsx";
import styles from "./DeploymentNode.module.css";

const TOP_DEPTH = 14;
const SIDE_SKEW = 14;

function DeploymentNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<DiagramNode>) {
  const w = width ?? 200;
  const h = height ?? 120;
  const frontTop = TOP_DEPTH;
  const frontBottom = h - 2;
  const frontLeft = 2;
  const frontRight = w - SIDE_SKEW - 2;

  return (
    <div
      className={`${styles.node} ${handleHostClassName}`}
      data-kind={data.kind}
      data-selected={selected ? "true" : "false"}
      data-testid={`diagram-node-${id}`}
      style={{ width, height }}
    >
      <svg
        className={styles.prism}
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        aria-hidden="true"
        focusable="false"
        data-testid="deployment-node-prism"
      >
        <path
          className={styles.face}
          d={`M ${frontLeft} ${frontTop} L ${frontRight} ${frontTop} L ${w - 2} ${2} L ${frontLeft + SIDE_SKEW} ${2} Z`}
          data-testid="deployment-node-top"
        />
        <path
          className={styles.face}
          d={`M ${frontRight} ${frontTop} L ${w - 2} ${2} L ${w - 2} ${frontBottom - TOP_DEPTH + 2} L ${frontRight} ${frontBottom} Z`}
          data-testid="deployment-node-side"
        />
        <rect
          className={styles.face}
          x={frontLeft}
          y={frontTop}
          width={Math.max(0, frontRight - frontLeft)}
          height={Math.max(0, frontBottom - frontTop)}
          data-testid="deployment-node-front"
        />
      </svg>
      <div className={styles.name} data-testid="deployment-node-name">
        <InlineNameEditor
          id={id}
          name={data.name}
          className={styles.nameText}
          editing={data.editing === true}
        />
      </div>
      <NodeHandles />
    </div>
  );
}

export const DeploymentNode = memo(DeploymentNodeView);
