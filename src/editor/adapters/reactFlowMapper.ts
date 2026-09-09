import type { Edge, Node } from "@xyflow/react";
import type {
  DiagramDocument,
  DiagramElement,
  Relationship,
  RelationshipKind,
} from "../../domain/diagram/model.ts";
import {
  elementAccessibleName,
  relationshipAccessibleName,
  relationshipTypeLabel,
} from "../a11y/labels.ts";
import type { SelectionState } from "../store/editorStore.ts";

export type DiagramNodeData = {
  kind: DiagramElement["kind"];
  name: string;
  editing?: boolean;
};

export type DiagramEdgeData = {
  kind: RelationshipKind;
};

export type DiagramNode = Node<DiagramNodeData, DiagramElement["kind"]>;
export type DiagramEdge = Edge<DiagramEdgeData, RelationshipKind>;

export type ReactFlowProjection = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

const EMPTY_SELECTION: SelectionState = {
  elementIds: [],
  relationshipIds: [],
};

type ProjectionCache = {
  document: DiagramDocument;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

let projectionCache: ProjectionCache | undefined;

export function mapDocumentToReactFlow(
  document: DiagramDocument,
  selection: SelectionState = EMPTY_SELECTION,
  editingElementId?: string,
): ReactFlowProjection {
  const base = projectDocument(document);
  return applySelection(base, selection, editingElementId);
}

function projectDocument(document: DiagramDocument): ProjectionCache {
  const previous = projectionCache;
  if (previous !== undefined && previous.document === document) {
    return previous;
  }

  const previousElements =
    previous === undefined
      ? undefined
      : new Map(
          previous.document.elements.map((element) => [element.id, element]),
        );
  const previousNodes =
    previous === undefined
      ? undefined
      : new Map(previous.nodes.map((node) => [node.id, node]));
  const nextElements = new Map(
    document.elements.map((element) => [element.id, element]),
  );

  const nodes = orderElementsForSubflows(document.elements).map((element) => {
    const previousNode = previousNodes?.get(element.id);
    if (
      previousNode !== undefined &&
      previousElements?.get(element.id) === element
    ) {
      return previousNode;
    }
    return mapElement(element);
  });

  const edges = document.relationships.map((relationship, index) => {
    const previousEdge = previous?.edges[index];
    const previousRelationship = previous?.document.relationships[index];
    if (
      previousEdge !== undefined &&
      previousRelationship === relationship &&
      endpointLabelUnchanged(
        previousElements?.get(relationship.sourceId),
        nextElements.get(relationship.sourceId),
      ) &&
      endpointLabelUnchanged(
        previousElements?.get(relationship.targetId),
        nextElements.get(relationship.targetId),
      )
    ) {
      return previousEdge;
    }
    return mapEdge(relationship, nextElements);
  });

  const next: ProjectionCache = { document, nodes, edges };
  projectionCache = next;
  return next;
}

function applySelection(
  base: ProjectionCache,
  selection: SelectionState,
  editingElementId: string | undefined,
): ReactFlowProjection {
  const selectedElements = new Set(selection.elementIds);
  const selectedRelationships = new Set(selection.relationshipIds);
  const hasEditing = editingElementId !== undefined;
  const hasSelection =
    selectedElements.size > 0 || selectedRelationships.size > 0;

  if (!hasSelection && !hasEditing) {
    return { nodes: base.nodes, edges: base.edges };
  }

  return {
    nodes: base.nodes.map((node) => {
      const selected = selectedElements.has(node.id);
      const editing = node.id === editingElementId;
      if (!selected && !editing) {
        return node;
      }
      return {
        ...node,
        selected,
        data: editing ? { ...node.data, editing: true } : node.data,
        ariaLabel: elementAccessibleName(node.data, selected),
      };
    }),
    edges: base.edges.map((edge) => {
      if (!selectedRelationships.has(edge.id)) {
        return edge;
      }
      return {
        ...edge,
        selected: true,
        ariaLabel: selectedEdgeLabel(edge.ariaLabel),
      };
    }),
  };
}

function mapElement(element: DiagramElement): DiagramNode {
  const node: DiagramNode = {
    id: element.id,
    type: element.kind,
    position: { x: element.geometry.x, y: element.geometry.y },
    data: { kind: element.kind, name: element.name },
    width: element.geometry.width,
    height: element.geometry.height,
    selected: false,
    ariaLabel: elementAccessibleName(element),
  };

  if (element.kind === "system-boundary") {
    return {
      ...node,
      style: {
        width: element.geometry.width,
        height: element.geometry.height,
        overflow: "visible",
      },
    };
  }

  if (element.kind === "use-case" && element.parentId !== undefined) {
    return {
      ...node,
      parentId: element.parentId,
    };
  }

  return node;
}

function mapEdge(
  relationship: Relationship,
  elementsById: ReadonlyMap<string, DiagramElement>,
): DiagramEdge {
  return {
    id: relationship.id,
    type: relationship.kind,
    source: relationship.sourceId,
    target: relationship.targetId,
    sourceHandle: relationship.sourceAnchor,
    targetHandle: relationship.targetAnchor,
    className: `diagram-edge diagram-edge-${relationship.kind}`,
    data: { kind: relationship.kind },
    selected: false,
    ariaLabel: relationshipAriaLabel(relationship, elementsById, false),
  };
}

function orderElementsForSubflows(
  elements: readonly DiagramElement[],
): DiagramElement[] {
  const byId = new Map(elements.map((element) => [element.id, element]));
  const ordered: DiagramElement[] = [];
  const placed = new Set<string>();

  function place(element: DiagramElement): void {
    if (placed.has(element.id)) {
      return;
    }
    if (element.kind === "use-case" && element.parentId !== undefined) {
      const parent = byId.get(element.parentId);
      if (parent !== undefined) {
        place(parent);
      }
    }
    placed.add(element.id);
    ordered.push(element);
  }

  for (const element of elements) {
    place(element);
  }

  return ordered;
}

function relationshipAriaLabel(
  relationship: Relationship,
  elementsById: ReadonlyMap<string, DiagramElement>,
  selected: boolean,
): string {
  const source = elementsById.get(relationship.sourceId);
  const target = elementsById.get(relationship.targetId);
  if (source === undefined || target === undefined) {
    return relationshipTypeLabel(relationship.kind);
  }
  return relationshipAccessibleName(
    relationship.kind,
    source.name,
    target.name,
    selected,
  );
}

function endpointLabelUnchanged(
  previous: DiagramElement | undefined,
  next: DiagramElement | undefined,
): boolean {
  if (previous === undefined || next === undefined) {
    return false;
  }
  return previous.kind === next.kind && previous.name === next.name;
}

function selectedEdgeLabel(label: string | undefined): string {
  if (label === undefined || label.length === 0) {
    return "seleccionada";
  }
  if (label.endsWith(", seleccionada")) {
    return label;
  }
  return `${label}, seleccionada`;
}
