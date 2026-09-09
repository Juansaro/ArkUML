import { expect, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

export const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export function diagramCanvas(page: Page): Locator {
  return page.getByTestId("diagram-canvas");
}

export function diagramElement(
  page: Page,
  kind: "actor" | "use-case",
  name: string,
): Locator {
  return diagramCanvas(page)
    .locator(`[data-kind="${kind}"]`)
    .filter({ has: page.getByText(name, { exact: true }) });
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
  await expect(canvas.getByText(name, { exact: true })).toBeVisible();
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

export async function downloadBytes(download: {
  path: () => Promise<string | null>;
}): Promise<Buffer> {
  const filePath = await download.path();
  if (filePath === null) {
    throw new Error("La descarga no produjo un archivo");
  }
  return readFile(filePath);
}
