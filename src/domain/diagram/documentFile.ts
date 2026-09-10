import { z } from "zod";
import type { DiagramDocument, Result, Viewport } from "./model.ts";
import { diagramDocumentSchema, viewportSchema } from "./schema.ts";

export const DOCUMENT_FILE_FORMAT = "arkuml-usecase-json" as const;
export const DOCUMENT_FILE_FORMAT_VERSION = 1 as const;
export const INVALID_DOCUMENT_FILE_MESSAGE =
  "El archivo no es un documento ArkUML válido.";

const ILLEGAL_FILENAME_CHARS = new Set([
  "<",
  ">",
  ":",
  '"',
  "/",
  "\\",
  "|",
  "?",
  "*",
]);

export type ArkUmlDocumentFile = {
  format: typeof DOCUMENT_FILE_FORMAT;
  formatVersion: typeof DOCUMENT_FILE_FORMAT_VERSION;
  document: DiagramDocument;
  view: Viewport;
};

export const arkUmlDocumentFileSchema: z.ZodType<ArkUmlDocumentFile> =
  z.strictObject({
    format: z.literal(DOCUMENT_FILE_FORMAT),
    formatVersion: z.literal(DOCUMENT_FILE_FORMAT_VERSION),
    document: diagramDocumentSchema,
    view: viewportSchema,
  });

export function toDocumentFile(
  document: DiagramDocument,
  view: Viewport,
): ArkUmlDocumentFile {
  return {
    format: DOCUMENT_FILE_FORMAT,
    formatVersion: DOCUMENT_FILE_FORMAT_VERSION,
    document,
    view: { x: view.x, y: view.y, zoom: view.zoom },
  };
}

export function serializeDocumentFile(
  document: DiagramDocument,
  view: Viewport,
): string {
  return JSON.stringify(toDocumentFile(document, view));
}

export function parseDocumentFileText(
  text: string,
): Result<ArkUmlDocumentFile> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return invalidDocumentFile();
  }
  return parseDocumentFile(parsed);
}

export function parseDocumentFile(input: unknown): Result<ArkUmlDocumentFile> {
  const result = arkUmlDocumentFileSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return invalidDocumentFile();
}

export function documentFileFilename(title: string): string {
  return `${sanitizeDocumentFileBasename(title)}.arkuml.json`;
}

function sanitizeDocumentFileBasename(title: string): string {
  const cleaned = [...title]
    .map((char) => (isIllegalFilenameChar(char) ? " " : char))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/, "");
  return cleaned.length === 0 ? "diagrama" : cleaned;
}

function isIllegalFilenameChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code < 32 || ILLEGAL_FILENAME_CHARS.has(char);
}

function invalidDocumentFile(): Result<ArkUmlDocumentFile> {
  return {
    ok: false,
    error: {
      code: "UNKNOWN_KIND",
      message: INVALID_DOCUMENT_FILE_MESSAGE,
    },
  };
}
