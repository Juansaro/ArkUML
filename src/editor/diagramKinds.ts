import type { DocumentKind } from "../domain/diagram/model.ts";
import type { EditorTool } from "./store/editorStore.ts";

export const SEQUENCE_CREATE_TOOLS = ["lifeline"] as const;

export const SEQUENCE_RELATIONSHIP_TOOLS = [
  "sync-message",
  "reply-message",
] as const;

export const CLASS_CREATE_TOOLS = ["class"] as const;

export const CLASS_RELATIONSHIP_TOOLS = [
  "class-association",
  "aggregation",
  "composition",
  "generalization",
] as const;

export const COMPONENT_CREATE_TOOLS = ["component"] as const;

export const COMPONENT_RELATIONSHIP_TOOLS = [
  "component-usage",
  "assembly-connector",
] as const;

export function isToolForDocumentKind(
  kind: DocumentKind,
  tool: EditorTool,
): boolean {
  if (tool === "select") {
    return true;
  }
  if (kind === "sequence") {
    return (
      tool === "lifeline" ||
      tool === "sync-message" ||
      tool === "reply-message"
    );
  }
  if (kind === "class") {
    return (
      tool === "class" ||
      tool === "class-association" ||
      tool === "aggregation" ||
      tool === "composition" ||
      tool === "generalization"
    );
  }
  if (kind === "component") {
    return (
      tool === "component" ||
      tool === "component-usage" ||
      tool === "assembly-connector"
    );
  }
  return (
    tool === "actor" ||
    tool === "use-case" ||
    tool === "system-boundary" ||
    tool === "association" ||
    tool === "include" ||
    tool === "extend"
  );
}
