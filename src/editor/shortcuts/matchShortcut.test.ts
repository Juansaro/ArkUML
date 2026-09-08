import { describe, expect, it } from "vitest";
import {
  matchEditorShortcut,
  shouldPreventDefault,
  type ShortcutKeyEvent,
} from "./matchShortcut.ts";

function event(
  key: string,
  modifiers: {
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    code?: string;
  } = {},
): ShortcutKeyEvent {
  const next: ShortcutKeyEvent = {
    key,
    ctrlKey: modifiers.ctrlKey ?? false,
    metaKey: modifiers.metaKey ?? false,
    shiftKey: modifiers.shiftKey ?? false,
    altKey: modifiers.altKey ?? false,
  };
  if (modifiers.code !== undefined) {
    next.code = modifiers.code;
  }
  return next;
}

describe("matchEditorShortcut", () => {
  it("mapea atajos del MVP con Ctrl o Cmd", () => {
    expect(matchEditorShortcut(event("Delete"))).toBe("delete");
    expect(matchEditorShortcut(event("Backspace"))).toBe("delete");
    expect(matchEditorShortcut(event("z", { ctrlKey: true }))).toBe("undo");
    expect(matchEditorShortcut(event("z", { metaKey: true }))).toBe("undo");
    expect(
      matchEditorShortcut(event("z", { ctrlKey: true, shiftKey: true })),
    ).toBe("redo");
    expect(matchEditorShortcut(event("y", { metaKey: true }))).toBe("redo");
    expect(matchEditorShortcut(event("d", { ctrlKey: true }))).toBe(
      "duplicate",
    );
    expect(matchEditorShortcut(event("0", { ctrlKey: true }))).toBe("fitView");
    expect(
      matchEditorShortcut(
        event("Unidentified", { ctrlKey: true, code: "Digit0" }),
      ),
    ).toBe("fitView");
    expect(matchEditorShortcut(event("s", { ctrlKey: true }))).toBe("save");
    expect(matchEditorShortcut(event("ArrowRight"))).toBe("nudgeRight");
    expect(matchEditorShortcut(event("ArrowLeft", { shiftKey: true }))).toBe(
      "nudgeLeftGrid",
    );
  });

  it("no intercepta atajos ajenos al mapa", () => {
    expect(matchEditorShortcut(event("p", { ctrlKey: true }))).toBeUndefined();
    expect(matchEditorShortcut(event("f", { ctrlKey: true }))).toBeUndefined();
    expect(
      matchEditorShortcut(event("z", { altKey: true, ctrlKey: true })),
    ).toBe(undefined);
    expect(matchEditorShortcut(event("z"))).toBeUndefined();
    expect(matchEditorShortcut(event("d", { shiftKey: true }))).toBeUndefined();
  });

  it("solo consume flechas cuando hay selección de elementos", () => {
    expect(shouldPreventDefault("nudgeRight", false)).toBe(false);
    expect(shouldPreventDefault("nudgeRight", true)).toBe(true);
    expect(shouldPreventDefault("delete", false)).toBe(true);
    expect(shouldPreventDefault("save", false)).toBe(true);
  });
});
