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
  CLASS_MARKER_SIZE,
  filledArrowPath,
  openArrowPath,
  shortenLine,
  sourceDiamondPath,
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
    kind === "include" || kind === "extend" || kind === "reply-message";
  const filled = kind === "sync-message";
  const diamond = kind === "aggregation" || kind === "composition";
  const triangle = kind === "generalization";
  const trimmed = shortenLine(
    line,
    diamond ? CLASS_MARKER_SIZE : 0,
    triangle ? CLASS_MARKER_SIZE : 0,
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
    </g>
  );
}

export const RelationshipPreview = memo(RelationshipPreviewView);
