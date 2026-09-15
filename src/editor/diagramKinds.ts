import type { DocumentKind } from "../domain/diagram/model.ts";
import type { EditorTool } from "./store/editorStore.ts";

export const SEQUENCE_CREATE_TOOLS = ["lifeline"] as const;

export const SEQUENCE_RELATIONSHIP_TOOLS = [
  "sync-message",
  "reply-message",
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
  return (
    tool === "actor" ||
    tool === "use-case" ||
    tool === "system-boundary" ||
    tool === "association" ||
    tool === "include" ||
    tool === "extend"
  );
}
