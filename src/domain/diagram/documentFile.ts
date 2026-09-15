import { z } from "zod";
import type {
  DiagramDocument,
  DiagramDocumentV1,
  DiagramDocumentV2,
  Result,
  Viewport,
} from "./model.ts";
import { migrateDocument } from "./migrate.ts";
import {
  diagramDocumentSchema,
  diagramDocumentV1Schema,
  diagramDocumentV2Schema,
  viewportSchema,
} from "./schema.ts";

export const DOCUMENT_FILE_FORMAT_V1 = "arkuml-usecase-json" as const;
export const DOCUMENT_FILE_FORMAT_VERSION_V1 = 1 as const;
export const DOCUMENT_FILE_FORMAT = "arkuml-document-json" as const;
export const DOCUMENT_FILE_FORMAT_VERSION_V2 = 2 as const;
export const DOCUMENT_FILE_FORMAT_VERSION = 3 as const;
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

export type ArkUmlDocumentFileV1 = {
  format: typeof DOCUMENT_FILE_FORMAT_V1;
  formatVersion: typeof DOCUMENT_FILE_FORMAT_VERSION_V1;
  document: DiagramDocumentV1;
  view: Viewport;
};

export type ArkUmlDocumentFileV2 = {
  format: typeof DOCUMENT_FILE_FORMAT;
  formatVersion: typeof DOCUMENT_FILE_FORMAT_VERSION_V2;
  document: DiagramDocumentV2;
  view: Viewport;
};

export type ArkUmlDocumentFile = {
  format: typeof DOCUMENT_FILE_FORMAT;
  formatVersion: typeof DOCUMENT_FILE_FORMAT_VERSION;
  document: DiagramDocument;
  view: Viewport;
};

export const arkUmlDocumentFileV1Schema: z.ZodType<ArkUmlDocumentFileV1> =
  z.strictObject({
    format: z.literal(DOCUMENT_FILE_FORMAT_V1),
    formatVersion: z.literal(DOCUMENT_FILE_FORMAT_VERSION_V1),
    document: diagramDocumentV1Schema,
    view: viewportSchema,
  });

export const arkUmlDocumentFileV2Schema: z.ZodType<ArkUmlDocumentFileV2> =
  z.strictObject({
    format: z.literal(DOCUMENT_FILE_FORMAT),
    formatVersion: z.literal(DOCUMENT_FILE_FORMAT_VERSION_V2),
    document: diagramDocumentV2Schema,
    view: viewportSchema,
  });

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
  const v3 = arkUmlDocumentFileSchema.safeParse(input);
  if (v3.success) {
    return { ok: true, value: v3.data };
  }

  const v2 = arkUmlDocumentFileV2Schema.safeParse(input);
  if (v2.success) {
    return migrateImportedDocument(v2.data.document, v2.data.view);
  }

  const v1 = arkUmlDocumentFileV1Schema.safeParse(input);
  if (v1.success) {
    return migrateImportedDocument(v1.data.document, v1.data.view);
  }

  return invalidDocumentFile();
}

export function documentFileFilename(title: string): string {
  return `${sanitizeDocumentFileBasename(title)}.arkuml.json`;
}

function migrateImportedDocument(
  document: DiagramDocumentV1 | DiagramDocumentV2,
  view: Viewport,
): Result<ArkUmlDocumentFile> {
  const migrated = migrateDocument(document);
  if (!migrated.ok) {
    return invalidDocumentFile();
  }
  return {
    ok: true,
    value: toDocumentFile(migrated.value, view),
  };
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
