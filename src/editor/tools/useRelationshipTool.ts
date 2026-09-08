import { useCallback, useEffect } from "react";
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
import {
  announceInvalidConnection,
  commitRelationship,
  isRelationshipTool,
  isValidRelationshipConnection,
  relationshipInputFromConnection,
  relationshipKindFromTool,
} from "./relationshipTool.ts";

export function useRelationshipTool() {
  const store = useEditorStoreApi();
  const tool = useEditorStore(selectTool);
  const connecting = isRelationshipTool(tool);

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

  const onConnect = useCallback(
    (connection: Connection) => {
      const kind = relationshipKindFromTool(store.getState().tool);
      if (kind === undefined) {
        return;
      }
      commitRelationship(
        store,
        relationshipInputFromConnection(kind, connection),
      );
    },
    [store],
  );

  const onConnectEnd = useCallback<OnConnectEnd>(
    (_event, state) => {
      if (state.fromNode === null || state.toNode === null) {
        return;
      }
      if (state.isValid === true) {
        return;
      }
      const kind = relationshipKindFromTool(store.getState().tool);
      if (kind === undefined) {
        return;
      }
      announceInvalidConnection(
        store,
        kind,
        state.fromNode.id,
        state.toNode.id,
      );
    },
    [store],
  );

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
