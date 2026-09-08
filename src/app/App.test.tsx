import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WORKSPACE_STORAGE_KEY } from "../persistence/diagramRepository.ts";
import { App } from "./App.tsx";

describe("App", () => {
  afterEach(() => {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  });

  it("renderiza el heading ArkUML", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "ArkUML" }),
    ).toBeInTheDocument();
  });
});
