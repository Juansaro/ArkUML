import { memo } from "react";
import {
  getStraightPath,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { selectTool } from "../store/selectors.ts";
import { useEditorStore } from "../store/EditorStoreProvider.tsx";
import { relationshipKindFromTool } from "../tools/relationshipTool.ts";
import {
  ASSEMBLY_BALL_RADIUS,
  ASSEMBLY_SOCKET_RADIUS,
  CLASS_MARKER_SIZE,
  filledArrowPath,
  openArrowPath,
  shortenLine,
  sourceBallCenter,
  sourceDiamondPath,
  targetSocketPath,
  targetTrianglePath,
} from "./markers.ts";
import styles from "./RelationshipPreview.module.css";

function RelationshipPreviewView({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}: ConnectionLineComponentProps<DiagramNode>) {
  const tool = useEditorStore(selectTool);
  const kind = relationshipKindFromTool(tool) ?? "association";
  const line = {
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  };
  const open =
    kind === "include" ||
    kind === "extend" ||
    kind === "reply-message" ||
    kind === "component-usage";
  const filled = kind === "sync-message";
  const diamond = kind === "aggregation" || kind === "composition";
  const triangle = kind === "generalization";
  const assembly = kind === "assembly-connector";
  const trimmed = shortenLine(
    line,
    diamond ? CLASS_MARKER_SIZE : assembly ? ASSEMBLY_BALL_RADIUS * 2 : 0,
    triangle
      ? CLASS_MARKER_SIZE
      : assembly
        ? ASSEMBLY_SOCKET_RADIUS
        : 0,
  );
  const [path] = getStraightPath(trimmed);

  return (
    <g data-kind={kind} data-testid="relationship-preview-group">
      <path
        d={path}
        className={styles.line}
        data-testid="relationship-preview"
        data-kind={kind}
        data-status={connectionStatus ?? "pending"}
      />
      {open ? (
        <path
          d={openArrowPath(line)}
          className={styles.marker}
          data-testid="relationship-preview-arrow"
        />
      ) : null}
      {filled ? (
        <path
          d={filledArrowPath(line)}
          className={styles.filledMarker}
          data-testid="relationship-preview-arrow"
        />
      ) : null}
      {diamond ? (
        <path
          d={sourceDiamondPath(line)}
          className={
            kind === "composition" ? styles.filledMarker : styles.marker
          }
          data-testid="relationship-preview-diamond"
        />
      ) : null}
      {triangle ? (
        <path
          d={targetTrianglePath(line)}
          className={styles.marker}
          data-testid="relationship-preview-triangle"
        />
      ) : null}
      {assembly ? (
        <>
          <circle
            {...sourceBallCenter(line)}
            r={ASSEMBLY_BALL_RADIUS}
            className={styles.filledMarker}
            data-testid="relationship-preview-ball"
          />
          <path
            d={targetSocketPath(line)}
            className={styles.marker}
            data-testid="relationship-preview-socket"
          />
        </>
      ) : null}
    </g>
  );
}

export const RelationshipPreview = memo(RelationshipPreviewView);
