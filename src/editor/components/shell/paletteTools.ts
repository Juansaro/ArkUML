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
