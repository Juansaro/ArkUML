import type {
  Anchor,
  DiagramDocument,
  DiagramElement,
  Result,
} from "../../domain/diagram/model.ts";
import type {
  ClassRelationshipKind,
  ComponentRelationshipKind,
  DeploymentRelationshipKind,
} from "../../domain/diagram/model.ts";
import {
  isClassRelationship,
  isComponentRelationship,
  isDeploymentRelationship,
  isLifeline,
  isSequenceMessage,
  isUseCaseRelationship,
} from "../../domain/diagram/model.ts";
import { canConnect } from "../../domain/diagram/rules.ts";
import type {
  CreateRelationshipInput,
  ReconnectRelationshipInput,
} from "../../domain/diagram/operations.ts";
import { elementAccessibleName } from "../a11y/labels.ts";
import type { EditorStoreApi, EditorTool } from "../store/editorStore.ts";

export const RELATIONSHIP_TOOLS = [
  "association",
  "include",
  "extend",
  "sync-message",
  "reply-message",
  "class-association",
  "aggregation",
  "composition",
  "generalization",
  "component-usage",
  "assembly-connector",
  "communication-path",
  "deploy",
] as const;

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
  return (
    tool === "association" ||
    tool === "include" ||
    tool === "extend" ||
    tool === "sync-message" ||
    tool === "reply-message" ||
    tool === "class-association" ||
    tool === "aggregation" ||
    tool === "composition" ||
    tool === "generalization" ||
    tool === "component-usage" ||
    tool === "assembly-connector" ||
    tool === "communication-path" ||
    tool === "deploy"
  );
}

export function isClassRelationshipTool(
  tool: EditorTool,
): tool is ClassRelationshipKind {
  return (
    tool === "class-association" ||
    tool === "aggregation" ||
    tool === "composition" ||
    tool === "generalization"
  );
}

export function isComponentRelationshipTool(
  tool: EditorTool,
): tool is ComponentRelationshipKind {
  return tool === "component-usage" || tool === "assembly-connector";
}

export function isDeploymentRelationshipTool(
  tool: EditorTool,
): tool is DeploymentRelationshipKind {
  return tool === "communication-path" || tool === "deploy";
}

export function isSequenceRelationshipTool(
  tool: EditorTool,
): tool is "sync-message" | "reply-message" {
  return tool === "sync-message" || tool === "reply-message";
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
  if (kind === "sync-message") {
    return "Se creó el mensaje síncrono.";
  }
  if (kind === "reply-message") {
    return "Se creó reply.";
  }
  if (kind === "class-association") {
    return "Se creó la asociación.";
  }
  if (kind === "aggregation") {
    return "Se creó la agregación.";
  }
  if (kind === "composition") {
    return "Se creó la composición.";
  }
  if (kind === "generalization") {
    return "Se creó la generalización.";
  }
  if (kind === "component-usage") {
    return "Se creó el uso.";
  }
  if (kind === "assembly-connector") {
    return "Se creó el ensamblaje.";
  }
  if (kind === "communication-path") {
    return "Se creó el camino de comunicación.";
  }
  if (kind === "deploy") {
    return "Se creó deploy.";
  }
  return "Se creó extend.";
}

export function updatedRelationshipAnnouncement(
  kind: RelationshipTool,
): string {
  if (kind === "association") {
    return "Se actualizó la asociación.";
  }
  if (kind === "include") {
    return "Se actualizó include.";
  }
  return "Se actualizó extend.";
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
  if (isClassRelationshipTool(tool)) {
    if (tool === "aggregation") {
      return "Origen: todo (diamante vacío). Destino: parte. Arrastra del origen al destino.";
    }
    if (tool === "composition") {
      return "Origen: compuesto (diamante relleno). Destino: parte. Arrastra del origen al destino.";
    }
    if (tool === "generalization") {
      return "Origen: específico. Destino: general. Arrastra del origen al destino; el sentido no se invierte.";
    }
    return "Unir dos clases.";
  }
  if (isComponentRelationshipTool(tool)) {
    if (tool === "assembly-connector") {
      return "Origen: provee (bola). Destino: requiere (zócalo). Arrastra del origen al destino.";
    }
    return "Origen: cliente. Destino: proveedor. Arrastra del origen al destino; el sentido no se invierte.";
  }
  if (isDeploymentRelationshipTool(tool)) {
    if (tool === "deploy") {
      return "Origen: artefacto. Destino: nodo. Arrastra del origen al destino; el sentido no se invierte.";
    }
    return "Unir dos nodos.";
  }
  if (tool === "sync-message") {
    return "Mensaje síncrono (llamada).";
  }
  if (tool === "reply-message") {
    return "Mensaje de respuesta.";
  }
  return undefined;
}

