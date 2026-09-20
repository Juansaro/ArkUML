import { expect, test, type Page } from "@playwright/test";
import {
  canvasElementName,
  createNewDiagram,
  diagramCanvas,
  diagramElement,
  downloadBytes,
  PNG_SIGNATURE,
} from "./support.ts";

async function createErDiagram(page: Page): Promise<void> {
  await createNewDiagram(page, "Entidad relación");
  await expect(page.getByRole("button", { name: "Entidad" })).toBeVisible();
}

test("crea entidades, atributo, rombo, enlaces, export y vuelve a casos de uso", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();

  await createErDiagram(page);
  const canvas = diagramCanvas(page);
  await expect(canvas.getByTestId("system-boundary-rect")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Atributo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Relación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enlace" })).toBeVisible();

  await page.getByRole("button", { name: "Entidad" }).click();
  await canvas.click({ position: { x: 160, y: 140 } });
  await expect(canvasElementName(page, "Entidad")).toBeVisible();
  await expect(canvas.getByTestId("entity-box")).toBeVisible();

  await page.getByRole("button", { name: "Entidad" }).click();
  await canvas.click({ position: { x: 420, y: 140 } });
  await expect(canvasElementName(page, "Entidad 2")).toBeVisible();

  await page.getByRole("button", { name: "Atributo" }).click();
  await canvas.click({ position: { x: 160, y: 320 } });
  await expect(canvasElementName(page, "Atributo")).toBeVisible();
  await expect(canvas.getByTestId("attribute-ellipse")).toBeVisible();

  await page.getByRole("button", { name: "Relación" }).click();
  await canvas.click({ position: { x: 290, y: 140 } });
  await expect(canvasElementName(page, "Relación")).toBeVisible();
  await expect(canvas.getByTestId("er-relationship-diamond")).toBeVisible();

  await page.getByRole("button", { name: "Enlace" }).click();
  await expect(page.getByRole("button", { name: "Enlace" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByTestId("connect-source")
    .selectOption({ label: "Atributo Atributo" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Entidad Entidad" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-er-link")).toHaveCount(1);
  await expect(
    canvas.getByLabel(/Enlace entre Atributo y Entidad/),
  ).toBeAttached();
  await expect(page.getByRole("button", { name: "Selección" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
  await page.getByRole("button", { name: "Enlace" }).click();
  await page
    .getByTestId("connect-source")
    .selectOption({ label: "Entidad Entidad" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Relación Relación" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-er-link")).toHaveCount(2);
  await expect(canvas.getByTestId("er-cardinality")).toHaveText("N");

  const cardinality = page
    .getByRole("complementary", { name: "Inspector" })
    .getByLabel("Cardinalidad");
  await cardinality.selectOption("1");
  await expect(canvas.getByTestId("er-cardinality")).toHaveText("1");

  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
  await page.getByRole("button", { name: "Enlace" }).click();
  await page
    .getByTestId("connect-source")
    .selectOption({ label: "Entidad Entidad 2" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Relación Relación" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-er-link")).toHaveCount(3);

  const atributo = diagramElement(page, "attribute", "Atributo");
  await atributo.click({ position: { x: 40, y: 28 } });
  const key = page
    .getByRole("complementary", { name: "Inspector" })
    .getByLabel("Clave");
  await key.check();
  await expect(atributo).toHaveAttribute("data-key", "true");

  await page.getByRole("button", { name: "Exportar" }).click();
  const exportDialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(exportDialog).toBeVisible();
  await exportDialog.getByRole("radio", { name: "PNG" }).click();
  await exportDialog.getByRole("radio", { name: "1x" }).click();
  const pending = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Descargar" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("Diagrama entidad-relación.png");
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
  await expect(page.getByRole("button", { name: "Entidad" })).toHaveCount(0);
});
