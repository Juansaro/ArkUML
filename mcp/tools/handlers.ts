import { readFile, writeFile } from "node:fs/promises";
import {
  createDocument,
  createElement,
  createRelationship,
  deleteElement,
  deleteRelationship,
  describeRules,
  listElements,
  listKinds,
  loadDocument,
  saveDocument,
  updateElement,
  validateDocument,
} from "../../src/domain/diagram/agentApi.ts";
import type {
  AgentCreateElementInput,
  AgentCreateRelationshipInput,
  AgentElementUpdate,
  AgentValidation,
} from "../../src/domain/diagram/agentApi.ts";
import type { ArkUmlDocumentFile } from "../../src/domain/diagram/documentFile.ts";
import type {
  DiagramDocument,
  Result,
  Viewport,
} from "../../src/domain/diagram/model.ts";

type ToolSuccess<T> = { ok: true; value: T };
type ToolFailure = { ok: false; error: { code: string; message: string } };
export type ToolResponse<T> = ToolSuccess<T> | ToolFailure;

export type DocumentSession = {
  document?: DiagramDocument;
  view?: Viewport;
};

export function createSession(): DocumentSession {
  return {};
}

export function handleListKinds(): ToolResponse<ReturnType<typeof listKinds>> {
  return success(listKinds());
}

export function handleCreateDocument(
  session: DocumentSession,
  input: { kind: string; title?: string | undefined },
): ToolResponse<DiagramDocument> {
  const created = createDocument(
    input.kind,
    input.title === undefined ? {} : { title: input.title },
  );
  if (!created.ok) {
    return domainFailure(created);
  }
  session.document = created.value;
  session.view = { x: 0, y: 0, zoom: 1 };
  return success(created.value);
}

export async function handleLoadDocument(
  session: DocumentSession,
  input: { path: string },
): Promise<ToolResponse<DiagramDocument>> {
  const loaded = await readDocument(input.path);
  if (!loaded.ok) {
    return loaded;
  }
  session.document = loaded.value.document;
  session.view = loaded.value.view;
  return success(loaded.value.document);
}

export async function handleSaveDocument(
  session: DocumentSession,
  input: { path: string },
): Promise<ToolResponse<{ path: string }>> {
  if (session.document === undefined) {
    return noSession();
  }
  try {
    await writeFile(
      input.path,
      saveDocument(session.document, session.view),
      "utf8",
    );
  } catch {
    return failure(
      "FILE_WRITE_FAILED",
      "No se pudo guardar el archivo ArkUML.",
    );
  }
  return success({ path: input.path });
}

export async function handleValidateDocument(
  session: DocumentSession,
  input: { path?: string | undefined },
): Promise<ToolResponse<AgentValidation>> {
  const document = await resolveDocument(session, input.path);
  if (!document.ok) {
    return document;
  }
  const validated = validateDocument(document.value);
  return validated.ok ? success(validated.value) : domainFailure(validated);
}

export async function handleListElements(
  session: DocumentSession,
  input: { path?: string | undefined },
): Promise<ToolResponse<ReturnType<typeof listElements>>> {
  const document = await resolveDocument(session, input.path);
  return document.ok ? success(listElements(document.value)) : document;
}

export function handleCreateElement(
  session: DocumentSession,
  input: AgentCreateElementInput,
): ToolResponse<DiagramDocument> {
  if (session.document === undefined) {
    return noSession();
  }
  const created = createElement(session.document, input);
  if (!created.ok) {
    return domainFailure(created);
  }
  session.document = created.value;
  return success(created.value);
}

export function handleUpdateElement(
  session: DocumentSession,
  input: AgentElementUpdate,
): ToolResponse<DiagramDocument> {
  if (session.document === undefined) {
    return noSession();
  }
  const updated = updateElement(session.document, input);
  if (!updated.ok) {
    return domainFailure(updated);
  }
  session.document = updated.value;
  return success(updated.value);
}

export function handleDeleteElement(
  session: DocumentSession,
  input: { id: string },
): ToolResponse<DiagramDocument> {
  if (session.document === undefined) {
    return noSession();
  }
  const deleted = deleteElement(session.document, input.id);
  if (!deleted.ok) {
    return domainFailure(deleted);
  }
  session.document = deleted.value;
  return success(deleted.value);
}

export function handleCreateRelationship(
  session: DocumentSession,
  input: AgentCreateRelationshipInput,
): ToolResponse<DiagramDocument> {
  if (session.document === undefined) {
    return noSession();
  }
  const created = createRelationship(session.document, input);
  if (!created.ok) {
    return domainFailure(created);
  }
  session.document = created.value;
  return success(created.value);
}

export function handleDeleteRelationship(
  session: DocumentSession,
  input: { id: string },
): ToolResponse<DiagramDocument> {
  if (session.document === undefined) {
    return noSession();
  }
  const deleted = deleteRelationship(session.document, input.id);
  if (!deleted.ok) {
    return domainFailure(deleted);
  }
  session.document = deleted.value;
  return success(deleted.value);
}

export function handleDescribeRules(
  session: DocumentSession,
  input: { kind?: string | undefined },
): ToolResponse<ReturnType<typeof listKinds>[number]> {
  const kind = input.kind ?? session.document?.kind;
  if (kind === undefined) {
    return noSession();
  }
  const rules = describeRules(kind);
  return rules.ok ? success(rules.value) : domainFailure(rules);
}

async function resolveDocument(
  session: DocumentSession,
  path: string | undefined,
): Promise<ToolResponse<DiagramDocument>> {
  if (path === undefined) {
    return session.document === undefined
      ? noSession()
      : success(session.document);
  }
  const loaded = await readDocument(path);
  return loaded.ok ? success(loaded.value.document) : loaded;
}

async function readDocument(
  path: string,
): Promise<ToolResponse<ArkUmlDocumentFile>> {
  try {
    const loaded = loadDocument(await readFile(path, "utf8"));
    return loaded.ok ? success(loaded.value) : domainFailure(loaded);
  } catch {
    return failure("FILE_READ_FAILED", "No se pudo leer el archivo ArkUML.");
  }
}

function success<T>(value: T): ToolSuccess<T> {
  return { ok: true, value };
}

function failure(code: string, message: string): ToolFailure {
  return { ok: false, error: { code, message } };
}

function noSession(): ToolFailure {
  return failure(
    "NO_ACTIVE_DOCUMENT",
    "No hay un documento activo en la sesión MCP.",
  );
}

function domainFailure<T>(
  result: Extract<Result<T>, { ok: false }>,
): ToolFailure {
  return { ok: false, error: result.error };
}
