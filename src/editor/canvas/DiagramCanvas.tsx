import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  MiniMap,
  ReactFlow,
  SelectionMode,
  ViewportPortal,
  useReactFlow,
  useStore,
  useViewport,
  type OnMoveEnd,
  type OnReconnect,
  type OnSelectionChangeFunc,
  type ReactFlowState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { snapshotDuplicableElements } from "../../domain/diagram/operations.ts";
import { useCompactLayout } from "../a11y/useCompactLayout.ts";
import { copySelection, pasteSelection } from "../shortcuts/editorCommands.ts";
import {
  mapDocumentToReactFlow,
  type DiagramEdge,
  type DiagramNode,
} from "../adapters/reactFlowMapper.ts";
import { ToolButton } from "../components/common/ToolButton.tsx";
import type { AlignmentGuides } from "../interactions/alignmentGuides.ts";
import { useElementRename } from "../interactions/useElementRename.ts";
import { useNodeDrag } from "../interactions/useNodeDrag.ts";
import {
  selectDocument,
  selectEditingElementId,
  selectClipboardItems,
  selectSelectedElementIds,
  selectSelectedRelationshipIds,
} from "../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../store/EditorStoreProvider.tsx";
import { useCreateElementTool } from "../tools/useCreateElementTool.ts";
import { useRelationshipTool } from "../tools/useRelationshipTool.ts";
import { isCreateElementTool } from "../tools/createElementTool.ts";
import {
  anchorFromHandle,
  commitReconnect,
  isRelationshipTool,
} from "../tools/relationshipTool.ts";
import {
  FlowDiagramMinimapNode,
  minimapNodeClassName,
} from "./DiagramMinimapNode.tsx";
import {
  boundsEqual,
  minimapFrameSize,
  unionNodeBounds,
  type MinimapBounds,
} from "./minimapOverview.ts";
import { edgeTypes } from "./edgeTypes.ts";
import { nodeTypes } from "./nodeTypes.ts";
import { CanvasContextMenu } from "./CanvasContextMenu.tsx";
import styles from "./DiagramCanvas.module.css";

const GUIDE_SPAN = 10_000;

export const CANVAS_MIN_ZOOM = 0.5;
export const CANVAS_MAX_ZOOM = 2;
export const CANVAS_ZOOM_OPTIONS = { duration: 0 } as const;
export const CANVAS_FIT_VIEW_OPTIONS = { padding: 0.2, duration: 0 } as const;

const CANVAS_ARIA_LABELS = {
  "controls.ariaLabel": "Controles del lienzo",
  "controls.zoomIn.ariaLabel": "Acercar",
  "controls.zoomOut.ariaLabel": "Alejar",
  "controls.fitView.ariaLabel": "Ajustar vista",
} as const;

type DiagramCanvasProps = {
  onFitViewReady?: (fitView: () => void) => void;
};

