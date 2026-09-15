import { memo, useCallback, type PointerEvent } from "react";
import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { isLifeline } from "../../domain/diagram/model.ts";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { clientToFlowPosition } from "../tools/createElementTool.ts";
import { EDGE_INTERACTION_WIDTH } from "../tools/relationshipTool.ts";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";
import { filledArrowPath, openArrowPath } from "./markers.ts";
import {
  isSelfMessage,
  sequenceMessageArrowLine,
  sequenceMessagePath,
} from "./sequenceMessagePath.ts";
import styles from "./SequenceMessageEdge.module.css";

function SequenceMessageEdgeView(props: EdgeProps<DiagramEdge>) {
  const store = useEditorStoreApi();
  const kind = props.data?.kind;
  const self = isSelfMessage(props.source, props.target);
  const y = props.data?.y ?? props.sourceY;
  const geometry = {
    sourceX: props.sourceX,
    targetX: props.targetX,
    y,
    self,
  };
  const path = sequenceMessagePath(geometry);
  const arrowLine = sequenceMessageArrowLine(geometry);
  const label = props.data?.name ?? "";
  const labelX = self
    ? props.sourceX + 20
    : (props.sourceX + props.targetX) / 2;
  const labelY = self ? y - 10 : y - 10;

  const onPointerDown = useCallback(
    (event: PointerEvent<SVGGElement>) => {
      if (event.button !== 0) {
        return;
      }
      if (kind !== "sync-message" && kind !== "reply-message") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      store.getState().beginTransaction();

      function flowY(clientX: number, clientY: number): number {
        const pane = document.querySelector(".react-flow");
        if (!(pane instanceof HTMLElement)) {
          return y;
        }
        return clientToFlowPosition(
          { x: clientX, y: clientY },
          pane.getBoundingClientRect(),
          store.getState().viewport,
        ).y;
      }

      function clampedY(nextY: number): number {
        const document = store.getState().document;
        const source = document.elements.find(
          (element) => element.id === props.source,
        );
        const dest = document.elements.find(
          (element) => element.id === props.target,
        );
        const bottoms: number[] = [];
        if (source !== undefined && isLifeline(source)) {
          bottoms.push(source.geometry.y + source.geometry.height);
        }
        if (dest !== undefined && isLifeline(dest)) {
          bottoms.push(dest.geometry.y + dest.geometry.height);
        }
        const minY = bottoms.length === 0 ? nextY : Math.max(...bottoms);
        return Math.max(minY, nextY);
      }

      function onMove(moveEvent: globalThis.PointerEvent) {
        store.getState().moveMessage({
          id: props.id,
          y: clampedY(flowY(moveEvent.clientX, moveEvent.clientY)),
        });
      }

      function onUp() {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        store.getState().commitTransaction();
      }

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
    },
    [kind, props.id, props.source, props.target, store, y],
  );

  return (
    <g
      data-kind={kind}
      data-self={self ? "true" : "false"}
      data-testid="sequence-message"
      onPointerDown={onPointerDown}
    >
      <BaseEdge
        id={props.id}
        path={path}
        className={`${styles.path}${kind === "reply-message" ? ` ${styles.reply}` : ""}`}
        interactionWidth={EDGE_INTERACTION_WIDTH}
      />
      {kind === "sync-message" || kind === "reply-message" ? (
        <path
          d={
            kind === "sync-message"
              ? filledArrowPath(arrowLine)
              : openArrowPath(arrowLine)
          }
          className={styles.marker}
          data-kind={kind}
          data-testid="sequence-message-arrow"
        />
      ) : null}
      {label.length > 0 ? (
        <SignatureLabel x={labelX} y={labelY} text={label} />
      ) : null}
    </g>
  );
}

function SignatureLabel({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) {
  const width = text.length * 7.25 + 10;
  const height = 18;

  return (
    <g
      data-testid="sequence-message-label"
      pointerEvents="none"
      transform={`translate(${x}, ${y})`}
    >
      <rect
        className={styles.labelBg}
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={2}
      />
      <text
        className={styles.label}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  );
}

export const SequenceMessageEdge = memo(SequenceMessageEdgeView);
