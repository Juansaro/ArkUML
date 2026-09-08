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
    reason: "Asociación. La creación en el lienzo aún no está disponible.",
  },
  {
    id: "include",
    label: "Include",
    reason: "Include. La creación en el lienzo aún no está disponible.",
  },
  {
    id: "extend",
    label: "Extend",
    reason: "Extend. La creación en el lienzo aún no está disponible.",
  },
] as const;
