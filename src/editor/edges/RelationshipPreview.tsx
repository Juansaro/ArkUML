import { memo } from "react";
import {
  getStraightPath,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import type { DiagramNode } from "../adapters/reactFlowMapper.ts";
import { selectTool } from "../store/selectors.ts";
import { useEditorStore } from "../store/EditorStoreProvider.tsx";
import { relationshipKindFromTool } from "../tools/relationshipTool.ts";
import { openArrowPath } from "./markers.ts";
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
  const [path] = getStraightPath(line);
  const directed = kind === "include" || kind === "extend";

  return (
    <g data-kind={kind} data-testid="relationship-preview-group">
      <path
        d={path}
        className={styles.line}
        data-testid="relationship-preview"
        data-kind={kind}
        data-status={connectionStatus ?? "pending"}
      />
      {directed ? (
        <path
          d={openArrowPath(line)}
          className={styles.marker}
          data-testid="relationship-preview-arrow"
        />
      ) : null}
    </g>
  );
}

export const RelationshipPreview = memo(RelationshipPreviewView);
