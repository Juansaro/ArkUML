import { describe, expect, it } from "vitest";
import {
  documentKindLabel,
  documentKindTagline,
  filterLibraryDocuments,
  type LibraryDocument,
} from "./library.ts";

const LIBRARY: readonly LibraryDocument[] = [
  { id: "a", title: "Diagrama de casos de uso", kind: "use-case" },
  { id: "b", title: "Login", kind: "use-case" },
  { id: "c", title: "Diagrama de secuencia", kind: "sequence" },
];

describe("documentKindLabel", () => {
  it("nombra los kinds persistidos", () => {
    expect(documentKindLabel("use-case")).toBe("Casos de uso");
    expect(documentKindLabel("sequence")).toBe("Secuencia");
    expect(documentKindLabel("class")).toBe("Clases");
    expect(documentKindLabel("component")).toBe("Componentes");
    expect(documentKindLabel("deployment")).toBe("Despliegue");
  });
});

describe("documentKindTagline", () => {
  it("resuelve el chrome por kind", () => {
    expect(documentKindTagline("use-case")).toBe(
      "Editor de diagramas de casos de uso",
    );
    expect(documentKindTagline("sequence")).toBe(
      "Editor de diagramas de secuencia",
    );
    expect(documentKindTagline("class")).toBe(
      "Editor de diagramas de clases",
    );
    expect(documentKindTagline("component")).toBe(
      "Editor de diagramas de componentes",
    );
    expect(documentKindTagline("deployment")).toBe(
      "Editor de diagramas de despliegue",
    );
  });
});

describe("filterLibraryDocuments", () => {
  it("recorta y no distingue mayúsculas", () => {
    expect(filterLibraryDocuments(LIBRARY, "  LOGIN ")).toEqual([LIBRARY[1]]);
    expect(filterLibraryDocuments(LIBRARY, "diagrama")).toEqual([
      LIBRARY[0],
      LIBRARY[2],
    ]);
  });

  it("vacío o solo espacios devuelve la biblioteca", () => {
    expect(filterLibraryDocuments(LIBRARY, "")).toEqual([...LIBRARY]);
    expect(filterLibraryDocuments(LIBRARY, "   ")).toEqual([...LIBRARY]);
  });

  it("sin coincidencias queda vacío", () => {
    expect(filterLibraryDocuments(LIBRARY, "zzz")).toEqual([]);
  });
});
