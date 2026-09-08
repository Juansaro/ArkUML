import type { WorkspaceSnapshot } from "../domain/diagram/model.ts";

export const WORKSPACE_STORAGE_KEY = "arkuml:workspace:v1";

export const PERSISTENCE_ERROR_CODES = [
  "PARSE_INVALID",
  "QUOTA_EXCEEDED",
  "STORAGE_UNAVAILABLE",
] as const;

export type PersistenceErrorCode = (typeof PERSISTENCE_ERROR_CODES)[number];

export type PersistenceError = {
  code: PersistenceErrorCode;
  message: string;
};

export type PersistenceResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: PersistenceError };

export function persistenceOk<T>(value: T): PersistenceResult<T> {
  return { ok: true, value };
}

export function persistenceErr<T = never>(
  code: PersistenceErrorCode,
  message: string,
): PersistenceResult<T> {
  return { ok: false, error: { code, message } };
}

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type DiagramRepository = {
  load(): Promise<PersistenceResult<WorkspaceSnapshot | undefined>>;
  save(snapshot: WorkspaceSnapshot): Promise<PersistenceResult<undefined>>;
  clear(): Promise<PersistenceResult<undefined>>;
};
