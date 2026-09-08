import { isNudgeShortcut, type EditorShortcutId } from "./shortcutMap.ts";

export type ShortcutKeyEvent = {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

export function hasModifierKey(event: ShortcutKeyEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

export function matchEditorShortcut(
  event: ShortcutKeyEvent,
): EditorShortcutId | undefined {
  if (event.altKey) {
    return undefined;
  }

  const key = event.key;
  const mod = hasModifierKey(event);

  if (!mod && (key === "Delete" || key === "Backspace")) {
    return "delete";
  }

  if (mod && !event.shiftKey && key.toLowerCase() === "z") {
    return "undo";
  }

  if (
    (mod && event.shiftKey && key.toLowerCase() === "z") ||
    (mod && !event.shiftKey && key.toLowerCase() === "y")
  ) {
    return "redo";
  }

  if (mod && !event.shiftKey && key.toLowerCase() === "d") {
    return "duplicate";
  }

  if (mod && !event.shiftKey && isZeroKey(event)) {
    return "fitView";
  }

  if (mod && !event.shiftKey && key.toLowerCase() === "s") {
    return "save";
  }

  if (mod) {
    return undefined;
  }

  return matchArrowShortcut(key, event.shiftKey);
}

export function shouldPreventDefault(
  shortcut: EditorShortcutId,
  hasElementSelection: boolean,
): boolean {
  if (isNudgeShortcut(shortcut)) {
    return hasElementSelection;
  }
  return true;
}

function isZeroKey(event: ShortcutKeyEvent): boolean {
  return (
    event.key === "0" || event.code === "Numpad0" || event.code === "Digit0"
  );
}

function matchArrowShortcut(
  key: string,
  shiftKey: boolean,
): EditorShortcutId | undefined {
  if (key === "ArrowLeft") {
    return shiftKey ? "nudgeLeftGrid" : "nudgeLeft";
  }
  if (key === "ArrowRight") {
    return shiftKey ? "nudgeRightGrid" : "nudgeRight";
  }
  if (key === "ArrowUp") {
    return shiftKey ? "nudgeUpGrid" : "nudgeUp";
  }
  if (key === "ArrowDown") {
    return shiftKey ? "nudgeDownGrid" : "nudgeDown";
  }
  return undefined;
}
