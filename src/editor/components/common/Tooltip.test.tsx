import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Tooltip,
  TooltipProvider,
  TOOLTIP_HIDE_DELAY_MS,
  TOOLTIP_SHOW_DELAY_MS,
  positionTooltip,
} from "./Tooltip.tsx";

function renderTooltip(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("positionTooltip", () => {
  const tooltip = { width: 120, height: 32 };
  const viewport = { width: 1024, height: 720 };

  it("coloca abajo cuando cabe", () => {
    const next = positionTooltip(
      { top: 8, left: 40, width: 32, height: 32 },
      tooltip,
      "bottom",
      viewport,
    );
    expect(next.placement).toBe("bottom");
    expect(next.top).toBe(48);
  });

  it("invierte al lado opuesto si desborda y clampa al viewport", () => {
    const flipped = positionTooltip(
      { top: 700, left: 400, width: 32, height: 32 },
      tooltip,
      "bottom",
      { width: 1024, height: 720 },
    );
    expect(flipped.placement).toBe("top");

    const clamped = positionTooltip(
      { top: 8, left: 8, width: 32, height: 32 },
      { width: 400, height: 80 },
      "left",
      { width: 768, height: 720 },
    );
    expect(clamped.left).toBeGreaterThanOrEqual(8);
    expect(clamped.top).toBeGreaterThanOrEqual(8);
    expect(clamped.left + 400).toBeLessThanOrEqual(760);
  });
});

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("abre a los 400 ms de hover, no a 399", () => {
    renderTooltip(
      <Tooltip content="Crear un diagrama nuevo." placement="bottom">
        {(bind) => (
          <button type="button" {...bind}>
            Nuevo
          </button>
        )}
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Nuevo" }));
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY_MS - 1);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Crear un diagrama nuevo.",
    );
    expect(screen.getByRole("button", { name: "Nuevo" })).toHaveAttribute(
      "aria-describedby",
      screen.getByTestId("editor-tooltip").id,
    );
  });

  it("abre al instante con foco y cancela un hover pendiente", () => {
    renderTooltip(
      <Tooltip content="Ver ayuda y atajos." placement="bottom">
        {(bind) => (
          <button type="button" {...bind}>
            Ayuda
          </button>
        )}
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Ayuda" });
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      trigger.focus();
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Ver ayuda y atajos.",
    );
  });

  it("espera 100 ms al salir y permanece si el puntero entra en el tooltip", () => {
    renderTooltip(
      <Tooltip content="Crear actor." placement="right">
        {(bind) => (
          <button type="button" {...bind}>
            Actor
          </button>
        )}
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Actor" });
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY_MS);
    });
    const tooltip = screen.getByTestId("editor-tooltip");
    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_HIDE_DELAY_MS);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(tooltip);
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_HIDE_DELAY_MS - 1);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("Escape cierra sin mover el foco y no deja el nodo", () => {
    renderTooltip(
      <Tooltip content="Crear un diagrama nuevo." placement="bottom">
        {(bind) => (
          <button type="button" {...bind}>
            Nuevo
          </button>
        )}
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Nuevo" });
    act(() => {
      trigger.focus();
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    act(() => {
      trigger.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("solo un tooltip visible y limpia el portal al desmontar", () => {
    const { unmount } = renderTooltip(
      <>
        <Tooltip content="Primero." placement="bottom">
          {(bind) => (
            <button type="button" {...bind}>
              Uno
            </button>
          )}
        </Tooltip>
        <Tooltip content="Segundo." placement="bottom">
          {(bind) => (
            <button type="button" {...bind}>
              Dos
            </button>
          )}
        </Tooltip>
      </>,
    );
    act(() => {
      screen.getByRole("button", { name: "Uno" }).focus();
    });
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Primero.");
    act(() => {
      screen.getByRole("button", { name: "Dos" }).focus();
    });
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Segundo.");
    unmount();
    expect(screen.queryByTestId("editor-tooltip")).not.toBeInTheDocument();
  });
});
