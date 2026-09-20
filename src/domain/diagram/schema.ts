import { z } from "zod";
import {
  DOCUMENT_KIND,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  SCHEMA_VERSION,
  SCHEMA_VERSION_V1,
  SCHEMA_VERSION_V2,
  STORAGE_VERSION,
  STORAGE_VERSION_V1,
} from "./defaults.ts";
import {
  ASSOCIATION_MULTIPLICITIES,
  type DiagramDocument,
  type DiagramDocumentV1,
  type DiagramDocumentV2,
  type DomainError,
  type DomainErrorCode,
  type Result,
  type WorkspaceSnapshot,
  type WorkspaceSnapshotV1,
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

const messageNameSchema = z
  .string({ error: "El nombre debe ser texto." })
  .refine((value) => value.trim().length <= NAME_MAX_LENGTH, {
    error: "El nombre debe tener como máximo 80 caracteres.",
  });

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

const lifelineSchema = z.strictObject({
  id: uuidSchema,
  kind: z.literal("lifeline"),
  name: nameSchema,
  geometry: geometrySchema,
  stemLength: finiteNumberSchema,
});

const classMemberSchema = z
  .string({ error: "El miembro debe ser texto." })
  .refine((value) => value.trim().length <= NAME_MAX_LENGTH, {
    error: "El miembro debe tener como máximo 80 caracteres.",
  });

const umlClassSchema = z.strictObject({
  id: uuidSchema,
  kind: z.literal("class"),
  name: nameSchema,
  geometry: geometrySchema,
  attributes: z.array(classMemberSchema),
  operations: z.array(classMemberSchema),
});

const umlComponentSchema = z.strictObject({
  id: uuidSchema,
  kind: z.literal("component"),
  name: nameSchema,
  geometry: geometrySchema,
});

const useCaseElementSchema = z.discriminatedUnion(
  "kind",
  [actorSchema, useCaseSchema, systemBoundarySchema],
  { error: "Tipo de elemento no soportado." },
);

const diagramElementSchemaV2 = z.discriminatedUnion(
  "kind",
  [actorSchema, useCaseSchema, systemBoundarySchema, lifelineSchema],
  { error: "Tipo de elemento no soportado." },
);

const diagramElementSchema = z.discriminatedUnion(
  "kind",
  [
    actorSchema,
    useCaseSchema,
    systemBoundarySchema,
    lifelineSchema,
    umlClassSchema,
    umlComponentSchema,
  ],
  { error: "Tipo de elemento no soportado." },
);

const useCaseRelationshipSchema = z.strictObject({
  id: uuidSchema,
  kind: z.enum(["association", "include", "extend"], {
    error: "Tipo de relación no soportado.",
  }),
  sourceId: uuidSchema,
  targetId: uuidSchema,
  sourceAnchor: anchorSchema,
  targetAnchor: anchorSchema,
});

const sequenceMessageSchema = z.strictObject({
  id: uuidSchema,
  kind: z.enum(["sync-message", "reply-message"], {
    error: "Tipo de relación no soportado.",
  }),
  sourceId: uuidSchema,
  targetId: uuidSchema,
  name: messageNameSchema,
  y: finiteNumberSchema,
});

const multiplicitySchema = z.enum(ASSOCIATION_MULTIPLICITIES, {
  error: "La multiplicidad no es un valor soportado.",
});

const classAssociationSchema = z.strictObject({
  id: uuidSchema,
  kind: z.enum(["class-association", "aggregation", "composition"], {
    error: "Tipo de relación no soportado.",
  }),
  sourceId: uuidSchema,
  targetId: uuidSchema,
  name: messageNameSchema,
  sourceMultiplicity: multiplicitySchema,
  targetMultiplicity: multiplicitySchema,
});

const generalizationSchema = z.strictObject({
  id: uuidSchema,
  kind: z.literal("generalization"),
  sourceId: uuidSchema,
  targetId: uuidSchema,
  name: messageNameSchema,
});

const componentRelationshipSchema = z.strictObject({
  id: uuidSchema,
  kind: z.enum(["component-usage", "assembly-connector"], {
    error: "Tipo de relación no soportado.",
  }),
  sourceId: uuidSchema,
  targetId: uuidSchema,
  name: messageNameSchema,
});

const relationshipSchemaV2 = z.union([
  useCaseRelationshipSchema,
  sequenceMessageSchema,
]);

const relationshipSchema = z.union([
  useCaseRelationshipSchema,
  sequenceMessageSchema,
  classAssociationSchema,
  generalizationSchema,
  componentRelationshipSchema,
]);

const metadataSchema = z.strictObject({
  title: nameSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

const USE_CASE_ELEMENT_KINDS = new Set([
  "actor",
  "use-case",
  "system-boundary",
]);
const SEQUENCE_ELEMENT_KINDS = new Set(["lifeline"]);
const CLASS_ELEMENT_KINDS = new Set(["class"]);
const COMPONENT_ELEMENT_KINDS = new Set(["component"]);
const USE_CASE_RELATIONSHIP_KINDS = new Set([
  "association",
  "include",
  "extend",
]);
const SEQUENCE_RELATIONSHIP_KINDS = new Set(["sync-message", "reply-message"]);
const CLASS_RELATIONSHIP_KINDS = new Set([
  "class-association",
  "aggregation",
  "composition",
  "generalization",
]);
const COMPONENT_RELATIONSHIP_KINDS = new Set([
  "component-usage",
  "assembly-connector",
]);

type KindCardinalityDocument = {
  kind: "use-case" | "sequence" | "class" | "component";
  elements: readonly { kind: string }[];
  relationships: readonly { kind: string }[];
};

function addParentIssues(
  document: DiagramDocument | DiagramDocumentV2 | DiagramDocumentV1,
  ctx: z.core.$RefinementCtx<
    DiagramDocument | DiagramDocumentV2 | DiagramDocumentV1
  >,
): void {
  if (document.kind !== "use-case") {
    return;
  }

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
  document: DiagramDocument | DiagramDocumentV2 | DiagramDocumentV1,
  ctx: z.core.$RefinementCtx<
    DiagramDocument | DiagramDocumentV2 | DiagramDocumentV1
  >,
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

function addKindCardinalityIssues(
  document: KindCardinalityDocument,
  ctx: z.core.$RefinementCtx<KindCardinalityDocument>,
): void {
  const allowedElements =
    document.kind === "sequence"
      ? SEQUENCE_ELEMENT_KINDS
      : document.kind === "class"
        ? CLASS_ELEMENT_KINDS
        : document.kind === "component"
          ? COMPONENT_ELEMENT_KINDS
          : USE_CASE_ELEMENT_KINDS;
  const allowedRelationships =
    document.kind === "sequence"
      ? SEQUENCE_RELATIONSHIP_KINDS
      : document.kind === "class"
        ? CLASS_RELATIONSHIP_KINDS
        : document.kind === "component"
          ? COMPONENT_RELATIONSHIP_KINDS
          : USE_CASE_RELATIONSHIP_KINDS;

  document.elements.forEach((element, index) => {
    if (allowedElements.has(element.kind)) {
      return;
    }
    ctx.addIssue({
      code: "custom",
      message: "Tipo de elemento no soportado en este documento.",
      path: ["elements", index, "kind"],
    });
  });

  document.relationships.forEach((relationship, index) => {
    if (allowedRelationships.has(relationship.kind)) {
      return;
    }
    ctx.addIssue({
      code: "custom",
      message: "Tipo de relación no soportado en este documento.",
      path: ["relationships", index, "kind"],
    });
  });
}

export const diagramDocumentV1Schema: z.ZodType<DiagramDocumentV1> = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION_V1, {
      error: "schemaVersion debe ser 1.",
    }),
    id: uuidSchema,
    kind: z.literal(DOCUMENT_KIND, {
      error: "kind de documento no soportado.",
    }),
    metadata: metadataSchema,
    elements: z.array(useCaseElementSchema),
    relationships: z.array(useCaseRelationshipSchema),
  })
  .superRefine((document, ctx) => {
    addUniqueIdIssues(document, ctx);
    addParentIssues(document, ctx);
  });

export const diagramDocumentV2Schema: z.ZodType<DiagramDocumentV2> = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION_V2, {
      error: "schemaVersion debe ser 2.",
    }),
    id: uuidSchema,
    kind: z.enum(["use-case", "sequence"], {
      error: "kind de documento no soportado.",
    }),
    metadata: metadataSchema,
    elements: z.array(diagramElementSchemaV2),
    relationships: z.array(relationshipSchemaV2),
  })
  .superRefine((document, ctx) => {
    addUniqueIdIssues(document, ctx);
    addParentIssues(document, ctx);
    addKindCardinalityIssues(document, ctx);
  });

