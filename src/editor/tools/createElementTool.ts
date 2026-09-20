import {
  DEFAULT_ACTION_GEOMETRY,
  DEFAULT_ACTIVITY_FINAL_GEOMETRY,
  DEFAULT_BOUNDARY_GEOMETRY,
  DEFAULT_CLASS_GEOMETRY,
  DEFAULT_COMPONENT_GEOMETRY,
  DEFAULT_ARTIFACT_GEOMETRY,
  DEFAULT_ATTRIBUTE_GEOMETRY,
  DEFAULT_DECISION_NODE_GEOMETRY,
  DEFAULT_ENTITY_GEOMETRY,
  DEFAULT_ER_RELATIONSHIP_GEOMETRY,
  DEFAULT_FORK_NODE_GEOMETRY,
  DEFAULT_INITIAL_NODE_GEOMETRY,
  DEFAULT_LIFELINE_GEOMETRY,
  DEFAULT_LIFELINE_WIDTH,
  DEFAULT_NODE_GEOMETRY,
} from "../../domain/diagram/defaults.ts";
import type {
  DiagramDocument,
  Geometry,
  Result,
  SystemBoundary,
  Viewport,
} from "../../domain/diagram/model.ts";
import { elementTypeLabel } from "../a11y/labels.ts";
import type { EditorStoreApi, EditorTool } from "../store/editorStore.ts";

export const CREATE_ELEMENT_TOOLS = [
  "actor",
  "use-case",
  "system-boundary",
  "lifeline",
  "class",
  "component",
  "node",
  "artifact",
  "entity",
  "attribute",
  "er-relationship",
  "action",
  "initial-node",
  "activity-final",
  "decision-node",
  "merge-node",
  "fork-node",
  "join-node",
] as const;

export type CreateElementTool = (typeof CREATE_ELEMENT_TOOLS)[number];

export const DEFAULT_ELEMENT_NAMES = {
  actor: "Actor",
  "use-case": "Caso de uso",
  "system-boundary": "Sistema",
  lifeline: "Lifeline",
  class: "Clase",
  component: "Componente",
  node: "Nodo",
  artifact: "Artefacto",
  entity: "Entidad",
  attribute: "Atributo",
  "er-relationship": "Relación",
  action: "Acción",
  "initial-node": "",
  "activity-final": "",
  "decision-node": "",
  "merge-node": "",
  "fork-node": "",
  "join-node": "",
} as const;

export const DEFAULT_ELEMENT_SIZES: Record<
  CreateElementTool,
  { width: number; height: number }
> = {
  actor: { width: 72, height: 112 },
  "use-case": { width: 160, height: 80 },
  "system-boundary": {
    width: DEFAULT_BOUNDARY_GEOMETRY.width,
    height: DEFAULT_BOUNDARY_GEOMETRY.height,
  },
  lifeline: {
    width: DEFAULT_LIFELINE_GEOMETRY.width,
    height: DEFAULT_LIFELINE_GEOMETRY.height,
  },
  class: {
    width: DEFAULT_CLASS_GEOMETRY.width,
    height: DEFAULT_CLASS_GEOMETRY.height,
  },
  component: {
    width: DEFAULT_COMPONENT_GEOMETRY.width,
    height: DEFAULT_COMPONENT_GEOMETRY.height,
  },
  node: {
    width: DEFAULT_NODE_GEOMETRY.width,
    height: DEFAULT_NODE_GEOMETRY.height,
  },
  artifact: {
    width: DEFAULT_ARTIFACT_GEOMETRY.width,
    height: DEFAULT_ARTIFACT_GEOMETRY.height,
  },
  entity: {
    width: DEFAULT_ENTITY_GEOMETRY.width,
    height: DEFAULT_ENTITY_GEOMETRY.height,
  },
  attribute: {
    width: DEFAULT_ATTRIBUTE_GEOMETRY.width,
    height: DEFAULT_ATTRIBUTE_GEOMETRY.height,
  },
  "er-relationship": {
    width: DEFAULT_ER_RELATIONSHIP_GEOMETRY.width,
    height: DEFAULT_ER_RELATIONSHIP_GEOMETRY.height,
  },
  action: {
    width: DEFAULT_ACTION_GEOMETRY.width,
    height: DEFAULT_ACTION_GEOMETRY.height,
  },
  "initial-node": {
    width: DEFAULT_INITIAL_NODE_GEOMETRY.width,
    height: DEFAULT_INITIAL_NODE_GEOMETRY.height,
  },
  "activity-final": {
    width: DEFAULT_ACTIVITY_FINAL_GEOMETRY.width,
    height: DEFAULT_ACTIVITY_FINAL_GEOMETRY.height,
  },
  "decision-node": {
    width: DEFAULT_DECISION_NODE_GEOMETRY.width,
    height: DEFAULT_DECISION_NODE_GEOMETRY.height,
  },
  "merge-node": {
    width: DEFAULT_DECISION_NODE_GEOMETRY.width,
    height: DEFAULT_DECISION_NODE_GEOMETRY.height,
  },
  "fork-node": {
    width: DEFAULT_FORK_NODE_GEOMETRY.width,
    height: DEFAULT_FORK_NODE_GEOMETRY.height,
  },
  "join-node": {
    width: DEFAULT_FORK_NODE_GEOMETRY.width,
    height: DEFAULT_FORK_NODE_GEOMETRY.height,
  },
};

