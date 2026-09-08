import { useEffect } from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  rasterizeExportSpike,
  SPIKE_MARKER_FILL,
  SPIKE_NODE_FILL,
  SPIKE_TEXT_FILL,
  type ExportSpikeGlobal,
} from "./spike.ts";

const SPIKE_NODES: Node[] = [
  {
    id: "spike-box",
    type: "spikeBox",
    position: { x: 48, y: 80 },
    data: {},
    width: 200,
    height: 96,
    draggable: false,
    selectable: false,
  },
  {
    id: "spike-anchor",
    type: "spikeAnchor",
    position: { x: 420, y: 104 },
    data: {},
    width: 36,
    height: 36,
    draggable: false,
    selectable: false,
  },
];

const SPIKE_EDGES: Edge[] = [
  {
    id: "spike-edge",
    source: "spike-box",
    target: "spike-anchor",
    style: { stroke: SPIKE_MARKER_FILL, strokeWidth: 4 },
    markerEnd: {
      type: "arrowclosed",
      color: SPIKE_MARKER_FILL,
      width: 24,
      height: 24,
    },
  },
];

function SpikeBoxNode() {
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        border: `8px solid ${SPIKE_NODE_FILL}`,
        backgroundColor: "#ffffff",
        color: SPIKE_TEXT_FILL,
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        fontSize: 28,
        fontWeight: 700,
      }}
    >
      SPIKE
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

function SpikeAnchorNode() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#71717a",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const spikeNodeTypes = {
  spikeBox: SpikeBoxNode,
  spikeAnchor: SpikeAnchorNode,
};

export function ExportSpikePage() {
  useEffect(() => {
    const spikeWindow = window as ExportSpikeGlobal;
    spikeWindow.__arkumlRasterizeExportSpike = async () => {
      const viewport = document.querySelector<HTMLElement>(
        '[data-testid="export-spike"] .react-flow__viewport',
      );
      if (viewport === null) {
        throw new Error("No se encontró el viewport del spike");
      }
      return rasterizeExportSpike(viewport);
    };
    return () => {
      delete spikeWindow.__arkumlRasterizeExportSpike;
    };
  }, []);

  return (
    <div
      data-testid="export-spike"
      style={{ width: "100%", height: "100%", backgroundColor: "#ffffff" }}
    >
      <ReactFlow
        nodes={SPIKE_NODES}
        edges={SPIKE_EDGES}
        nodeTypes={spikeNodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        fitView
        fitViewOptions={{ padding: 0.25, duration: 0 }}
        colorMode="light"
      >
        <Background variant={BackgroundVariant.Lines} gap={16} />
      </ReactFlow>
    </div>
  );
}
