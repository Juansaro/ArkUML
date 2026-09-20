import { expect, test, type Page } from "@playwright/test";
import {
  canvasElementName,
  createNewDiagram,
  diagramCanvas,
  downloadBytes,
  PNG_SIGNATURE,
} from "./support.ts";

async function createInteractionOverviewDiagram(page: Page): Promise<void> {
  await createNewDiagram(page, "Interacción general");
  await expect(page.getByRole("button", { name: "Interacción" })).toBeVisible();
}

test("crea overview con ref, flujo, exporta y vuelve a casos de uso", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();

  await createInteractionOverviewDiagram(page);
  const canvas = diagramCanvas(page);
  await expect(canvas.getByTestId("system-boundary-rect")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inicial" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Final" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Decisión" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fusión" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fork" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Flujo" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Acción", exact: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Inicial" }).click();
  await canvas.click({ position: { x: 120, y: 140 } });
  await expect(canvas.getByTestId("initial-node-circle")).toBeVisible();

  await page.getByRole("button", { name: "Interacción" }).click();
  await canvas.click({ position: { x: 300, y: 140 } });
  await expect(canvasElementName(page, "Interacción")).toBeVisible();
  await expect(canvas.getByTestId("interaction-occurrence-frame")).toBeVisible();
  await expect(canvas.getByTestId("interaction-occurrence-ref")).toHaveText(
    "ref",
  );

  await page.getByRole("button", { name: "Final" }).click();
  await canvas.click({ position: { x: 520, y: 140 } });
  await expect(canvas.getByTestId("activity-final-bullseye")).toBeVisible();

  await page.getByRole("button", { name: "Flujo" }).click();
  await expect(page.getByRole("button", { name: "Flujo" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByTestId("connect-source").selectOption({ label: "Inicial" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Interacción Interacción" });
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
    .selectOption({ label: "Interacción Interacción" });
  await page.getByTestId("connect-target").selectOption({ label: "Final" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-control-flow")).toHaveCount(2);

  const guard = page
    .getByRole("complementary", { name: "Inspector" })
    .getByLabel("Guarda");
  await guard.fill("ok");
  await guard.blur();
  await expect(canvas.getByTestId("control-flow-guard")).toHaveText("[ok]");

  await page.getByRole("button", { name: "Exportar" }).click();
  const exportDialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(exportDialog).toBeVisible();
  await exportDialog.getByRole("radio", { name: "PNG" }).click();
  await exportDialog.getByRole("radio", { name: "1x" }).click();
  const pending = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Descargar" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    "Diagrama de interacción general.png",
  );
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
  await expect(page.getByRole("button", { name: "Interacción" })).toHaveCount(0);
});
