import { useEffect } from "react";
import { isTypingTarget } from "../interactions/rename.ts";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";
import {
  dispatchEditorShortcut,
  type ShortcutRuntime,
} from "./editorCommands.ts";
import { matchEditorShortcut, shouldPreventDefault } from "./matchShortcut.ts";

export type EditorShortcutOptions = {
  fitView?: () => void;
  flushAutosave?: () => void;
};

export function useEditorShortcuts(options?: EditorShortcutOptions): void {
  const store = useEditorStoreApi();
  const fitView = options?.fitView;
  const flushAutosave = options?.flushAutosave;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      const dialogMode = store.getState().ui.dialogMode;
      if (
        (dialogMode === "help" ||
          dialogMode === "export" ||
          dialogMode === "new-diagram" ||
          dialogMode === "open-file" ||
          dialogMode === "invalid-document-file" ||
          dialogMode === "recovery") &&
        event.key === "Escape"
      ) {
        event.preventDefault();
        store.getState().setDialogMode("none");
        return;
      }
      if (dialogMode !== "none") {
        return;
      }

      const shortcut = matchEditorShortcut(event);
      if (shortcut === undefined) {
        return;
      }

      if (
        !shouldPreventDefault(
          shortcut,
          store.getState().selection.elementIds.length > 0,
        )
      ) {
        return;
      }

      event.preventDefault();
      dispatchEditorShortcut(
        store,
        shortcut,
        runtimeOf(fitView, flushAutosave),
      );
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fitView, flushAutosave, store]);
}

function runtimeOf(
  fitView: (() => void) | undefined,
  flushAutosave: (() => void) | undefined,
): ShortcutRuntime | undefined {
  if (fitView === undefined && flushAutosave === undefined) {
    return undefined;
  }
  return {
    ...(fitView === undefined ? {} : { fitView }),
    ...(flushAutosave === undefined ? {} : { flushAutosave }),
  };
}