export function isCreateElementTool(
  tool: EditorTool,
): tool is CreateElementTool {
  return (
    tool === "actor" ||
    tool === "use-case" ||
    tool === "system-boundary" ||
    tool === "lifeline" ||
    tool === "class" ||
    tool === "component" ||
    tool === "node" ||
    tool === "artifact" ||
    tool === "entity" ||
    tool === "attribute" ||
    tool === "er-relationship" ||
    tool === "action" ||
    tool === "initial-node" ||
    tool === "activity-final" ||
    tool === "decision-node" ||
    tool === "merge-node" ||
    tool === "fork-node" ||
    tool === "join-node"
  );
}

export function nextDefaultName(
  existingNames: readonly string[],
  base: string,
): string {
  if (base.trim().length === 0) {
    return "";
  }
  if (!existingNames.includes(base)) {
    return base;
  }

  let serial = 2;
  let candidate = `${base} ${serial}`;
  const used = new Set(existingNames);
  while (used.has(candidate)) {
    serial += 1;
    candidate = `${base} ${serial}`;
  }
  return candidate;
}

export function geometryAt(
  kind: CreateElementTool,
  position: { x: number; y: number },
): Geometry {
  const size = DEFAULT_ELEMENT_SIZES[kind];
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  };
}

export function clientToFlowPosition(
  client: { x: number; y: number },
  pane: { left: number; top: number },
  viewport: Viewport,
): { x: number; y: number } {
  return {
    x: (client.x - pane.left - viewport.x) / viewport.zoom,
    y: (client.y - pane.top - viewport.y) / viewport.zoom,
  };
}

export function createdElementAnnouncement(name: string): string {
  return `Se creó ${name}.`;
}

export function defaultPlacementPosition(
  document: DiagramDocument,
  kind: CreateElementTool,
): { x: number; y: number } {
  const offset =
    document.elements.filter((element) => element.kind === kind).length * 24;
  const boundary = document.elements.find(
    (element) => element.kind === "system-boundary",
  );

  if (kind === "actor") {
    const originX = boundary?.geometry.x ?? 0;
    const originY = boundary?.geometry.y ?? 0;
    return {
      x: originX - DEFAULT_ELEMENT_SIZES.actor.width - 48,
      y: originY + 40 + offset,
    };
  }

  if (kind === "lifeline") {
    const count = document.elements.filter(
      (element) => element.kind === "lifeline",
    ).length;
    return {
      x: count * (DEFAULT_LIFELINE_WIDTH + 40),
      y: 0,
    };
  }

  if (kind === "system-boundary") {
    return { x: offset, y: offset };
  }

  if (kind === "class") {
    return { x: 80 + offset, y: 80 + offset };
  }

  if (kind === "component") {
    return { x: 80 + offset, y: 80 + offset };
  }

  if (kind === "node" || kind === "artifact") {
    return { x: 80 + offset, y: 80 + offset };
  }

  if (
    kind === "entity" ||
    kind === "attribute" ||
    kind === "er-relationship" ||
    kind === "action" ||
    kind === "initial-node" ||
    kind === "activity-final" ||
    kind === "decision-node" ||
    kind === "merge-node" ||
    kind === "fork-node" ||
    kind === "join-node"
  ) {
    return { x: 80 + offset, y: 80 + offset };
  }

  if (boundary === undefined) {
    return { x: 80 + offset, y: 80 + offset };
  }

  return {
    x: boundary.geometry.x + 80 + offset,
    y: boundary.geometry.y + 80 + offset,
  };
}

