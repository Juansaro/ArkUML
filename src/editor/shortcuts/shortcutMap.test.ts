import { describe, expect, it } from "vitest";
import { EDITOR_SHORTCUT_HELP, NUDGE_GRID_DISTANCE } from "./shortcutMap.ts";

describe("EDITOR_SHORTCUT_HELP", () => {
  it("documenta los atajos del MVP", () => {
    const labels = EDITOR_SHORTCUT_HELP.map((item) => item.keysLabel);
    const actions = EDITOR_SHORTCUT_HELP.map((item) => item.action);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Delete / Backspace",
        "Ctrl/Cmd+Z",
        "Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y",
        "Ctrl/Cmd+D",
        "F2 / Enter",
        "Escape",
        "Flechas / Shift+flechas",
        "Ctrl/Cmd+0",
        "Ctrl/Cmd+S",
      ]),
    );
    expect(actions).toEqual(
      expect.arrayContaining([
        "Eliminar selección",
        "Deshacer",
        "Rehacer",
        "Duplicar actores y casos seleccionados",
        "Ajustar vista",
        "Guardar ahora (flush de autosave)",
      ]),
    );
    expect(NUDGE_GRID_DISTANCE).toBe(16);
  });
});
