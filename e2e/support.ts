import { expect, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

export const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export function diagramCanvas(page: Page): Locator {
  return page.getByTestId("diagram-canvas");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function canvasElementName(page: Page, name: string): Locator {
  return diagramCanvas(page)
    .getByTestId("element-name")
    .filter({ hasText: new RegExp(`^${escapeRegExp(name)}$`) });
}

export function diagramElement(
  page: Page,
  kind: "actor" | "use-case" | "lifeline",
  name: string,
): Locator {
  return diagramCanvas(page)
    .locator(`[data-kind="${kind}"]`)
    .filter({ has: page.getByTestId("element-name") })
    .filter({ hasText: new RegExp(`^${escapeRegExp(name)}$`) });
}

export async function placeElement(
  page: Page,
  tool: "Actor" | "Caso de uso",
  position: { x: number; y: number },
  name: string,
): Promise<Locator> {
  const canvas = diagramCanvas(page);
  await page.getByRole("button", { name: tool }).click();
  await canvas.click({ position });
  await expect(canvasElementName(page, name)).toBeVisible();
  return diagramElement(page, tool === "Actor" ? "actor" : "use-case", name);
}

export async function dragBy(
  page: Page,
  locator: Locator,
  deltaX: number,
  deltaY: number,
): Promise<void> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el elemento a arrastrar");
  }
  const startX = box.x + Math.min(16, box.width / 4);
  const startY = box.y + box.height * 0.35;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 16 });
  await page.mouse.up();
}

export async function connectHandles(
  page: Page,
  source: Locator,
  target: Locator,
): Promise<void> {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (sourceBox === null || targetBox === null) {
    throw new Error("No se pudo medir un handle");
  }
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 16 },
  );
  await page.mouse.up();
}

export function sourceHandle(element: Locator): Locator {
  return element.locator(".react-flow__handle-right").last();
}

export function targetHandle(element: Locator): Locator {
  return element.locator(".react-flow__handle-left").first();
}

export function selectedEndpoint(
  inspector: Locator,
  testId: "inspector-source" | "inspector-target",
): Locator {
  return inspector.getByTestId(testId).locator("option:checked");
}

export async function downloadBytes(download: {
  path: () => Promise<string | null>;
}): Promise<Buffer> {
  const filePath = await download.path();
  if (filePath === null) {
    throw new Error("La descarga no produjo un archivo");
  }
  return readFile(filePath);
}

export async function createNewDiagram(
  page: Page,
  kind: "Casos de uso" | "Secuencia" = "Casos de uso",
): Promise<void> {
  await page.getByRole("button", { name: "Nuevo" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo diagrama" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("radio", { name: kind }).click();
  await dialog.getByRole("button", { name: "Crear diagrama nuevo" }).click();
  await expect(dialog).toHaveCount(0);
}

export async function confirmWorkspaceUpgrade(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Actualizar el workspace" });
  try {
    await dialog.waitFor({ state: "visible", timeout: 1500 });
  } catch {
    return;
  }
  await dialog.getByRole("button", { name: "Guardar como 2.0" }).click();
  await expect(dialog).toHaveCount(0);
}

export function activeWorkspaceViewX(raw: string | null): number {
  if (raw === null) {
    return 0;
  }
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    return 0;
  }
  const record = parsed as Record<string, unknown>;
  const legacyView = numberFromViewX(record.view);
  if (legacyView !== undefined) {
    return legacyView;
  }
  if (!Array.isArray(record.documents)) {
    return 0;
  }
  const activeId =
    typeof record.activeDocumentId === "string"
      ? record.activeDocumentId
      : undefined;
  const documents: unknown[] = record.documents;
  const matched = documents.find((candidate) => {
    const id = documentIdFromEntry(candidate);
    return id !== undefined && id === activeId;
  });
  const selected = matched ?? documents[0];
  return numberFromViewX(viewFromEntry(selected)) ?? 0;
}

function documentIdFromEntry(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("document" in value)) {
    return undefined;
  }
  const document = value.document;
  if (
    typeof document !== "object" ||
    document === null ||
    !("id" in document)
  ) {
    return undefined;
  }
  return typeof document.id === "string" ? document.id : undefined;
}

function viewFromEntry(value: unknown): unknown {
  if (typeof value !== "object" || value === null || !("view" in value)) {
    return undefined;
  }
  return value.view;
}

function numberFromViewX(value: unknown): number | undefined {
  if (typeof value !== "object" || value === null || !("x" in value)) {
    return undefined;
  }
  return typeof value.x === "number" ? value.x : undefined;
}