export function placeActiveCreateTool(
  store: EditorStoreApi,
): Result<DiagramDocument> | undefined {
  const tool = store.getState().tool;
  if (!isCreateElementTool(tool)) {
    return undefined;
  }
  return placeElement(
    store,
    tool,
    defaultPlacementPosition(store.getState().document, tool),
  );
}

export function boundaryContainingPoint(
  document: DiagramDocument,
  point: { x: number; y: number },
): SystemBoundary | undefined {
  return document.elements.find(
    (element): element is SystemBoundary =>
      element.kind === "system-boundary" &&
      point.x >= element.geometry.x &&
      point.x <= element.geometry.x + element.geometry.width &&
      point.y >= element.geometry.y &&
      point.y <= element.geometry.y + element.geometry.height,
  );
}

export function placeElement(
  store: EditorStoreApi,
  kind: CreateElementTool,
  flowPosition: { x: number; y: number },
): Result<DiagramDocument> {
  const state = store.getState();
  const names = state.document.elements.map((element) => element.name);
  const name = nextDefaultName(names, DEFAULT_ELEMENT_NAMES[kind]);
  const idsBefore = new Set(
    state.document.elements.map((element) => element.id),
  );
  const result = createByKind(state, kind, name, flowPosition);

  if (!result.ok) {
    return result;
  }

  const created = result.value.elements.find(
    (element) => !idsBefore.has(element.id),
  );
  if (created !== undefined) {
    store.getState().setSelection({
      elementIds: [created.id],
      relationshipIds: [],
    });
    const announcementName =
      created.name.trim().length > 0
        ? created.name
        : elementTypeLabel(created.kind);
    store
      .getState()
      .setMessage(createdElementAnnouncement(announcementName));
  }
  store.getState().setTool("select");
  return result;
}

function createByKind(
  state: ReturnType<EditorStoreApi["getState"]>,
  kind: CreateElementTool,
  name: string,
  flowPosition: { x: number; y: number },
): Result<DiagramDocument> {
  if (kind === "actor") {
    return state.createActor({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "lifeline") {
    return state.createLifeline({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "system-boundary") {
    return state.createSystemBoundary({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "class") {
    return state.createClass({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "component") {
    return state.createComponent({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "node") {
    return state.createNode({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "artifact") {
    return state.createArtifact({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "entity") {
    return state.createEntity({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "attribute") {
    return state.createAttribute({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "er-relationship") {
    return state.createErRelationship({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "action") {
    return state.createAction({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "initial-node") {
    return state.createInitialNode({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "activity-final") {
    return state.createActivityFinal({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "decision-node") {
    return state.createDecisionNode({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "merge-node") {
    return state.createMergeNode({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "fork-node") {
    return state.createForkNode({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  if (kind === "join-node") {
    return state.createJoinNode({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  const boundary = boundaryContainingPoint(state.document, flowPosition);
  if (boundary === undefined) {
    return state.createUseCase({
      name,
      geometry: geometryAt(kind, flowPosition),
    });
  }

  return state.createUseCase({
    name,
    geometry: {
      x: flowPosition.x - boundary.geometry.x,
      y: flowPosition.y - boundary.geometry.y,
      width: DEFAULT_ELEMENT_SIZES["use-case"].width,
      height: DEFAULT_ELEMENT_SIZES["use-case"].height,
    },
    parentId: boundary.id,
  });
}
