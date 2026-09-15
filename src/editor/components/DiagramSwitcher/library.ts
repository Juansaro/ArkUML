import type { DocumentKind } from "../../../domain/diagram/model.ts";

export type LibraryDocument = {
  id: string;
  title: string;
  kind: DocumentKind;
};

export function documentKindLabel(kind: DocumentKind): string {
  return kind === "sequence" ? "Secuencia" : "Casos de uso";
}

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
