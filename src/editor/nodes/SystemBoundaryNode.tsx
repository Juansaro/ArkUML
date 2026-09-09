import { memo } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import {
  MIN_BOUNDARY_HEIGHT,
  MIN_BOUNDARY_WIDTH,
} from "../../domain/diagram/defaults.ts";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { useBoundaryResize } from "../interactions/useBoundaryResize.ts";
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
  const resize = useBoundaryResize(id);

  return (
    <div
      className={`${styles.node} ${handleHostClassName}`}
      data-kind={data.kind}
      data-selected={selected ? "true" : "false"}
      data-testid={`diagram-node-${id}`}
      style={{ width, height }}
    >
      <NodeResizer
        minWidth={MIN_BOUNDARY_WIDTH}
        minHeight={MIN_BOUNDARY_HEIGHT}
        isVisible
        handleClassName={styles.resizeHandle ?? ""}
        lineClassName={styles.resizeLine ?? ""}
        onResizeStart={resize.onResizeStart}
        onResize={resize.onResize}
        onResizeEnd={resize.onResizeEnd}
      />
      <div className={styles.rect} data-testid="system-boundary-rect">
        <InlineNameEditor
          id={id}
          name={data.name}
          className={styles.name}
          editing={data.editing === true}
        />
      </div>
      <NodeHandles />
    </div>
  );
}

export const SystemBoundaryNode = memo(SystemBoundaryNodeView);