export const diagramDocumentSchema: z.ZodType<DiagramDocument> = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION, {
      error: "schemaVersion debe ser 3.",
    }),
    id: uuidSchema,
    kind: z.enum(["use-case", "sequence", "class", "component"], {
      error: "kind de documento no soportado.",
    }),
    metadata: metadataSchema,
    elements: z.array(diagramElementSchema),
    relationships: z.array(relationshipSchema),
  })
  .superRefine((document, ctx) => {
    addUniqueIdIssues(document, ctx);
    addParentIssues(document, ctx);
    addKindCardinalityIssues(document, ctx);
  });

export const viewportSchema = z.strictObject({
  x: finiteNumberSchema,
  y: finiteNumberSchema,
  zoom: finiteNumberSchema,
});

export const workspaceDocumentEntrySchema = z.strictObject({
  document: diagramDocumentSchema,
  view: viewportSchema,
});

export const workspaceSnapshotV1Schema: z.ZodType<WorkspaceSnapshotV1> =
  z.strictObject({
    storageVersion: z.literal(STORAGE_VERSION_V1, {
      error: "storageVersion debe ser 1.",
    }),
    document: z.union([
      diagramDocumentSchema,
      diagramDocumentV2Schema,
      diagramDocumentV1Schema,
    ]),
    view: viewportSchema,
  });