export function DiagramCanvas({ onFitViewReady }: DiagramCanvasProps = {}) {
  const store = useEditorStoreApi();
  const document = useEditorStore(selectDocument);
  const elementIds = useEditorStore(selectSelectedElementIds);
  const relationshipIds = useEditorStore(selectSelectedRelationshipIds);
  const editingElementId = useEditorStore(selectEditingElementId);
  const clipboardItems = useEditorStore(selectClipboardItems);
  const {
    canvasRef,
    placing,
    onPaneClick: createToolPaneClick,
    onNodeClick,
    shouldIgnoreSelectionChange,
  } = useCreateElementTool();
  const {
    connecting,
    connectionMode,
    connectionLineComponent,
    isValidConnection,
    onConnect,
    onConnectEnd,
  } = useRelationshipTool();
  const nodeDrag = useNodeDrag();
  const { onNodeDoubleClick } = useElementRename();
  const [defaultViewport] = useState(() => store.getState().viewport);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const compact = useCompactLayout();
  const ignoreSelectionAfterPaneClick = useRef(false);
  const { nodes, edges } = useMemo(
    () =>
      mapDocumentToReactFlow(
        document,
        { elementIds, relationshipIds },
        editingElementId,
      ),
    [document, editingElementId, elementIds, relationshipIds],
  );

  const onPaneClick = useCallback(
    (event: Parameters<typeof createToolPaneClick>[0]) => {
      if (isCreateElementTool(store.getState().tool)) {
        createToolPaneClick(event);
        return;
      }
      if (
        event.target instanceof Element &&
        (event.target.closest(".react-flow__node") !== null ||
          event.target.closest(".react-flow__edge") !== null)
      ) {
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

  const openContextMenu = useCallback(
    (event: {
      clientX: number;
      clientY: number;
      preventDefault: () => void;
    }) => {
      event.preventDefault();
      if (placing || connecting) {
        setContextMenu(null);
        return;
      }
      setContextMenu({ x: event.clientX, y: event.clientY });
    },
    [connecting, placing],
  );

  const onPaneContextMenu = useCallback(
    (event: {
      clientX: number;
      clientY: number;
      preventDefault: () => void;
    }) => {
      openContextMenu(event);
    },
    [openContextMenu],
  );

  const onNodeContextMenu = useCallback(
    (
      event: { clientX: number; clientY: number; preventDefault: () => void },
      node: DiagramNode,
    ) => {
      if (!placing && !connecting) {
        const kind = node.data.kind;
        if (kind === "actor" || kind === "use-case" || kind === "lifeline") {
          const selected = store.getState().selection.elementIds;
          if (!selected.includes(node.id)) {
            store.getState().setSelection({
              elementIds: [node.id],
              relationshipIds: [],
            });
          }
        }
      }
      openContextMenu(event);
    },
    [connecting, openContextMenu, placing, store],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onEdgeClick = useCallback(
    (_event: { stopPropagation?: () => void }, edge: DiagramEdge) => {
      if (placing) {
        return;
      }
      if (isRelationshipTool(store.getState().tool)) {
        store.getState().setTool("select");
      }
      store.getState().setSelection({
        elementIds: [],
        relationshipIds: [edge.id],
      });
    },
    [placing, store],
  );

  const handleNodeClick = useCallback(
    (event: MouseEvent, node: DiagramNode) => {
      onNodeClick(event);
      if (placing || connecting || event.shiftKey) {
        return;
      }
      ignoreSelectionAfterPaneClick.current = true;
      store.getState().setSelection({
        elementIds: [node.id],
        relationshipIds: [],
      });
      window.setTimeout(() => {
        ignoreSelectionAfterPaneClick.current = false;
      }, 0);
    },
    [connecting, onNodeClick, placing, store],
  );

  const onReconnect = useCallback<OnReconnect>(
    (oldEdge, connection) => {
      const kind = oldEdge.data?.kind;
      if (kind !== "association" && kind !== "include" && kind !== "extend") {
        return;
      }
      commitReconnect(store, {
        id: oldEdge.id,
        kind,
        sourceId: connection.source,
        targetId: connection.target,
        sourceAnchor: anchorFromHandle(connection.sourceHandle),
        targetAnchor: anchorFromHandle(connection.targetHandle),
      });
    },
    [store],
  );

  const onCopyFromMenu = useCallback(() => {
    copySelection(store);
  }, [store]);

  const onPasteFromMenu = useCallback(() => {
    pasteSelection(store);
  }, [store]);

  const copySnapshot = snapshotDuplicableElements(document, elementIds);
  const canCopy = copySnapshot.ok && copySnapshot.value.length > 0;
  const canPaste = clipboardItems.length > 0;

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
      if (
        elementIds.length === 0 &&
        relationshipIds.length === 0 &&
        (current.elementIds.length > 0 || current.relationshipIds.length > 0)
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
      data-connecting={connecting ? "true" : "false"}
      data-show-handles={connecting ? "true" : "false"}
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
        onPaneContextMenu={onPaneContextMenu}
        onNodeClick={handleNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onPaneContextMenu}
        onSelectionContextMenu={onPaneContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStart={nodeDrag.onNodeDragStart}
        onNodeDrag={nodeDrag.onNodeDrag}
        onNodeDragStop={nodeDrag.onNodeDragStop}
        onSelectionDragStart={nodeDrag.onSelectionDragStart}
        onSelectionDrag={nodeDrag.onSelectionDrag}
        onSelectionDragStop={nodeDrag.onSelectionDragStop}
        onNodesChange={nodeDrag.onNodesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onReconnect={onReconnect}
        isValidConnection={isValidConnection}
        connectionMode={connectionMode}
        connectionLineType={ConnectionLineType.Straight}
        connectionLineComponent={connectionLineComponent}
        selectionOnDrag={!placing && !connecting}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        panOnDrag={[1]}
        panActivationKeyCode="Space"
        zoomOnScroll
        zoomOnPinch
        nodesDraggable={!placing && !connecting}
        nodesConnectable={connecting}
        elementsSelectable={!placing}
        edgesReconnectable={!placing && !connecting}
        connectOnClick={false}
        deleteKeyCode={null}
        disableKeyboardA11y
        minZoom={CANVAS_MIN_ZOOM}
        maxZoom={CANVAS_MAX_ZOOM}
        colorMode="light"
        ariaLabelConfig={CANVAS_ARIA_LABELS}
        fitViewOptions={CANVAS_FIT_VIEW_OPTIONS}
        className={styles.flow}
      >
        <Background
          id="diagram-grid"
          variant={BackgroundVariant.Lines}
          gap={16}
          color="var(--color-grid)"
          bgColor="var(--color-canvas)"
        />
        <AlignmentGuidesOverlay guides={nodeDrag.guides} />
        <CanvasViewportControls />
        {compact ? null : <DiagramMinimap />}
        {onFitViewReady !== undefined ? (
          <FitViewRegistration onReady={onFitViewReady} />
        ) : null}
      </ReactFlow>
      {contextMenu === null ? null : (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          canCopy={canCopy}
          canPaste={canPaste}
          onCopy={onCopyFromMenu}
          onPaste={onPasteFromMenu}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

function AlignmentGuidesOverlay({ guides }: { guides: AlignmentGuides }) {
  if (guides.vertical.length === 0 && guides.horizontal.length === 0) {
    return null;
  }

  return (
    <ViewportPortal>
      <svg
        className={`${styles.alignmentGuides} alignment-guides`}
        data-testid="alignment-guides"
        aria-hidden="true"
        overflow="visible"
      >
        {guides.vertical.map((x) => (
          <line key={`v:${x}`} x1={x} y1={-GUIDE_SPAN} x2={x} y2={GUIDE_SPAN} />
        ))}
        {guides.horizontal.map((y) => (
          <line key={`h:${y}`} x1={-GUIDE_SPAN} y1={y} x2={GUIDE_SPAN} y2={y} />
        ))}
      </svg>
    </ViewportPortal>
  );
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

function FitViewRegistration({
  onReady,
}: {
  onReady: (fitView: () => void) => void;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    onReady(() => {
      void fitView(CANVAS_FIT_VIEW_OPTIONS);
    });
  }, [fitView, onReady]);

  return null;
}

function selectMinimapBounds(state: ReactFlowState): MinimapBounds | null {
  return unionNodeBounds(state.nodeLookup.values());
}

function DiagramMinimap() {
  const [expanded, setExpanded] = useState(false);
  const bounds = useStore(selectMinimapBounds, boundsEqual);
  const frame = minimapFrameSize(bounds, expanded);

  return (
    <div
      className={styles.minimap}
      data-testid="diagram-minimap"
      data-expanded={expanded ? "true" : "false"}
      aria-label="Mapa del diagrama"
      style={{ width: frame.width, height: frame.height }}
    >
      <MiniMap<DiagramNode>
        ariaLabel="Mapa del diagrama"
        pannable
        zoomable
        position="bottom-right"
        style={{ width: frame.width, height: frame.height }}
        bgColor="var(--color-canvas)"
        maskColor="var(--color-bg)"
        maskStrokeColor="var(--color-control-border)"
        nodeClassName={minimapNodeClassName}
        nodeComponent={FlowDiagramMinimapNode}
        nodeColor="transparent"
        nodeStrokeColor="transparent"
        nodeStrokeWidth={0}
        nodeBorderRadius={0}
        offsetScale={1}
      />
      <div className={styles.minimapExpand} data-testid="minimap-expand">
        <ToolButton
          icon={expanded ? "collapseView" : "fitView"}
          label={expanded ? "Reducir mapa" : "Ampliar mapa"}
          description={
            expanded
              ? "Volver el mapa al tamaño normal."
              : "Ver el mapa al doble de tamaño."
          }
          placement="left"
          pressed={expanded}
          aria-expanded={expanded}
          onClick={() => {
            setExpanded((current) => !current);
          }}
        />
      </div>
    </div>
  );
}

function CanvasViewportControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const atMax = zoom >= CANVAS_MAX_ZOOM;
  const atMin = zoom <= CANVAS_MIN_ZOOM;

  return (
    <div
      className={`react-flow__controls ${styles.viewportControls}`}
      role="group"
      aria-label="Controles del lienzo"
    >
      <ToolButton
        icon="zoomIn"
        label="Acercar"
        description={
          atMax ? "El zoom ya está en el máximo (200%)." : "Acercar."
        }
        placement="left"
        unavailable={atMax}
        onClick={() => {
          void zoomIn(CANVAS_ZOOM_OPTIONS);
        }}
      />
      <ToolButton
        icon="zoomOut"
        label="Alejar"
        description={atMin ? "El zoom ya está en el mínimo (50%)." : "Alejar."}
        placement="left"
        unavailable={atMin}
        onClick={() => {
          void zoomOut(CANVAS_ZOOM_OPTIONS);
        }}
      />
      <ToolButton
        icon="fitView"
        label="Ajustar vista"
        description="Ajustar todo el diagrama (Ctrl/Cmd+0)."
        placement="left"
        onClick={() => {
          void fitView(CANVAS_FIT_VIEW_OPTIONS);
        }}
      />
    </div>
  );
}
