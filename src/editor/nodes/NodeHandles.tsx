import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "./NodeHandles.module.css";

const HANDLE_POSITIONS: ReadonlyArray<{
  id: "top" | "right" | "bottom" | "left";
  position: Position;
}> = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
];

export const handleHostClassName = styles.host;

function NodeHandlesView() {
  return (
    <>
      {HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`target-${handle.id}`}
          id={handle.id}
          type="target"
          position={handle.position}
          className={styles.handle}
          aria-hidden="true"
          tabIndex={-1}
        />
      ))}
      {HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`source-${handle.id}`}
          id={handle.id}
          type="source"
          position={handle.position}
          className={styles.handle}
          aria-hidden="true"
          tabIndex={-1}
        />
      ))}
    </>
  );
}

export const NodeHandles = memo(NodeHandlesView);
