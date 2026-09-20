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

export const CLASS_ELEMENT_TOOLS = [
  {
    id: "class",
    label: "Clase",
  },
] as const;

export const COMPONENT_ELEMENT_TOOLS = [
  {
    id: "component",
    label: "Componente",
  },
] as const;

export const DEPLOYMENT_ELEMENT_TOOLS = [
  {
    id: "node",
    label: "Nodo",
  },
  {
    id: "artifact",
    label: "Artefacto",
  },
] as const;

export const ER_ELEMENT_TOOLS = [
  {
    id: "entity",
    label: "Entidad",
  },
  {
    id: "attribute",
    label: "Atributo",
  },
  {
    id: "er-relationship",
    label: "Relación",
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

export const CLASS_RELATIONSHIP_TOOLS = [
  {
    id: "class-association",
    label: "Asociación",
  },
  {
    id: "aggregation",
    label: "Agregación",
    hint: "Origen: todo (diamante vacío). Destino: parte. Arrastra del origen al destino.",
  },
  {
    id: "composition",
    label: "Composición",
    hint: "Origen: compuesto (diamante relleno). Destino: parte. Arrastra del origen al destino.",
  },
  {
    id: "generalization",
    label: "Generalización",
    hint: "Origen: específico. Destino: general. Arrastra del origen al destino; el sentido no se invierte.",
  },
] as const;

export const COMPONENT_RELATIONSHIP_TOOLS = [
  {
    id: "component-usage",
    label: "Uso",
    hint: "Origen: cliente. Destino: proveedor. Arrastra del origen al destino; el sentido no se invierte.",
  },
  {
    id: "assembly-connector",
    label: "Ensamblaje",
    hint: "Origen: provee (bola). Destino: requiere (zócalo). Arrastra del origen al destino.",
  },
] as const;

export const DEPLOYMENT_RELATIONSHIP_TOOLS = [
  {
    id: "communication-path",
    label: "Camino",
    hint: "Unir dos nodos.",
  },
  {
    id: "deploy",
    label: "Desplegar",
    hint: "Origen: artefacto. Destino: nodo. Arrastra del origen al destino; el sentido no se invierte.",
  },
] as const;

export const ER_RELATIONSHIP_TOOLS = [
  {
    id: "er-link",
    label: "Enlace",
    hint: "Unir atributo–entidad o entidad–relación. Arrastra del origen al destino.",
  },
] as const;

export function paletteElementTools(kind: DocumentKind) {
  if (kind === "sequence") {
    return SEQUENCE_ELEMENT_TOOLS;
  }
  if (kind === "class") {
    return CLASS_ELEMENT_TOOLS;
  }
  if (kind === "component") {
    return COMPONENT_ELEMENT_TOOLS;
  }
  if (kind === "deployment") {
    return DEPLOYMENT_ELEMENT_TOOLS;
  }
  if (kind === "entity-relationship") {
    return ER_ELEMENT_TOOLS;
  }
  return PALETTE_ELEMENT_TOOLS;
}

export function paletteRelationshipTools(kind: DocumentKind) {
  if (kind === "sequence") {
    return SEQUENCE_RELATIONSHIP_TOOLS;
  }
  if (kind === "class") {
    return CLASS_RELATIONSHIP_TOOLS;
  }
  if (kind === "component") {
    return COMPONENT_RELATIONSHIP_TOOLS;
  }
  if (kind === "deployment") {
    return DEPLOYMENT_RELATIONSHIP_TOOLS;
  }
  if (kind === "entity-relationship") {
    return ER_RELATIONSHIP_TOOLS;
  }
  return PALETTE_RELATIONSHIP_TOOLS;
}
