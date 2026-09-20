import { describe, expect, it } from "vitest";
import {
  elementAccessibleName,
  elementTypeLabel,
  relationshipAccessibleName,
  relationshipTypeLabel,
} from "./labels.ts";

describe("accessible labels", () => {
  it("nombra el tipo, el nombre y el estado de selección", () => {
    expect(elementTypeLabel("actor")).toBe("Actor");
    expect(elementTypeLabel("use-case")).toBe("Caso de uso");
    expect(elementTypeLabel("system-boundary")).toBe("Límite del sistema");
    expect(elementTypeLabel("lifeline")).toBe("Lifeline");
    expect(elementTypeLabel("class")).toBe("Clase");
    expect(elementTypeLabel("component")).toBe("Componente");
    expect(elementTypeLabel("node")).toBe("Nodo");
    expect(elementTypeLabel("artifact")).toBe("Artefacto");
    expect(elementTypeLabel("entity")).toBe("Entidad");
    expect(elementTypeLabel("attribute")).toBe("Atributo");
    expect(elementTypeLabel("er-relationship")).toBe("Relación");
    expect(elementAccessibleName({ kind: "actor", name: "Usuario" })).toBe(
      "Actor Usuario",
    );
    expect(
      elementAccessibleName({ kind: "actor", name: "Usuario" }, true),
    ).toBe("Actor Usuario, seleccionado");
  });

  it("nombra relaciones con extremos y selección", () => {
    expect(relationshipTypeLabel("association")).toBe("Asociación");
    expect(relationshipTypeLabel("include")).toBe("Include");
    expect(relationshipTypeLabel("extend")).toBe("Extend");
    expect(relationshipTypeLabel("sync-message")).toBe("Mensaje síncrono");
    expect(relationshipTypeLabel("reply-message")).toBe("Reply");
    expect(relationshipTypeLabel("class-association")).toBe("Asociación");
    expect(relationshipTypeLabel("aggregation")).toBe("Agregación");
    expect(relationshipTypeLabel("composition")).toBe("Composición");
    expect(relationshipTypeLabel("generalization")).toBe("Generalización");
    expect(relationshipTypeLabel("component-usage")).toBe("Uso");
    expect(relationshipTypeLabel("assembly-connector")).toBe("Ensamblaje");
    expect(relationshipTypeLabel("communication-path")).toBe(
      "Camino de comunicación",
    );
    expect(relationshipTypeLabel("deploy")).toBe("Deploy");
    expect(relationshipTypeLabel("er-link")).toBe("Enlace");
    expect(relationshipAccessibleName("association", "Usuario", "Login")).toBe(
      "Asociación entre Usuario y Login",
    );
    expect(relationshipAccessibleName("include", "Login", "Logout", true)).toBe(
      "Include entre Login y Logout, seleccionada",
    );
  });
});
