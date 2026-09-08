import { z } from "zod";
import {
  DOCUMENT_KIND,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  SCHEMA_VERSION,
  STORAGE_VERSION,
} from "./defaults.ts";
import type {
  DiagramDocument,
  DomainError,
  DomainErrorCode,
  Result,
  WorkspaceSnapshot,
} from "./model.ts";

const uuidSchema = z.uuidv4({
  error: "Debe ser un UUID v4.",
});

const isoTimestampSchema = z.iso.datetime({
  offset: true,
  error: "Debe ser una fecha ISO-8601.",
});

const finiteNumberSchema = z.number({
  error: "Debe ser un número finito.",
});

const nameSchema = z.string({ error: "El nombre debe ser texto." }).refine(
  (value) => {
    const length = value.trim().length;
    return length >= NAME_MIN_LENGTH && length <= NAME_MAX_LENGTH;
  },
  { error: "El nombre debe tener entre 1 y 80 caracteres." },
);

const geometrySchema = z.strictObject({
  x: finiteNumberSchema,
  y: finiteNumberSchema,
  width: finiteNumberSchema,
  height: finiteNumberSchema,
});

const anchorSchema = z.enum(["top", "right", "bottom", "left"], {
  error: "El ancla debe ser top, right, bottom o left.",
});

const actorSchema = z.strictObject({
  id: uuidSchema,
  kind: z.literal("actor"),
  name: nameSchema,
  geometry: geometrySchema,
});

const useCaseSchema = z.strictObject({
  id: uuidSchema,
  kind: z.literal("use-case"),
  name: nameSchema,
  geometry: geometrySchema,
  parentId: uuidSchema.exactOptional(),
});

const systemBoundarySchema = z.strictObject({
  id: uuidSchema,
  kind: z.literal("system-boundary"),
  name: nameSchema,
  geometry: geometrySchema,
});

const diagramElementSchema = z.discriminatedUnion(
  "kind",
  [actorSchema, useCaseSchema, systemBoundarySchema],
  { error: "Tipo de elemento no soportado." },
);

const relationshipSchema = z.strictObject({
  id: uuidSchema,
  kind: z.enum(["association", "include", "extend"], {
    error: "Tipo de relación no soportado.",
  }),
  sourceId: uuidSchema,
  targetId: uuidSchema,
  sourceAnchor: anchorSchema,
  targetAnchor: anchorSchema,
});

const metadataSchema = z.strictObject({
  title: nameSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

function addParentIssues(
  document: DiagramDocument,
  ctx: z.core.$RefinementCtx<DiagramDocument>,
): void {
  const elementsById = new Map(
    document.elements.map((element) => [element.id, element]),
  );

  document.elements.forEach((element, index) => {
    if (element.kind !== "use-case" || element.parentId === undefined) {
      return;
    }

    const parent = elementsById.get(element.parentId);
    if (parent === undefined || parent.kind !== "system-boundary") {
      ctx.addIssue({
        code: "custom",
        message: "parentId debe referir a un SystemBoundary del documento.",
        path: ["elements", index, "parentId"],
      });
    }
  });
}

function addUniqueIdIssues(
  document: DiagramDocument,
  ctx: z.core.$RefinementCtx<DiagramDocument>,
): void {
  const seen = new Set<string>();

  document.elements.forEach((element, index) => {
    if (seen.has(element.id)) {
      ctx.addIssue({
        code: "custom",
        message: "Los identificadores deben ser únicos.",
        path: ["elements", index, "id"],
      });
      return;
    }
    seen.add(element.id);
  });

  document.relationships.forEach((relationship, index) => {
    if (seen.has(relationship.id)) {
      ctx.addIssue({
        code: "custom",
        message: "Los identificadores deben ser únicos.",
        path: ["relationships", index, "id"],
      });
      return;
    }
    seen.add(relationship.id);
  });
}

export const diagramDocumentSchema: z.ZodType<DiagramDocument> = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION, {
      error: "schemaVersion debe ser 1.",
    }),
    id: uuidSchema,
    kind: z.literal(DOCUMENT_KIND, {
      error: "kind de documento no soportado.",
    }),
    metadata: metadataSchema,
    elements: z.array(diagramElementSchema),
    relationships: z.array(relationshipSchema),
  })
  .superRefine((document, ctx) => {
    addUniqueIdIssues(document, ctx);
    addParentIssues(document, ctx);
  });

const viewportSchema = z.strictObject({
  x: finiteNumberSchema,
  y: finiteNumberSchema,
  zoom: finiteNumberSchema,
});

export const workspaceSnapshotSchema: z.ZodType<WorkspaceSnapshot> =
  z.strictObject({
    storageVersion: z.literal(STORAGE_VERSION, {
      error: "storageVersion debe ser 1.",
    }),
    document: diagramDocumentSchema,
    view: viewportSchema,
  });

function pathOf(issue: z.core.$ZodIssue): string {
  return issue.path.map(String).join(".");
}

function formatIssue(issue: z.core.$ZodIssue): string {
  const path = pathOf(issue);
  const where = path.length > 0 ? path : "documento";

  if (issue.code === "unrecognized_keys") {
    return `Claves no permitidas en ${where}: ${issue.keys.join(", ")}.`;
  }

  if (issue.code === "invalid_format") {
    if (issue.format === "uuid" || issue.format === "uuidv4") {
      return `Identificador UUID inválido en ${where}.`;
    }
    if (issue.format === "datetime") {
      return `Fecha ISO-8601 inválida en ${where}.`;
    }
  }

  if (issue.code === "invalid_type" && issue.expected === "number") {
    return `Número no finito en ${where}.`;
  }

  if (issue.code === "invalid_value" || issue.code === "invalid_union") {
    return `Valor no soportado en ${where}.`;
  }

  if (path.length > 0) {
    return `${issue.message} (${where})`;
  }

  return issue.message;
}

function domainCodeForIssue(issue: z.core.$ZodIssue): DomainErrorCode {
  const path = issue.path.map(String);

  if (issue.code === "unrecognized_keys") {
    return "UNKNOWN_KIND";
  }

  if (path.includes("parentId")) {
    return "INVALID_PARENT";
  }

  if (path.includes("geometry") || path[0] === "view") {
    return "INVALID_GEOMETRY";
  }

  if (issue.code === "invalid_type" && issue.expected === "number") {
    return "INVALID_GEOMETRY";
  }

  if (path.includes("name") || path.includes("title")) {
    return "INVALID_NAME";
  }

  if (path.includes("kind") || issue.code === "invalid_union") {
    return "UNKNOWN_KIND";
  }

  if (issue.code === "invalid_format") {
    return "UNKNOWN_ELEMENT";
  }

  return "UNKNOWN_KIND";
}

function toDomainError(error: z.core.$ZodError): DomainError {
  const issue = error.issues[0];
  if (issue === undefined) {
    return {
      code: "UNKNOWN_KIND",
      message: "El documento no es un snapshot válido.",
    };
  }

  return {
    code: domainCodeForIssue(issue),
    message: error.issues.map(formatIssue).join(" "),
  };
}

export function parseWorkspaceSnapshot(
  input: unknown,
): Result<WorkspaceSnapshot> {
  const result = workspaceSnapshotSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }

  return { ok: false, error: toDomainError(result.error) };
}
