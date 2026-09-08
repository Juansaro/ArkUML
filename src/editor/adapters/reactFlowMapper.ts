import type { Edge, Node } from "@xyflow/react";
import type {
  DiagramDocument,
  DiagramElement,
  Relationship,
  RelationshipKind,
} from "../../domain/diagram/model.ts";
import type { SelectionState } from "../store/editorStore.ts";

export type DiagramNodeData = {
  kind: DiagramElement["kind"];
  name: string;
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

export function mapDocumentToReactFlow(
  document: DiagramDocument,
  selection: SelectionState = EMPTY_SELECTION,
): ReactFlowProjection {
  const selectedElements = new Set(selection.elementIds);
  const selectedRelationships = new Set(selection.relationshipIds);

  return {
    nodes: orderElementsForSubflows(document.elements).map((element) =>
      mapElement(element, selectedElements.has(element.id)),
    ),
    edges: document.relationships.map((relationship) => ({
      id: relationship.id,
      type: relationship.kind,
      source: relationship.sourceId,
      target: relationship.targetId,
      sourceHandle: relationship.sourceAnchor,
      targetHandle: relationship.targetAnchor,
      className: `diagram-edge diagram-edge-${relationship.kind}`,
      data: { kind: relationship.kind },
      selected: selectedRelationships.has(relationship.id),
      ariaLabel: relationshipAriaLabel(document, relationship),
    })),
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

function mapElement(element: DiagramElement, selected: boolean): DiagramNode {
  const node: DiagramNode = {
    id: element.id,
    type: element.kind,
    position: { x: element.geometry.x, y: element.geometry.y },
    data: { kind: element.kind, name: element.name },
    width: element.geometry.width,
    height: element.geometry.height,
    selected,
    ariaLabel: elementAriaLabel(element),
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

function relationshipAriaLabel(
  document: DiagramDocument,
  relationship: Relationship,
): string {
  const source = document.elements.find(
    (element) => element.id === relationship.sourceId,
  );
  const target = document.elements.find(
    (element) => element.id === relationship.targetId,
  );
  const kindLabel = relationshipKindLabel(relationship.kind);
  if (source === undefined || target === undefined) {
    return kindLabel;
  }
  return `${kindLabel} entre ${source.name} y ${target.name}`;
}

function relationshipKindLabel(kind: RelationshipKind): string {
  if (kind === "association") {
    return "Asociación";
  }
  if (kind === "include") {
    return "Include";
  }
  return "Extend";
}

function elementAriaLabel(element: DiagramElement): string {
  if (element.kind === "actor") {
    return `Actor ${element.name}`;
  }
  if (element.kind === "use-case") {
    return `Caso de uso ${element.name}`;
  }
  return `Límite del sistema ${element.name}`;
}
