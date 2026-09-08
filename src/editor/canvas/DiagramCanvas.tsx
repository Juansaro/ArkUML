import { useCallback, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  SelectionMode,
  type OnMoveEnd,
  type OnSelectionChangeFunc,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { mapDocumentToReactFlow } from "../adapters/reactFlowMapper.ts";
import { useElementRename } from "../interactions/useElementRename.ts";
import { useNodeDrag } from "../interactions/useNodeDrag.ts";
import { selectDocument, selectSelection } from "../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../store/EditorStoreProvider.tsx";
import { useCreateElementTool } from "../tools/useCreateElementTool.ts";
import { isCreateElementTool } from "../tools/createElementTool.ts";
import { edgeTypes } from "./edgeTypes.ts";
import { nodeTypes } from "./nodeTypes.ts";
import styles from "./DiagramCanvas.module.css";

const CANVAS_ARIA_LABELS = {
  "controls.ariaLabel": "Controles del lienzo",
  "controls.zoomIn.ariaLabel": "Acercar",
  "controls.zoomOut.ariaLabel": "Alejar",
  "controls.fitView.ariaLabel": "Ajustar vista",
} as const;

export function DiagramCanvas() {
  const store = useEditorStoreApi();
  const document = useEditorStore(selectDocument);
  const selection = useEditorStore(selectSelection);
  const {
    canvasRef,
    placing,
    showHandles,
    onPaneClick: createToolPaneClick,
    onNodeClick,
    shouldIgnoreSelectionChange,
  } = useCreateElementTool();
  const nodeDrag = useNodeDrag();
  const { onNodeDoubleClick } = useElementRename();
  const [defaultViewport] = useState(() => store.getState().viewport);
  const ignoreSelectionAfterPaneClick = useRef(false);
  const { nodes, edges } = useMemo(
    () => mapDocumentToReactFlow(document, selection),
    [document, selection],
  );

  const onPaneClick = useCallback(
    (event: Parameters<typeof createToolPaneClick>[0]) => {
      if (isCreateElementTool(store.getState().tool)) {
        createToolPaneClick(event);
        return;
      }
      ignoreSelectionAfterPaneClick.current = true;
      store.getState().clearSelection();
      window.setTimeout(() => {
        ignoreSelectionAfterPaneClick.current = false;
      }, 0);
    },
    [createToolPaneClick, store],
  );

  const onMoveEnd = useCallback<OnMoveEnd>(
    (_event, viewport) => {
      const current = store.getState().viewport;
      if (
        current.x === viewport.x &&
        current.y === viewport.y &&
        current.zoom === viewport.zoom
      ) {
        return;
      }
      store.getState().setViewport({
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      });
    },
    [store],
  );

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      if (shouldIgnoreSelectionChange()) {
        return;
      }
      if (ignoreSelectionAfterPaneClick.current) {
        ignoreSelectionAfterPaneClick.current = false;
        return;
      }
      const elementIds = selectedNodes.map((node) => node.id);
      const relationshipIds = selectedEdges.map((edge) => edge.id);
      const current = store.getState().selection;
      if (
        sameIds(current.elementIds, elementIds) &&
        sameIds(current.relationshipIds, relationshipIds)
      ) {
        return;
      }
      store.getState().setSelection({ elementIds, relationshipIds });
    },
    [shouldIgnoreSelectionChange, store],
  );

  return (
    <div
      ref={canvasRef}
      className={styles.root}
      data-testid="diagram-canvas"
      data-placing={placing ? "true" : "false"}
      data-show-handles={showHandles ? "true" : "false"}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        onMoveEnd={onMoveEnd}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStart={nodeDrag.onNodeDragStart}
        onNodeDrag={nodeDrag.onNodeDrag}
        onNodeDragStop={nodeDrag.onNodeDragStop}
        onSelectionDragStart={nodeDrag.onSelectionDragStart}
        onSelectionDrag={nodeDrag.onSelectionDrag}
        onSelectionDragStop={nodeDrag.onSelectionDragStop}
        onNodesChange={nodeDrag.onNodesChange}
        selectionOnDrag={!placing}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        panOnDrag={[1]}
        panActivationKeyCode="Space"
        zoomOnScroll
        zoomOnPinch
        nodesDraggable={!placing}
        nodesConnectable={false}
        elementsSelectable={!placing}
        deleteKeyCode={null}
        minZoom={0.5}
        maxZoom={2}
        colorMode="light"
        ariaLabelConfig={CANVAS_ARIA_LABELS}
        fitViewOptions={{ padding: 0.2, duration: 0 }}
        className={styles.flow}
      >
        <Background
          id="diagram-grid"
          variant={BackgroundVariant.Lines}
          gap={16}
          color="var(--color-grid)"
          bgColor="var(--color-canvas)"
        />
        <Controls
          showInteractive={false}
          aria-label="Controles del lienzo"
          fitViewOptions={{ padding: 0.2, duration: 0 }}
        />
      </ReactFlow>
    </div>
  );
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}
