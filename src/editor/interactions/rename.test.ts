import { describe, expect, it } from "vitest";
import { isRenameShortcutBlocked, isTypingTarget } from "./rename.ts";

describe("isTypingTarget", () => {
  it("reconoce input, textarea y contenteditable", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const button = document.createElement("button");

    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(textarea)).toBe(true);
    expect(isTypingTarget(editable)).toBe(true);
    expect(isTypingTarget(button)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("isRenameShortcutBlocked", () => {
  it("bloquea Enter sobre botones del chrome", () => {
    const button = document.createElement("button");
    const pane = document.createElement("div");

    expect(isRenameShortcutBlocked(button)).toBe(true);
    expect(isRenameShortcutBlocked(pane)).toBe(false);
  });
});
