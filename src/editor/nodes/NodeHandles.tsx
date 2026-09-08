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

export function NodeHandles() {
  return (
    <>
      {HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`target-${handle.id}`}
          id={handle.id}
          type="target"
          position={handle.position}
          className={styles.handle}
          isConnectable={false}
        />
      ))}
      {HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`source-${handle.id}`}
          id={handle.id}
          type="source"
          position={handle.position}
          className={styles.handle}
          isConnectable={false}
        />
      ))}
    </>
  );
}
