import type { DocumentKind } from "../../../domain/diagram/model.ts";

export type LibraryDocument = {
  id: string;
  title: string;
  kind: DocumentKind;
};

export function documentKindLabel(kind: DocumentKind): string {
  if (kind === "sequence") {
    return "Secuencia";
  }
  if (kind === "class") {
    return "Clases";
  }
  if (kind === "component") {
    return "Componentes";
  }
  if (kind === "deployment") {
    return "Despliegue";
  }
  return "Casos de uso";
}

export function documentKindTagline(kind: DocumentKind): string {
  if (kind === "sequence") {
    return "Editor de diagramas de secuencia";
  }
  if (kind === "class") {
    return "Editor de diagramas de clases";
  }
  if (kind === "component") {
    return "Editor de diagramas de componentes";
  }
  if (kind === "deployment") {
    return "Editor de diagramas de despliegue";
  }
  return "Editor de diagramas de casos de uso";
}

export const CREATABLE_DOCUMENT_KINDS = [
  { value: "use-case", label: "Casos de uso" },
  { value: "sequence", label: "Secuencia" },
  { value: "class", label: "Clases" },
  { value: "component", label: "Componentes" },
] as const satisfies readonly { value: DocumentKind; label: string }[];

export function filterLibraryDocuments(
  documents: readonly LibraryDocument[],
  query: string,
): LibraryDocument[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...documents];
  }
  return documents.filter((item) => item.title.toLowerCase().includes(needle));
}

export const LAST_DOCUMENT_DELETE_REASON =
  "El workspace debe conservar al menos un diagrama.";
