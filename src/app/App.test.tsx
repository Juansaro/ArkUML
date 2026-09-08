import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App.tsx";

describe("App", () => {
  it("renderiza el heading ArkUML", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "ArkUML" })).toBeInTheDocument();
  });
});
