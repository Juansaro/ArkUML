import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon.tsx";
import { ICON_NAMES } from "./icons.tsx";

describe("Icon", () => {
  it("marca cada glifo como decorativo y cubre el inventario", () => {
    for (const name of ICON_NAMES) {
      const { unmount } = render(<Icon name={name} />);
      const svg = document.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      unmount();
    }
  });

  it("pinta el puntero de Selección", () => {
    render(<Icon name="select" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M6 4v16");
  });

  it("distingue Include y Extend por la letra, no solo por el trazo discontinuo", () => {
    const { rerender } = render(<Icon name="include" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M18 8v8");
    rerender(<Icon name="extend" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M17 8v8");
    expect(document.querySelector("svg")?.innerHTML).toContain("M17 8h3.5");
  });

  it("distingue Ampliar mapa de Ajustar vista por las esquinas hacia adentro", () => {
    const { rerender } = render(<Icon name="fitView" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M9 4H4v5");
    rerender(<Icon name="collapseView" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M9 4v5H4");
  });

  it("distingue Abrir y Guardar JSON por el sentido de la flecha", () => {
    const { rerender } = render(<Icon name="openFile" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M12 18v-6");
    expect(document.querySelector("svg")?.innerHTML).toContain("M9 15l3-3 3 3");
    rerender(<Icon name="saveJson" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M12 10v6");
    expect(document.querySelector("svg")?.innerHTML).toContain("M9 13l3 3 3-3");
  });

  it("distingue Borrar de Nuevo por el cubo, no por el documento con más", () => {
    const { rerender } = render(<Icon name="newDiagram" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M12 11v6");
    rerender(<Icon name="deleteDiagram" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M5 7h14");
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "M8 7l1 13h6l1-13",
    );
  });

  it("pinta los glifos de secuencia con cabeza, flecha llena y reply abierto", () => {
    const { rerender } = render(<Icon name="lifeline" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      'x="7" y="3" width="10" height="6"',
    );
    expect(document.querySelector("svg")?.innerHTML).toContain("M12 9v12");
    rerender(<Icon name="syncMessage" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      'fill="currentColor"',
    );
    rerender(<Icon name="replyMessage" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "stroke-dasharray=\"3 2\"",
    );
    expect(document.querySelector("svg")?.innerHTML).toContain("M16 8l5 4-5 4");
  });

  it("pinta los glifos de clases con compartimentos, diamante y triángulo", () => {
    const { rerender } = render(<Icon name="class" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M5 4h14v16H5z");
    expect(document.querySelector("svg")?.innerHTML).toContain("M5 9h14");
    rerender(<Icon name="classAssociation" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M3 8h5v8H3z");
    rerender(<Icon name="aggregation" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "M3 12l4-4 4 4-4 4z",
    );
    expect(document.querySelector("svg")?.innerHTML).not.toContain(
      'fill="currentColor"',
    );
    rerender(<Icon name="composition" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      'fill="currentColor"',
    );
    rerender(<Icon name="generalization" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M13 7l8 5-8 5z");
  });

  it("pinta los glifos de componentes con uso y ensamblaje", () => {
    const { rerender } = render(<Icon name="component" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M8 5h12v14H8z");
    expect(document.querySelector("svg")?.innerHTML).toContain("M4 8h5v3H4z");
    rerender(<Icon name="componentUsage" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "stroke-dasharray=\"4 3\"",
    );
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "M17 8v5a2.5 2.5 0 0 0 5 0V8",
    );
    rerender(<Icon name="assemblyConnector" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      'fill="currentColor"',
    );
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "M18 8a4 4 0 0 1 0 8",
    );
  });

  it("pinta los glifos de despliegue con camino y deploy", () => {
    const { rerender } = render(<Icon name="node" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M4 9h14v10H4z");
    expect(document.querySelector("svg")?.innerHTML).toContain("M4 9l4-4h14l-4 4");
    rerender(<Icon name="artifact" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M7 3h7l5 5v13H7z");
    rerender(<Icon name="communicationPath" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M3 9h5v8H3z");
    expect(document.querySelector("svg")?.innerHTML).toContain("M8 13h8");
    rerender(<Icon name="deploy" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "stroke-dasharray=\"4 3\"",
    );
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "M17 8h3a2 2 0 0 1 0 4h-3",
    );
  });

  it("pinta los glifos Chen de entidad-relación", () => {
    const { rerender } = render(<Icon name="entity" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M4 6h16v12H4z");
    rerender(<Icon name="attribute" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      'cx="12" cy="12" rx="9" ry="6"',
    );
    rerender(<Icon name="erRelationship" />);
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "M12 3l9 9-9 9-9-9z",
    );
    rerender(<Icon name="erLink" />);
    expect(document.querySelector("svg")?.innerHTML).toContain("M3 8h6v8H3z");
    expect(document.querySelector("svg")?.innerHTML).toContain(
      "M17 6l5 6-5 6-5-6z",
    );
  });
});
