import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type { Geometry, Result } from "../../domain/diagram/model.ts";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";
import { ElementNameField } from "./ElementNameField.tsx";

function sequentialIds(start = 1): IdFactory {
  let next = start;
  return () => {
    const serial = next.toString(16).padStart(12, "0");
    next += 1;
    return `00000000-0000-4000-8000-${serial}`;
  };
}

const CREATED_AT = new Date("2026-09-07T12:00:00.000Z");
const ACTOR_GEOMETRY: Geometry = { x: -120, y: 40, width: 72, height: 112 };

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

function actorOf(store: ReturnType<typeof createStore>) {
  const actor = store
    .getState()
    .document.elements.find((element) => element.kind === "actor");
  if (actor === undefined) {
    throw new Error("Falta el actor");
  }
  return actor;
}

describe("ElementNameField", () => {
  it("cancela el borrador y no persiste", async () => {
    const user = userEvent.setup();
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    let cancelled = false;

    render(
      <EditorStoreProvider store={store}>
        <ElementNameField
          elementId={actor.id}
          name={actor.name}
          ariaLabel="Nombre del elemento"
          onCancel={() => {
            cancelled = true;
          }}
        />
      </EditorStoreProvider>,
    );

    const input = screen.getByLabelText("Nombre del elemento");
    await user.clear(input);
    await user.type(input, "Temporal");
    await user.keyboard("{Escape}");

    expect(cancelled).toBe(true);
    expect(actorOf(store).name).toBe("Usuario");
  });

  it("en blur inválido restaura el nombre anterior", async () => {
    const user = userEvent.setup();
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    let invalidBlur = false;

    render(
      <EditorStoreProvider store={store}>
        <ElementNameField
          elementId={actor.id}
          name={actor.name}
          ariaLabel="Nombre del elemento"
          onInvalidBlur={() => {
            invalidBlur = true;
          }}
        />
        <button type="button">Fuera</button>
      </EditorStoreProvider>,
    );

    const input = screen.getByLabelText("Nombre del elemento");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Fuera" }));

    expect(invalidBlur).toBe(true);
    expect(actorOf(store).name).toBe("Usuario");
    expect(input).toHaveValue("Usuario");
  });
});