export function relationshipEndpointFieldLabels(kind: RelationshipTool): {
  source: string;
  target: string;
} {
  if (kind === "include") {
    return { source: "Origen (incluye)", target: "Destino (incluido)" };
  }
  if (kind === "extend") {
    return { source: "Origen (extiende)", target: "Destino (caso base)" };
  }
  if (kind === "generalization") {
    return { source: "Origen (específico)", target: "Destino (general)" };
  }
  if (kind === "component-usage") {
    return { source: "Origen (cliente)", target: "Destino (proveedor)" };
  }
  if (kind === "assembly-connector") {
    return { source: "Origen (provee)", target: "Destino (requiere)" };
  }
  if (kind === "deploy") {
    return { source: "Origen (artefacto)", target: "Destino (nodo)" };
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

export function connectionRejectionMessage(
  document: DiagramDocument,
  kind: RelationshipTool,
  sourceId: string,
  targetId: string,
): string | undefined {
  if (sourceId.length === 0) {
    return undefined;
  }

  if (targetId.length > 0) {
    return rejectionFromPreview(
      previewConnection(document, {
        kind,
        sourceId,
        targetId,
      }),
    );
  }

  const options = connectableEndpointOptions(document, kind);
  if (validRelationshipTargets(document, kind, sourceId, options).length > 0) {
    return undefined;
  }

  const probeId =
    options.find((option) => option.id !== sourceId)?.id ?? sourceId;
  return rejectionFromPreview(
    previewConnection(document, {
      kind,
      sourceId,
      targetId: probeId,
    }),
  );
}

function rejectionFromPreview(
  preview: Result<{ sourceId: string; targetId: string }>,
): string | undefined {
  return preview.ok ? undefined : preview.error.message;
}

function isConnectableEndpoint(
  kind: RelationshipTool,
  element: DiagramElement,
): boolean {
  if (isClassRelationshipTool(kind)) {
    return element.kind === "class";
  }
  if (isComponentRelationshipTool(kind)) {
    return element.kind === "component";
  }
  if (kind === "communication-path") {
    return element.kind === "node";
  }
  if (kind === "deploy") {
    return element.kind === "artifact" || element.kind === "node";
  }
  if (kind === "sync-message" || kind === "reply-message") {
    return isLifeline(element);
  }
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
  y?: number,
): CreateRelationshipInput {
  if (kind === "sync-message" || kind === "reply-message") {
    return {
      kind,
      sourceId: connection.source,
      targetId: connection.target,
      y: y ?? 0,
    };
  }
  if (isClassRelationshipTool(kind)) {
    return {
      kind,
      sourceId: connection.source,
      targetId: connection.target,
    };
  }
  if (isComponentRelationshipTool(kind)) {
    return {
      kind,
      sourceId: connection.source,
      targetId: connection.target,
    };
  }
  if (isDeploymentRelationshipTool(kind)) {
    return {
      kind,
      sourceId: connection.source,
      targetId: connection.target,
    };
  }
  return {
    kind,
    sourceId: connection.source,
    targetId: connection.target,
    sourceAnchor: anchorFromHandle(connection.sourceHandle),
    targetAnchor: anchorFromHandle(connection.targetHandle),
  };
}

export function defaultMessageY(
  document: DiagramDocument,
  sourceId: string,
  targetId: string,
): number {
  const source = document.elements.find((element) => element.id === sourceId);
  const target = document.elements.find((element) => element.id === targetId);
  const bottoms: number[] = [];
  if (source !== undefined && isLifeline(source)) {
    bottoms.push(source.geometry.y + source.geometry.height);
  }
  if (target !== undefined && isLifeline(target)) {
    bottoms.push(target.geometry.y + target.geometry.height);
  }
  const minY = bottoms.length === 0 ? 0 : Math.max(...bottoms);
  const existing = document.relationships.flatMap((relationship) =>
    isSequenceMessage(relationship) ? [relationship.y] : [],
  );
  if (existing.length === 0) {
    return minY;
  }
  return Math.max(minY, Math.max(...existing) + 24);
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
    if (
      isUseCaseRelationship(created) ||
      isSequenceMessage(created) ||
      isClassRelationship(created) ||
      isComponentRelationship(created) ||
      isDeploymentRelationship(created)
    ) {
      store.getState().setMessage(createdRelationshipAnnouncement(created.kind));
    }
    store.getState().setTool("select");
  }
  return result;
}

export function commitReconnect(
  store: EditorStoreApi,
  input: ReconnectRelationshipInput,
): Result<DiagramDocument> {
  const before = store.getState().document;
  const result = store.getState().reconnect(input);
  if (!result.ok) {
    return result;
  }

  store.getState().setSelection({
    elementIds: [],
    relationshipIds: [input.id],
  });
  if (result.value !== before) {
    const updated = result.value.relationships.find(
      (relationship) => relationship.id === input.id,
    );
    if (updated !== undefined && isUseCaseRelationship(updated)) {
      store
        .getState()
        .setMessage(updatedRelationshipAnnouncement(updated.kind));
    }
  }
  return result;
}
