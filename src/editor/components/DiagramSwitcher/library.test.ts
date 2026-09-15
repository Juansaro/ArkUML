import { describe, expect, it } from "vitest";
import {
  documentKindLabel,
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
