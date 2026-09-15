import { useCallback, useEffect, useRef } from "react";
import {
  ConnectionMode,
  type Connection,
  type IsValidConnection,
  type OnConnectEnd,
} from "@xyflow/react";
import type { DiagramEdge } from "../adapters/reactFlowMapper.ts";
import { selectTool } from "../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../store/EditorStoreProvider.tsx";
import { RelationshipPreview } from "../edges/RelationshipPreview.tsx";
import { clientToFlowPosition } from "./createElementTool.ts";
import {
  announceInvalidConnection,
  commitRelationship,
  defaultMessageY,
  isRelationshipTool,
  isSequenceRelationshipTool,
  isValidRelationshipConnection,
  relationshipInputFromConnection,
  relationshipKindFromTool,
} from "./relationshipTool.ts";

function nodeIdFromConnectEvent(
  event: MouseEvent | TouchEvent,
): string | undefined {
  const point =
    "changedTouches" in event ? event.changedTouches.item(0) : event;
  if (point === null || point === undefined) {
    return undefined;
  }
  const element = document.elementFromPoint(point.clientX, point.clientY);
  const node = element?.closest(".react-flow__node");
  const id = node?.getAttribute("data-id");
  return id === null || id === undefined || id.length === 0 ? undefined : id;
}

export function useRelationshipTool() {
  const store = useEditorStoreApi();
  const tool = useEditorStore(selectTool);
  const connecting = isRelationshipTool(tool);
  const pointerRef = useRef<{ x: number; y: number } | undefined>(undefined);

  const isValidConnection = useCallback<IsValidConnection<DiagramEdge>>(
    (connection) => {
      const kind = relationshipKindFromTool(store.getState().tool);
      if (kind === undefined) {
        return false;
      }
      return isValidRelationshipConnection(
        store.getState().document,
        kind,
        connection,
      );
    },
    [store],
  );

  const flowYFromPointer = useCallback((): number | undefined => {
    const pointer = pointerRef.current;
    if (pointer === undefined) {
      return undefined;
    }
    const pane = document.querySelector(".react-flow");
    if (!(pane instanceof HTMLElement)) {
      return undefined;
    }
    return clientToFlowPosition(
      pointer,
      pane.getBoundingClientRect(),
      store.getState().viewport,
    ).y;
  }, [store]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const kind = relationshipKindFromTool(store.getState().tool);
      if (kind === undefined) {
        return;
      }
      const y = isSequenceRelationshipTool(kind)
        ? (flowYFromPointer() ??
          defaultMessageY(
            store.getState().document,
            connection.source,
            connection.target,
          ))
        : undefined;
      commitRelationship(
        store,
        relationshipInputFromConnection(kind, connection, y),
      );
    },
    [flowYFromPointer, store],
  );

  const onConnectEnd = useCallback<OnConnectEnd>(
    (event, state) => {
      const kind = relationshipKindFromTool(store.getState().tool);
      if (kind === undefined || state.fromNode === null) {
        return;
      }
      if (state.isValid === true) {
        return;
      }

      const targetId = state.toNode?.id ?? nodeIdFromConnectEvent(event);
      if (
        targetId !== undefined &&
        isSequenceRelationshipTool(kind) &&
        isValidRelationshipConnection(store.getState().document, kind, {
          source: state.fromNode.id,
          target: targetId,
        })
      ) {
        const y =
          flowYFromPointer() ??
          defaultMessageY(
            store.getState().document,
            state.fromNode.id,
            targetId,
          );
        commitRelationship(
          store,
          relationshipInputFromConnection(
            kind,
            {
              source: state.fromNode.id,
              target: targetId,
              sourceHandle: state.fromHandle?.id ?? null,
              targetHandle: state.toHandle?.id ?? null,
            },
            y,
          ),
        );
        return;
      }

      if (state.toNode === null) {
        return;
      }
      announceInvalidConnection(
        store,
        kind,
        state.fromNode.id,
        state.toNode.id,
      );
    },
    [flowYFromPointer, store],
  );

  useEffect(() => {
    if (!connecting) {
      pointerRef.current = undefined;
      return;
    }
    function onMove(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, [connecting]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (!isRelationshipTool(store.getState().tool)) {
        return;
      }
      store.getState().setTool("select");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [store]);

  return {
    connecting,
    connectionMode: connecting ? ConnectionMode.Loose : ConnectionMode.Strict,
    connectionLineComponent: RelationshipPreview,
    isValidConnection,
    onConnect,
    onConnectEnd,
  };
}