export const workspaceSnapshotSchema: z.ZodType<WorkspaceSnapshot> = z
  .strictObject({
    storageVersion: z.literal(STORAGE_VERSION, {
      error: "storageVersion debe ser 2.",
    }),
    activeDocumentId: uuidSchema,
    documents: z.array(workspaceDocumentEntrySchema),
  })
  .superRefine((snapshot, ctx) => {
    if (snapshot.documents.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "La biblioteca no puede estar vacía.",
        path: ["documents"],
      });
      return;
    }

    const seen = new Set<string>();
    snapshot.documents.forEach((entry, index) => {
      if (seen.has(entry.document.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Los identificadores de documento deben ser únicos.",
          path: ["documents", index, "document", "id"],
        });
        return;
      }
      seen.add(entry.document.id);
    });

    if (!seen.has(snapshot.activeDocumentId)) {
      ctx.addIssue({
        code: "custom",
        message: "activeDocumentId debe coincidir con un documento.",
        path: ["activeDocumentId"],
      });
    }
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

  if (
    path.includes("geometry") ||
    path.includes("stemLength") ||
    path.includes("view")
  ) {
    return "INVALID_GEOMETRY";
  }

  if (path.includes("y") && path[0] === "relationships") {
    return "INVALID_GEOMETRY";
  }

  if (issue.code === "invalid_type" && issue.expected === "number") {
    return "INVALID_GEOMETRY";
  }

  if (
    path.includes("name") ||
    path.includes("title") ||
    path.includes("attributes") ||
    path.includes("operations")
  ) {
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

export function parseDiagramDocumentV1(
  input: unknown,
): Result<DiagramDocumentV1> {
  const result = diagramDocumentV1Schema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, error: toDomainError(result.error) };
}

export function parseDiagramDocumentV2(
  input: unknown,
): Result<DiagramDocumentV2> {
  const result = diagramDocumentV2Schema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, error: toDomainError(result.error) };
}

export function parseDiagramDocument(input: unknown): Result<DiagramDocument> {
  const result = diagramDocumentSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, error: toDomainError(result.error) };
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

export function parseWorkspaceSnapshotV1(
  input: unknown,
): Result<WorkspaceSnapshotV1> {
  const result = workspaceSnapshotV1Schema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }

  return { ok: false, error: toDomainError(result.error) };
}
