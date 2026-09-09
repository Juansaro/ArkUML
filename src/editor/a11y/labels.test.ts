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
    expect(relationshipAccessibleName("association", "Usuario", "Login")).toBe(
      "Asociación entre Usuario y Login",
    );
    expect(relationshipAccessibleName("include", "Login", "Logout", true)).toBe(
      "Include entre Login y Logout, seleccionada",
    );
  });
});
