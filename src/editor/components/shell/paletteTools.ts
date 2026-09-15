import type { DocumentKind } from "../../../domain/diagram/model.ts";

export const PALETTE_SELECT_TOOL = {
  id: "select",
  label: "Selección",
} as const;

export const PALETTE_ELEMENT_TOOLS = [
  {
    id: "actor",
    label: "Actor",
  },
  {
    id: "use-case",
    label: "Caso de uso",
  },
  {
    id: "system-boundary",
    label: "Límite del sistema",
  },
] as const;

export const SEQUENCE_ELEMENT_TOOLS = [
  {
    id: "lifeline",
    label: "Lifeline",
  },
] as const;

export const BOUNDARY_EXISTS_REASON =
  "Ya existe un límite del sistema. El documento admite uno solo.";

export const PALETTE_RELATIONSHIP_TOOLS = [
  {
    id: "association",
    label: "Asociación",
  },
  {
    id: "include",
    label: "Include",
    hint: "Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte.",
  },
  {
    id: "extend",
    label: "Extend",
    hint: "Origen: caso que extiende. Destino: caso base. Arrastra del origen al destino; el sentido no se invierte.",
  },
] as const;

export const SEQUENCE_RELATIONSHIP_TOOLS = [
  {
    id: "sync-message",
    label: "Mensaje síncrono",
    hint: "Mensaje síncrono (llamada).",
  },
  {
    id: "reply-message",
    label: "Reply",
    hint: "Mensaje de respuesta.",
  },
] as const;

export function paletteElementTools(kind: DocumentKind) {
  return kind === "sequence" ? SEQUENCE_ELEMENT_TOOLS : PALETTE_ELEMENT_TOOLS;
}

export function paletteRelationshipTools(kind: DocumentKind) {
  return kind === "sequence"
    ? SEQUENCE_RELATIONSHIP_TOOLS
    : PALETTE_RELATIONSHIP_TOOLS;
}
