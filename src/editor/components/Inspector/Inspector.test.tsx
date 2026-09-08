import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, Profiler } from "react";
import { describe, expect, it } from "vitest";
import { NAME_MAX_LENGTH } from "../../../domain/diagram/defaults.ts";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../../domain/diagram/factories.ts";
import type { Geometry, Result } from "../../../domain/diagram/model.ts";
import { createEditorStore } from "../../store/editorStore.ts";
import { selectInspectorView, shallow } from "../../store/selectors.ts";
import { EditorStoreProvider } from "../../store/EditorStoreProvider.tsx";
import { Inspector } from "./Inspector.tsx";

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
const USE_CASE_GEOMETRY: Geometry = { x: 80, y: 80, width: 160, height: 80 };

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

function renderInspector(store: ReturnType<typeof createStore>) {
  return render(
    <EditorStoreProvider store={store}>
      <Inspector headingId="inspector-heading" />
    </EditorStoreProvider>,
  );
}

describe("Inspector", () => {
  it("muestra el estado vacío sin selección", () => {
    renderInspector(createStore());

    expect(
      screen.getByText(/Selecciona un elemento o una relación/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("muestra tipo y nombre del elemento seleccionado", () => {
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    store.getState().setSelection({
      elementIds: [actor.id],
      relationshipIds: [],
    });

    renderInspector(store);

    expect(screen.getByTestId("inspector-type")).toHaveTextContent("Actor");
    expect(screen.getByLabelText("Nombre")).toHaveValue("Usuario");
  });

  it("confirma un nombre válido y conserva el anterior si es inválido", async () => {
    const user = userEvent.setup();
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    store.getState().setSelection({
      elementIds: [actor.id],
      relationshipIds: [],
    });

    renderInspector(store);
    const input = screen.getByLabelText("Nombre");

    await user.clear(input);
    await user.type(input, "Cliente");
    await user.keyboard("{Enter}");

    expect(actorOf(store).name).toBe("Cliente");
    expect(input).toHaveValue("Cliente");

    await user.clear(input);
    await user.keyboard("{Enter}");

    expect(actorOf(store).name).toBe("Cliente");
    expect(screen.getByText(/entre 1 y 80 caracteres/i)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "x".repeat(NAME_MAX_LENGTH + 1));
    await user.keyboard("{Enter}");

    expect(actorOf(store).name).toBe("Cliente");
    expect(input).toHaveValue("x".repeat(NAME_MAX_LENGTH + 1));
  });

  it("cancela el borrador con Escape", async () => {
    const user = userEvent.setup();
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    store.getState().setSelection({
      elementIds: [actor.id],
      relationshipIds: [],
    });

    renderInspector(store);
    const input = screen.getByLabelText("Nombre");

    await user.clear(input);
    await user.type(input, "Temporal");
    await user.keyboard("{Escape}");

    expect(actorOf(store).name).toBe("Usuario");
    expect(input).toHaveValue("Usuario");
  });

  it("muestra n seleccionados sin edición batch", () => {
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
      }),
    );
    const ids = store.getState().document.elements.map((element) => element.id);
    store.getState().setSelection({
      elementIds: ids,
      relationshipIds: [],
    });

    renderInspector(store);

    expect(screen.getByTestId("inspector-multiple")).toHaveTextContent(
      "3 seleccionados",
    );
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("no se re-renderiza cuando solo cambia la geometría", () => {
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    const actor = actorOf(store);
    store.getState().setSelection({
      elementIds: [actor.id],
      relationshipIds: [],
    });

    let commits = 0;
    render(
      <EditorStoreProvider store={store}>
        <Profiler
          id="inspector"
          onRender={() => {
            commits += 1;
          }}
        >
          <Inspector headingId="inspector-heading" />
        </Profiler>
      </EditorStoreProvider>,
    );

    const afterMount = commits;
    const firstView = selectInspectorView(store.getState());

    store.getState().beginTransaction();
    expectOk(store.getState().commitMove([{ id: actor.id, x: -200, y: 20 }]));
    expectOk(store.getState().commitMove([{ id: actor.id, x: -180, y: 10 }]));
    store.getState().commitTransaction();

    expect(shallow(firstView, selectInspectorView(store.getState()))).toBe(
      true,
    );
    expect(commits).toBe(afterMount);
    expect(screen.getByLabelText("Nombre")).toHaveValue("Usuario");
  });

  it("muestra avisos no bloqueantes de geometría", () => {
    const store = createStore();
    expectOk(
      store.getState().createActor({
        name: "Usuario",
        geometry: { x: 40, y: 40, width: 72, height: 112 },
      }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: { x: 900, y: 80, width: 160, height: 80 },
      }),
    );

    renderInspector(store);

    const warnings = screen.getByTestId("inspector-warnings");
    expect(warnings).toHaveAttribute("aria-label", "Avisos del diagrama");
    expect(screen.getAllByTestId("inspector-warning")).toHaveLength(2);
    expect(warnings).toHaveTextContent(/Usuario:.*actor/i);
    expect(warnings).toHaveTextContent(/Login:.*fuera/i);
  });

  it("muestra tipo y extremos de la asociación, sin etiqueta editable", () => {
    const store = createStore();
    expectOk(
      store
        .getState()
        .createActor({ name: "Usuario", geometry: ACTOR_GEOMETRY }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
      }),
    );
    const actor = actorOf(store);
    const useCase = store
      .getState()
      .document.elements.find((element) => element.kind === "use-case");
    if (useCase === undefined) {
      throw new Error("Falta el caso de uso");
    }
    expectOk(
      store.getState().connect({
        kind: "association",
        sourceId: useCase.id,
        targetId: actor.id,
        sourceAnchor: "left",
        targetAnchor: "right",
      }),
    );
    const relationship = store.getState().document.relationships[0];
    if (relationship === undefined) {
      throw new Error("Falta la asociación");
    }
    store.getState().setSelection({
      elementIds: [],
      relationshipIds: [relationship.id],
    });

    renderInspector(store);

    expect(screen.getByTestId("inspector-type")).toHaveTextContent(
      "Asociación",
    );
    expect(screen.getByTestId("inspector-source")).toHaveTextContent(
      "Actor Usuario",
    );
    expect(screen.getByTestId("inspector-target")).toHaveTextContent(
      "Caso de uso Login",
    );
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("explica origen y destino al activar include o extend", () => {
    const store = createStore();
    store.getState().setTool("include");
    renderInspector(store);

    expect(screen.getByTestId("connection-help")).toHaveTextContent(
      "Origen: caso que incluye. Destino: caso incluido.",
    );
    expect(screen.getByTestId("connection-help")).toHaveTextContent(
      "el sentido no se invierte",
    );

    act(() => {
      store.getState().setTool("extend");
    });
    expect(screen.getByTestId("connection-help")).toHaveTextContent(
      "Origen: caso que extiende. Destino: caso base.",
    );
  });

  it("muestra extremos semánticos de include y extend", () => {
    const store = createStore();
    expectOk(
      store.getState().createUseCase({
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
      }),
    );
    expectOk(
      store.getState().createUseCase({
        name: "Logout",
        geometry: { ...USE_CASE_GEOMETRY, x: 280 },
      }),
    );
    const login = store
      .getState()
      .document.elements.find(
        (element) => element.kind === "use-case" && element.name === "Login",
      );
    const logout = store
      .getState()
      .document.elements.find(
        (element) => element.kind === "use-case" && element.name === "Logout",
      );
    if (login === undefined || logout === undefined) {
      throw new Error("Faltan casos de uso");
    }
    expectOk(
      store.getState().connect({
        kind: "include",
        sourceId: logout.id,
        targetId: login.id,
        sourceAnchor: "left",
        targetAnchor: "right",
      }),
    );
    const include = store.getState().document.relationships[0];
    if (include === undefined) {
      throw new Error("Falta include");
    }
    store.getState().setTool("include");
    store.getState().setSelection({
      elementIds: [],
      relationshipIds: [include.id],
    });

    renderInspector(store);

    expect(screen.getByTestId("inspector-type")).toHaveTextContent("Include");
    expect(screen.getByText("Origen (incluye)")).toBeInTheDocument();
    expect(screen.getByText("Destino (incluido)")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-source")).toHaveTextContent(
      "Caso de uso Logout",
    );
    expect(screen.getByTestId("inspector-target")).toHaveTextContent(
      "Caso de uso Login",
    );
    expect(screen.getByTestId("connection-help")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });
});
