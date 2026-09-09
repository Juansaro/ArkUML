import type {
  Anchor,
  DiagramDocument,
  DiagramElement,
  RelationshipKind,
  Result,
} from "../../domain/diagram/model.ts";
import { canConnect } from "../../domain/diagram/rules.ts";
import type { CreateRelationshipInput } from "../../domain/diagram/operations.ts";
import { elementAccessibleName } from "../a11y/labels.ts";
import type { EditorStoreApi, EditorTool } from "../store/editorStore.ts";

export const RELATIONSHIP_TOOLS = ["association", "include", "extend"] as const;

export type RelationshipTool = (typeof RELATIONSHIP_TOOLS)[number];

export const EDGE_INTERACTION_WIDTH = 24;

export type RelationshipConnection = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

const ANCHORS: readonly Anchor[] = ["top", "right", "bottom", "left"];

export function isRelationshipTool(tool: EditorTool): tool is RelationshipTool {
  return tool === "association" || tool === "include" || tool === "extend";
}

export function relationshipKindFromTool(
  tool: EditorTool,
): RelationshipTool | undefined {
  if (!isRelationshipTool(tool)) {
    return undefined;
  }
  return tool;
}

export function anchorFromHandle(handleId: string | null | undefined): Anchor {
  if (handleId === undefined || handleId === null) {
    return "right";
  }
  for (const anchor of ANCHORS) {
    if (anchor === handleId) {
      return anchor;
    }
  }
  return "right";
}

export function createdRelationshipAnnouncement(
  kind: RelationshipTool,
): string {
  if (kind === "association") {
    return "Se creó la asociación.";
  }
  if (kind === "include") {
    return "Se creó include.";
  }
  return "Se creó extend.";
}

export function relationshipConnectionHelp(
  tool: EditorTool,
): string | undefined {
  if (tool === "association") {
    return "Elige un actor y un caso de uso. También puedes arrastrar entre handles.";
  }
  if (tool === "include") {
    return "Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte.";
  }
  if (tool === "extend") {
    return "Origen: caso que extiende. Destino: caso base. Arrastra del origen al destino; el sentido no se invierte.";
  }
  return undefined;
}

export function relationshipEndpointFieldLabels(kind: RelationshipKind): {
  source: string;
  target: string;
} {
  if (kind === "include") {
    return { source: "Origen (incluye)", target: "Destino (incluido)" };
  }
  if (kind === "extend") {
    return { source: "Origen (extiende)", target: "Destino (caso base)" };
  }
  return { source: "Origen", target: "Destino" };
}

export type RelationshipEndpointOption = {
  id: string;
  label: string;
};

export function connectableEndpointOptions(
  document: DiagramDocument,
  kind: RelationshipTool,
): readonly RelationshipEndpointOption[] {
  return document.elements.flatMap((element) => {
    if (!isConnectableEndpoint(kind, element)) {
      return [];
    }
    return [{ id: element.id, label: elementAccessibleName(element) }];
  });
}

export function validRelationshipTargets(
  document: DiagramDocument,
  kind: RelationshipTool,
  sourceId: string,
  candidates: readonly RelationshipEndpointOption[],
): readonly RelationshipEndpointOption[] {
  return candidates.filter(
    (candidate) =>
      previewConnection(document, {
        kind,
        sourceId,
        targetId: candidate.id,
      }).ok,
  );
}

function isConnectableEndpoint(
  kind: RelationshipTool,
  element: DiagramElement,
): boolean {
  if (element.kind === "system-boundary") {
    return false;
  }
  if (kind === "association") {
    return element.kind === "actor" || element.kind === "use-case";
  }
  return element.kind === "use-case";
}

export function previewConnection(
  document: DiagramDocument,
  input: {
    kind: RelationshipTool;
    sourceId: string;
    targetId: string;
  },
): Result<{ sourceId: string; targetId: string }> {
  return canConnect(document, input);
}

export function isValidRelationshipConnection(
  document: DiagramDocument,
  kind: RelationshipTool,
  connection: RelationshipConnection,
): boolean {
  if (connection.source.length === 0 || connection.target.length === 0) {
    return false;
  }
  return previewConnection(document, {
    kind,
    sourceId: connection.source,
    targetId: connection.target,
  }).ok;
}

export function relationshipInputFromConnection(
  kind: RelationshipTool,
  connection: RelationshipConnection,
): CreateRelationshipInput {
  return {
    kind,
    sourceId: connection.source,
    targetId: connection.target,
    sourceAnchor: anchorFromHandle(connection.sourceHandle),
    targetAnchor: anchorFromHandle(connection.targetHandle),
  };
}

export function announceInvalidConnection(
  store: EditorStoreApi,
  kind: RelationshipTool,
  sourceId: string,
  targetId: string,
): void {
  const preview = previewConnection(store.getState().document, {
    kind,
    sourceId,
    targetId,
  });
  if (preview.ok) {
    return;
  }
  store.getState().setMessage(preview.error.message);
}

export function commitRelationship(
  store: EditorStoreApi,
  input: CreateRelationshipInput,
): Result<DiagramDocument> {
  const idsBefore = new Set(
    store
      .getState()
      .document.relationships.map((relationship) => relationship.id),
  );
  const result = store.getState().connect(input);
  if (!result.ok) {
    return result;
  }

  const created = result.value.relationships.find(
    (relationship) => !idsBefore.has(relationship.id),
  );
  if (created !== undefined) {
    store.getState().setSelection({
      elementIds: [],
      relationshipIds: [created.id],
    });
    store.getState().setMessage(createdRelationshipAnnouncement(created.kind));
  }
  return result;
}
