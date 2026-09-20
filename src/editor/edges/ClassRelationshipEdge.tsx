
import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import {
  CLASS_MARKER_SIZE,
  multiplicityAnchor,
  shortenLine,
  sourceDiamondPath,
  targetTrianglePath,
} from "./markers.ts";
import styles from "./ClassRelationshipEdge.module.css";

function ClassRelationshipEdgeView(props: EdgeProps<DiagramEdge>) {
  const kind = props.data?.kind ?? "class-association";
  const line = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  };
  const sourceMarker = kind === "aggregation" || kind === "composition";
  const targetMarker = kind === "generalization";
  const [path] = getStraightPath(
    shortenLine(
      line,
      sourceMarker ? CLASS_MARKER_SIZE : 0,
      targetMarker ? CLASS_MARKER_SIZE : 0,
    ),
  );

  const sourceMultiplicity = props.data?.sourceMultiplicity;
  const targetMultiplicity = props.data?.targetMultiplicity;
  const sourceLabel =
    sourceMultiplicity === undefined
      ? undefined
      : multiplicityAnchor(line, "source");
  const targetLabel =
    targetMultiplicity === undefined
      ? undefined
      : multiplicityAnchor(line, "target");

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        className={styles.path ?? ""}
        interactionWidth={EDGE_INTERACTION_WIDTH}
      />
      {sourceMarker ? (
        <path
          d={sourceDiamondPath(line)}
          className={`${styles.marker ?? ""} ${
            kind === "composition" ? styles.filled ?? "" : styles.hollow ?? ""
          }`}
          data-testid={`${kind === "composition" ? "composition" : "aggregation"}-diamond`}
        />
      ) : null}
      {targetMarker ? (
        <path
          d={targetTrianglePath(line)}
          className={`${styles.marker ?? ""} ${styles.hollow ?? ""}`}
          data-testid="generalization-triangle"
        />
      ) : null}
      {sourceLabel !== undefined ? (
        <MultiplicityLabel
          value={sourceMultiplicity ?? ""}
          position={sourceLabel}
          testId="multiplicity-source"
        />
      ) : null}
      {targetLabel !== undefined ? (
        <MultiplicityLabel
          value={targetMultiplicity ?? ""}
          position={targetLabel}
          testId="multiplicity-target"
        />
      ) : null}
    </>
  );
}

function MultiplicityLabel({
  value,
  position,
  testId,
}: {
  value: string;
  position: { x: number; y: number };
  testId: string;
}) {
  return (
    <text
      className={styles.multiplicity ?? ""}
      x={position.x}
      y={position.y}
      textAnchor="middle"
      data-testid={testId}
    >
      {value}
    </text>
  );
}

export const ClassRelationshipEdge = memo(ClassRelationshipEdgeView);
