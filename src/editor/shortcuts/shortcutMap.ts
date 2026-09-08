export const NUDGE_DISTANCE = 1;
export const NUDGE_GRID_DISTANCE = 16;

export const EDITOR_SHORTCUT_IDS = [
  "delete",
  "undo",
  "redo",
  "duplicate",
  "fitView",
  "save",
  "nudgeLeft",
  "nudgeRight",
  "nudgeUp",
  "nudgeDown",
  "nudgeLeftGrid",
  "nudgeRightGrid",
  "nudgeUpGrid",
  "nudgeDownGrid",
] as const;

export type EditorShortcutId = (typeof EDITOR_SHORTCUT_IDS)[number];

export type EditorShortcutHelpItem = {
  id: string;
  keysLabel: string;
  action: string;
};

export const EDITOR_SHORTCUT_HELP: readonly EditorShortcutHelpItem[] = [
  {
    id: "delete",
    keysLabel: "Delete / Backspace",
    action: "Eliminar selección",
  },
  {
    id: "undo",
    keysLabel: "Ctrl/Cmd+Z",
    action: "Deshacer",
  },
  {
    id: "redo",
    keysLabel: "Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y",
    action: "Rehacer",
  },
  {
    id: "duplicate",
    keysLabel: "Ctrl/Cmd+D",
    action: "Duplicar actores y casos seleccionados",
  },
  {
    id: "rename",
    keysLabel: "F2 / Enter",
    action: "Editar nombre; Enter confirma",
  },
  {
    id: "escape",
    keysLabel: "Escape",
    action: "Cancelar edición, herramienta o conexión",
  },
  {
    id: "nudge",
    keysLabel: "Flechas / Shift+flechas",
    action: "Mover 1 px / 16 px",
  },
  {
    id: "fitView",
    keysLabel: "Ctrl/Cmd+0",
    action: "Ajustar vista",
  },
  {
    id: "save",
    keysLabel: "Ctrl/Cmd+S",
    action: "Guardar ahora (flush de autosave)",
  },
  {
    id: "pan",
    keysLabel: "Space+arrastre / botón medio",
    action: "Desplazar el lienzo",
  },
  {
    id: "zoom",
    keysLabel: "Rueda sobre el lienzo",
    action: "Zoom alrededor del cursor",
  },
  {
    id: "marquee",
    keysLabel: "Arrastre en vacío",
    action: "Selección rectangular",
  },
  {
    id: "clearSelection",
    keysLabel: "Click en el fondo",
    action: "Limpiar selección",
  },
];

export const NUDGE_DELTAS: Record<
  Extract<
    EditorShortcutId,
    | "nudgeLeft"
    | "nudgeRight"
    | "nudgeUp"
    | "nudgeDown"
    | "nudgeLeftGrid"
    | "nudgeRightGrid"
    | "nudgeUpGrid"
    | "nudgeDownGrid"
  >,
  { x: number; y: number }
> = {
  nudgeLeft: { x: -NUDGE_DISTANCE, y: 0 },
  nudgeRight: { x: NUDGE_DISTANCE, y: 0 },
  nudgeUp: { x: 0, y: -NUDGE_DISTANCE },
  nudgeDown: { x: 0, y: NUDGE_DISTANCE },
  nudgeLeftGrid: { x: -NUDGE_GRID_DISTANCE, y: 0 },
  nudgeRightGrid: { x: NUDGE_GRID_DISTANCE, y: 0 },
  nudgeUpGrid: { x: 0, y: -NUDGE_GRID_DISTANCE },
  nudgeDownGrid: { x: 0, y: NUDGE_GRID_DISTANCE },
};

export function isNudgeShortcut(
  shortcut: EditorShortcutId,
): shortcut is keyof typeof NUDGE_DELTAS {
  return shortcut.startsWith("nudge");
}
