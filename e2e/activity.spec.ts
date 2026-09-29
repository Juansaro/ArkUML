import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  canvasElementName,
  createNewDiagram,
  diagramCanvas,
  downloadBytes,
  dragBy,
  PNG_SIGNATURE,
} from "./support.ts";

async function createActivityDiagram(page: Page): Promise<void> {
  await createNewDiagram(page, "Actividades");
  await expect(page.getByRole("button", { name: "Acción" })).toBeVisible();
}

test("crea flujo de control con guarda, exporta y vuelve a casos de uso", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();

  await createActivityDiagram(page);
  const canvas = diagramCanvas(page);
  await expect(canvas.getByTestId("system-boundary-rect")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inicial" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Final" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Decisión" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fusión" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fork" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Flujo" })).toBeVisible();

  await page.getByRole("button", { name: "Inicial" }).click();
  await canvas.click({ position: { x: 120, y: 140 } });
  await expect(canvas.getByTestId("initial-node-circle")).toBeVisible();

  await page.getByRole("button", { name: "Acción" }).click();
  await canvas.click({ position: { x: 280, y: 140 } });
  await expect(canvasElementName(page, "Acción")).toBeVisible();
  await expect(canvas.getByTestId("action-box")).toBeVisible();

  await page.getByRole("button", { name: "Decisión" }).click();
  await canvas.click({ position: { x: 460, y: 140 } });
  await expect(canvas.getByTestId("decision-diamond")).toBeVisible();

  await page.getByRole("button", { name: "Final" }).click();
  await canvas.click({ position: { x: 620, y: 140 } });
  await expect(canvas.getByTestId("activity-final-bullseye")).toBeVisible();

  await page.getByRole("button", { name: "Flujo" }).click();
  await expect(page.getByRole("button", { name: "Flujo" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByTestId("connect-source").selectOption({ label: "Inicial" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Acción Acción" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-control-flow")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Selección" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
  await page.getByRole("button", { name: "Flujo" }).click();
  await page
    .getByTestId("connect-source")
    .selectOption({ label: "Acción Acción" });
  await page.getByTestId("connect-target").selectOption({ label: "Decisión" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-control-flow")).toHaveCount(2);

  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
  await page.getByRole("button", { name: "Flujo" }).click();
  await page.getByTestId("connect-source").selectOption({ label: "Decisión" });
  await page.getByTestId("connect-target").selectOption({ label: "Final" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-control-flow")).toHaveCount(3);

  const guard = page
    .getByRole("complementary", { name: "Inspector" })
    .getByLabel("Guarda");
  await guard.fill("x > 0");
  await guard.blur();
  await expect(canvas.getByTestId("control-flow-guard")).toHaveText("[x > 0]");

  await page.getByRole("button", { name: "Exportar" }).click();
  const exportDialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(exportDialog).toBeVisible();
  await exportDialog.getByRole("radio", { name: "PNG" }).click();
  await exportDialog.getByRole("radio", { name: "1x" }).click();
  const pending = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Descargar" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("Diagrama de actividades.png");
  const bytes = await downloadBytes(download);
  expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  expect(bytes.byteLength).toBeGreaterThan(32);

  const switcher = page.getByRole("combobox", { name: "Diagrama activo" });
  await switcher.click();
  const useCaseOption = page
    .getByRole("option")
    .filter({ hasText: "Casos de uso" })
    .first();
  await useCaseOption.click({ position: { x: 12, y: 16 } });
  await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Caso de uso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Acción" })).toHaveCount(0);
});

test("Inicial y Final ya seleccionados se arrastran; deshacer restaura", async ({
  page,
}) => {
  await page.goto("/");
  await createActivityDiagram(page);
  const canvas = diagramCanvas(page);

  await page.getByRole("button", { name: "Inicial" }).click();
  await canvas.click({ position: { x: 120, y: 160 } });
  const initial = canvas.locator(".react-flow__node-initial-node");
  await expect(initial.locator("[data-selected='true']")).toBeVisible();
  const initialAtRest = await dragSelected(page, initial);
  await undoTranslate(page, initial, initialAtRest);

  await clearCanvasSelection(canvas);
  await initial.click();
  await expect(initial.locator("[data-selected='true']")).toBeVisible();
  await dragSelected(page, initial);

  await page.getByRole("button", { name: "Final" }).click();
  await canvas.click({ position: { x: 280, y: 160 } });
  const activityFinal = canvas.locator(".react-flow__node-activity-final");
  await expect(activityFinal.locator("[data-selected='true']")).toBeVisible();
  const finalAtRest = await dragSelected(page, activityFinal);
  await undoTranslate(page, activityFinal, finalAtRest);

  await clearCanvasSelection(canvas);
  await activityFinal.click();
  await expect(activityFinal.locator("[data-selected='true']")).toBeVisible();
  await dragSelected(page, activityFinal);

  await page.getByRole("button", { name: "Acción" }).click();
  await canvas.click({ position: { x: 440, y: 160 } });
  const action = canvas.locator(".react-flow__node-action");
  await expect(action.locator("[data-selected='true']")).toBeVisible();
  await dragSelected(page, action);

  await page.getByRole("button", { name: "Decisión" }).click();
  await canvas.click({ position: { x: 640, y: 160 } });
  const decision = canvas.locator(".react-flow__node-decision-node");
  await expect(decision.locator("[data-selected='true']")).toBeVisible();
  await dragFromCenter(page, decision);
});

async function clearCanvasSelection(canvas: Locator): Promise<void> {
  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
}

async function translateOf(node: Locator): Promise<string> {
  const style = (await node.getAttribute("style")) ?? "";
  return /translate\([^)]+\)/.exec(style)?.[0] ?? "";
}

async function dragSelected(page: Page, node: Locator): Promise<string> {
  const before = await translateOf(node);
  expect(before.length).toBeGreaterThan(0);
  await dragBy(page, node, 80, 48);
  await expect.poll(async () => translateOf(node)).not.toBe(before);
  return before;
}

async function dragFromCenter(page: Page, node: Locator): Promise<void> {
  const before = await translateOf(node);
  expect(before.length).toBeGreaterThan(0);
  const box = await node.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el nodo");
  }
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 80, startY + 48, { steps: 16 });
  await page.mouse.up();
  await expect.poll(async () => translateOf(node)).not.toBe(before);
}

async function undoTranslate(
  page: Page,
  node: Locator,
  translate: string,
): Promise<void> {
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect.poll(async () => translateOf(node)).toBe(translate);
}
