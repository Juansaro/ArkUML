import { DEFAULT_BOUNDARY_GEOMETRY } from "../../domain/diagram/defaults.ts";
import type {
  DiagramDocument,
  Geometry,
  Result,
  SystemBoundary,
  Viewport,
} from "../../domain/diagram/model.ts";
import type { EditorStoreApi, EditorTool } from "../store/editorStore.ts";

export const CREATE_ELEMENT_TOOLS = [
  "actor",
  "use-case",
  "system-boundary",
] as const;

export type CreateElementTool = (typeof CREATE_ELEMENT_TOOLS)[number];

export const DEFAULT_ELEMENT_NAMES = {
  actor: "Actor",
  "use-case": "Caso de uso",
  "system-boundary": "Sistema",
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
};

export function isCreateElementTool(
  tool: EditorTool,
): tool is CreateElementTool {
  return tool === "actor" || tool === "use-case" || tool === "system-boundary";
}

export function isRelationshipTool(tool: EditorTool): boolean {
  return tool === "association" || tool === "include" || tool === "extend";
}

export function nextDefaultName(
  existingNames: readonly string[],
  base: string,
): string {
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
    store.getState().setMessage(createdElementAnnouncement(created.name));
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

  if (kind === "system-boundary") {
    return state.createSystemBoundary({
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
