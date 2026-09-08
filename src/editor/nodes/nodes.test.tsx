import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createDiagramDocument,
  type IdFactory,
} from "../../domain/diagram/factories.ts";
import type {
  DiagramDocument,
  Geometry,
  Result,
} from "../../domain/diagram/model.ts";
import { createElement } from "../../domain/diagram/operations.ts";
import { DiagramCanvas } from "../canvas/DiagramCanvas.tsx";
import { createEditorStore } from "../store/editorStore.ts";
import { EditorStoreProvider } from "../store/EditorStoreProvider.tsx";

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
    throw new Error(result.error.message);
  }
  return result.value;
}

function createPopulatedDocument(): DiagramDocument {
  const deps = { createId: sequentialIds(), now: () => CREATED_AT };
  const empty = createDiagramDocument(deps);
  const boundary = empty.elements[0];
  if (boundary === undefined) {
    throw new Error("Falta el boundary");
  }

  const withActor = expectOk(
    createElement(
      empty,
      { kind: "actor", name: "Usuario", geometry: ACTOR_GEOMETRY },
      deps,
    ),
  );
  return expectOk(
    createElement(
      withActor,
      {
        kind: "use-case",
        name: "Login",
        geometry: USE_CASE_GEOMETRY,
        parentId: boundary.id,
      },
      deps,
    ),
  );
}

function renderNodes() {
  const document = createPopulatedDocument();
  const store = createEditorStore({ document });
  render(
    <EditorStoreProvider store={store}>
      <div style={{ width: 800, height: 600 }}>
        <DiagramCanvas />
      </div>
    </EditorStoreProvider>,
  );
  return { document, store };
}

function elementByKind(
  document: DiagramDocument,
  kind: DiagramDocument["elements"][number]["kind"],
) {
  const element = document.elements.find(
    (candidate) => candidate.kind === kind,
  );
  if (element === undefined) {
    throw new Error(`Falta ${kind}`);
  }
  return element;
}

describe("nodos UML", () => {
  it("renderiza Actor, Caso de uso y System Boundary con ARIA y handles", () => {
    const { document } = renderNodes();
    const actor = elementByKind(document, "actor");
    const useCase = elementByKind(document, "use-case");
    const boundary = elementByKind(document, "system-boundary");

    expect(screen.getByLabelText(`Actor ${actor.name}`)).toBeInTheDocument();
    expect(
      screen.getByLabelText(`Caso de uso ${useCase.name}`),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(`Límite del sistema ${boundary.name}`),
    ).toBeInTheDocument();

    const actorNode = screen.getByTestId(`diagram-node-${actor.id}`);
    expect(actorNode).toHaveAttribute("data-kind", "actor");
    expect(screen.getByTestId("actor-figure")).toBeInTheDocument();
    expect(within(actorNode).getByText("Usuario")).toBeInTheDocument();
    expect(actorNode.querySelectorAll(".react-flow__handle")).toHaveLength(8);

    const useCaseNode = screen.getByTestId(`diagram-node-${useCase.id}`);
    expect(useCaseNode).toHaveAttribute("data-kind", "use-case");
    expect(useCaseNode).toHaveAttribute("data-parented", "true");
    expect(screen.getByTestId("use-case-ellipse")).toBeInTheDocument();
    expect(within(useCaseNode).getByText("Login")).toBeInTheDocument();
    expect(useCaseNode.querySelectorAll(".react-flow__handle")).toHaveLength(8);

    const boundaryNode = screen.getByTestId(`diagram-node-${boundary.id}`);
    expect(boundaryNode).toHaveAttribute("data-kind", "system-boundary");
    expect(screen.getByTestId("system-boundary-rect")).toBeInTheDocument();
    expect(within(boundaryNode).getByText("Sistema")).toBeInTheDocument();
    expect(boundaryNode.querySelectorAll(".react-flow__handle")).toHaveLength(
      8,
    );
    expect(
      globalThis.document.querySelector(".react-flow__resize-control"),
    ).toBeInTheDocument();
  });
});
