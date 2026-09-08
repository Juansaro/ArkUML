import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/editorStore.ts";
import { EditorStoreProvider } from "../../store/EditorStoreProvider.tsx";
import { SaveStatus } from "./SaveStatus.tsx";

describe("SaveStatus", () => {
  it("muestra Guardando, Guardado y Error sin toast de éxito", () => {
    const store = createEditorStore();
    render(
      <EditorStoreProvider store={store}>
        <SaveStatus />
      </EditorStoreProvider>,
    );

    const status = screen.getByTestId("save-status");
    expect(status).toHaveTextContent("—");
    expect(status).toHaveAttribute("data-state", "idle");

    act(() => {
      store.getState().setSaveStatus("saving");
    });
    expect(status).toHaveTextContent("Guardando");

    act(() => {
      store.getState().setSaveStatus("saved", "2026-09-07T15:00:00.000Z");
      store.getState().setMessage(undefined);
    });
    expect(status).toHaveTextContent("Guardado");
    expect(status).not.toHaveTextContent("Diagrama guardado");

    act(() => {
      store.getState().setSaveStatus("error");
      store
        .getState()
        .setMessage("No hay espacio suficiente para guardar el diagrama.");
    });
    expect(status).toHaveTextContent("Error");
    expect(status).toHaveTextContent(/espacio suficiente/i);
    expect(
      screen.queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument();
  });
});
