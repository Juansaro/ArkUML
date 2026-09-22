import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { kindResource, kindsResource } from "./resources/catalog.ts";
import {
  createSession,
  handleCreateElement,
  handleCreateRelationship,
  handleCreateDocument,
  handleDeleteElement,
  handleDeleteRelationship,
  handleDescribeRules,
  handleListElements,
  handleListKinds,
  handleLoadDocument,
  handleSaveDocument,
  handleUpdateElement,
  handleValidateDocument,
  type ToolResponse,
} from "./tools/handlers.ts";

const geometrySchema = z.object({
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  width: z.number().finite().optional(),
  height: z.number().finite().optional(),
});

const elementKindSchema = z.enum([
  "actor",
  "use-case",
  "system-boundary",
  "lifeline",
  "class",
  "component",
  "node",
  "artifact",
  "entity",
  "attribute",
  "er-relationship",
  "action",
  "initial-node",
  "activity-final",
  "decision-node",
  "merge-node",
  "fork-node",
  "join-node",
  "interaction-occurrence",
]);

const relationshipKindSchema = z.enum([
  "association",
  "include",
  "extend",
  "sync-message",
  "reply-message",
  "class-association",
  "aggregation",
  "composition",
  "generalization",
  "component-usage",
  "assembly-connector",
  "communication-path",
  "deploy",
  "er-link",
  "control-flow",
]);

const anchorSchema = z.enum(["top", "right", "bottom", "left"]);
const multiplicitySchema = z.enum(["0..1", "1", "0..*", "1..*"]);
const cardinalitySchema = z.enum(["1", "N"]);

export function createMcpServer(): McpServer {
  const session = createSession();
  const server = new McpServer({ name: "arkuml", version: "0.0.0" });

  server.registerResource(
    "arkuml-kinds",
    "arkuml://kinds",
    { mimeType: "application/json" },
    () => ({
      contents: [kindsResource()],
    }),
  );
  server.registerResource(
    "arkuml-kind",
    new ResourceTemplate("arkuml://kind/{kind}", {
      list: undefined,
      complete: {
        kind: (value) =>
          listKindNames().filter((kind) => kind.startsWith(value)),
      },
    }),
    { mimeType: "application/json" },
    (uri, variables) => {
      const requestedKind = Array.isArray(variables.kind)
        ? variables.kind[0]
        : variables.kind;
      if (requestedKind === undefined) {
        throw new Error("Falta el kind en el URI del recurso ArkUML.");
      }
      const resource = kindResource(requestedKind);
      if (resource === undefined) {
        throw new Error(`Kind ArkUML desconocido: ${requestedKind}`);
      }
      return { contents: [{ uri: uri.href, text: resource.text }] };
    },
  );

  server.registerTool(
    "arkuml_list_kinds",
    { description: "Lista los tipos de documento ArkUML soportados." },
    () => toolResult(handleListKinds()),
  );
  server.registerTool(
    "arkuml_create_document",
    {
      description: "Crea un documento vacío en la sesión MCP.",
      inputSchema: z.object({ kind: z.string(), title: z.string().optional() }),
    },
    (input) => toolResult(handleCreateDocument(session, input)),
  );
  server.registerTool(
    "arkuml_load_document",
    {
      description:
        "Carga un envelope ArkUML JSON desde un archivo a la sesión.",
      inputSchema: z.object({ path: z.string().min(1) }),
    },
    async (input) => toolResult(await handleLoadDocument(session, input)),
  );
  server.registerTool(
    "arkuml_save_document",
    {
      description:
        "Guarda el documento de la sesión como envelope ArkUML JSON.",
      inputSchema: z.object({ path: z.string().min(1) }),
    },
    async (input) => toolResult(await handleSaveDocument(session, input)),
  );
  server.registerTool(
    "arkuml_validate_document",
    {
      description:
        "Valida el documento de la sesión o un envelope indicado por path, sin mutarlo.",
      inputSchema: z.object({ path: z.string().min(1).optional() }),
    },
    async (input) => toolResult(await handleValidateDocument(session, input)),
  );
  server.registerTool(
    "arkuml_list_elements",
    {
      description:
        "Lista elementos y relaciones del documento de la sesión o de un archivo.",
      inputSchema: z.object({ path: z.string().min(1).optional() }),
    },
    async (input) => toolResult(await handleListElements(session, input)),
  );
  server.registerTool(
    "arkuml_create_element",
    {
      description:
        "Crea un elemento del metamodelo permitido en el documento activo.",
      inputSchema: z.object({
        kind: elementKindSchema,
        name: z.string().optional(),
        geometry: geometrySchema.optional(),
        parentId: z.string().min(1).optional(),
        stemLength: z.number().finite().optional(),
        isKey: z.boolean().optional(),
        attributes: z.array(z.string()).optional(),
        operations: z.array(z.string()).optional(),
      }),
    },
    (input) => toolResult(handleCreateElement(session, input)),
  );
  server.registerTool(
    "arkuml_update_element",
    {
      description:
        "Actualiza nombre, geometría o campos permitidos de un elemento activo.",
      inputSchema: z.object({
        id: z.string().min(1),
        name: z.string().optional(),
        geometry: geometrySchema.optional(),
        parentId: z.string().min(1).nullable().optional(),
        stemLength: z.number().finite().optional(),
        isKey: z.boolean().optional(),
        attributes: z.array(z.string()).optional(),
        operations: z.array(z.string()).optional(),
      }),
    },
    (input) => toolResult(handleUpdateElement(session, input)),
  );
  server.registerTool(
    "arkuml_delete_element",
    {
      description:
        "Elimina un elemento y sus relaciones incidentes del documento activo.",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    (input) => toolResult(handleDeleteElement(session, input)),
  );
  server.registerTool(
    "arkuml_create_relationship",
    {
      description:
        "Crea una relación válida entre elementos; los rechazos del dominio son estructurados.",
      inputSchema: z.object({
        kind: relationshipKindSchema,
        sourceId: z.string().min(1),
        targetId: z.string().min(1),
        name: z.string().optional(),
        sourceAnchor: anchorSchema.optional(),
        targetAnchor: anchorSchema.optional(),
        sourceMultiplicity: multiplicitySchema.optional(),
        targetMultiplicity: multiplicitySchema.optional(),
        cardinality: cardinalitySchema.optional(),
        guard: z.string().optional(),
        y: z.number().finite().optional(),
      }),
    },
    (input) => toolResult(handleCreateRelationship(session, input)),
  );
  server.registerTool(
    "arkuml_delete_relationship",
    {
      description: "Elimina una relación por id del documento activo.",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    (input) => toolResult(handleDeleteRelationship(session, input)),
  );
  server.registerTool(
    "arkuml_describe_rules",
    {
      description:
        "Describe las reglas del kind indicado o del documento activo.",
      inputSchema: z.object({ kind: z.string().optional() }),
    },
    (input) => toolResult(handleDescribeRules(session, input)),
  );

  return server;
}

function listKindNames(): string[] {
  const response = handleListKinds();
  return response.ok ? response.value.map((entry) => entry.kind) : [];
}

function toolResult(response: ToolResponse<unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(response) }],
    structuredContent: response,
    isError: !response.ok,
  };
}

if (import.meta.main) {
  serveStdio(createMcpServer, {
    onerror: (error) => console.error("ArkUML MCP:", error.message),
  });
}
