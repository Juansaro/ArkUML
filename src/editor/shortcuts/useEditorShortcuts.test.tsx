import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Geometry, Result } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";
import { DELETED_SELECTION_MESSAGE } from "./editorCommands.ts";
import {
  useEditorShortcuts,
  type EditorShortcutOptions,
} from "./useEditorShortcuts.ts";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 48, height: 96 };

function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected ok result");
  }
  return result.value;
}

function createStore() {
  const createId = sequentialIds();
  return createEditorStore({
    document: createDiagramDocument({
      createId,
      now: () => CREATED_AT,
    }),
    deps: { createId, now: () => new Date("2026-09-08T08:00:00.000Z") },
  });
}

function Harness(options: EditorShortcutOptions) {
  useEditorShortcuts(options);
  return (
    <label>
      Nombre
      <input aria-label="Nombre de prueba" defaultValue="Cliente" />
    </label>
  );
}

function renderShortcuts(
  store = createStore(),
  options: EditorShortcutOptions = {},
) {
  return {
    store,
    user: userEvent.setup(),
    ...render(
      <EditorStoreProvider store={store}>
        <Harness {...options} />
      </EditorStoreProvider>,
    ),
  };
}

describe("useEditorShortcuts", () => {
  it("elimina, duplica y no dispara atajos destructivos dentro de un input", async () => {
    const { store, user } = renderShortcuts();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actorId = store
      .getState()
      .document.elements.find((element) => element.kind === "actor")?.id;
    if (actorId === undefined) {
      throw new Error("Falta el actor");
    }
    store.getState().setSelection({
      elementIds: [actorId],
      relationshipIds: [],
    });

    await user.keyboard("{Control>}d{/Control}");
    expect(
      store
        .getState()
        .document.elements.filter((element) => element.kind === "actor"),
    ).toHaveLength(2);

    const input = screen.getByLabelText("Nombre de prueba");
    await user.click(input);
    await user.keyboard("{Delete}");
    expect(
      store
        .getState()
        .document.elements.filter((element) => element.kind === "actor"),
    ).toHaveLength(2);

    input.blur();
    await user.keyboard("{Delete}");
    expect(
      store
        .getState()
        .document.elements.filter((element) => element.kind === "actor"),
    ).toHaveLength(1);
    expect(store.getState().ui.message).toBe(DELETED_SELECTION_MESSAGE);
  });

  it("invoca fit view y flush sin interceptar Ctrl+P", () => {
    const fitView = vi.fn();
    const flushAutosave = vi.fn();
    renderShortcuts(createStore(), { fitView, flushAutosave });

    const save = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    const fit = new KeyboardEvent("keydown", {
      key: "0",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    const print = new KeyboardEvent("keydown", {
      key: "p",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(save);
    window.dispatchEvent(fit);
    window.dispatchEvent(print);

    expect(save.defaultPrevented).toBe(true);
    expect(fit.defaultPrevented).toBe(true);
    expect(print.defaultPrevented).toBe(false);
    expect(fitView).toHaveBeenCalledTimes(1);
    expect(flushAutosave).toHaveBeenCalledTimes(1);
  });
});
