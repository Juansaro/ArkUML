import { expect, test, type Page } from "@playwright/test";
import {
  canvasElementName,
  connectHandles,
  createNewDiagram,
  diagramCanvas,
  diagramElement,
  downloadBytes,
  PNG_SIGNATURE,
  sourceHandle,
  targetHandle,
} from "./support.ts";

async function createComponentDiagram(page: Page): Promise<void> {
  await createNewDiagram(page, "Componentes");
  await expect(page.getByRole("button", { name: "Componente" })).toBeVisible();
}

test("crea componentes, uso, ensamblaje, export y vuelve a casos de uso", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();

  await createComponentDiagram(page);
  const canvas = diagramCanvas(page);
  await expect(canvas.getByTestId("system-boundary-rect")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Uso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ensamblaje" })).toBeVisible();

  await page.getByRole("button", { name: "Componente" }).click();
  await canvas.click({ position: { x: 160, y: 120 } });
  await expect(canvasElementName(page, "Componente")).toBeVisible();
  await expect(canvas.getByTestId("component-icon")).toBeVisible();

  await page.getByRole("button", { name: "Componente" }).click();
  await canvas.click({ position: { x: 420, y: 120 } });
  await expect(canvasElementName(page, "Componente 2")).toBeVisible();

  const first = diagramElement(page, "component", "Componente");
  const second = diagramElement(page, "component", "Componente 2");

  await page.getByRole("button", { name: "Uso" }).click();
  await expect(page.getByRole("button", { name: "Uso" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(sourceHandle(first)).toBeVisible();
  await expect(targetHandle(second)).toBeVisible();
  await connectHandles(page, sourceHandle(first), targetHandle(second));
  await expect(
    canvas.getByLabel("Uso entre Componente y Componente 2"),
  ).toBeVisible();
  await expect(canvas.getByTestId("component-usage-arrow")).toBeVisible();
  await expect(canvas.getByTestId("component-relationship-label")).toHaveText(
    "«use»",
  );
  await expect(page.getByRole("button", { name: "Selección" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
  await page.getByRole("button", { name: "Ensamblaje" }).click();
  await expect(
    page.getByRole("button", { name: "Ensamblaje" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByTestId("connect-source")
    .selectOption({ label: "Componente Componente" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Componente Componente 2" });
  await page.getByTestId("connect-relationship").click();
  await expect(
    canvas.getByLabel("Ensamblaje entre Componente y Componente 2"),
  ).toBeVisible();
  await expect(canvas.getByTestId("assembly-ball")).toBeVisible();
  await expect(canvas.getByTestId("assembly-socket")).toBeVisible();

  await first.getByTestId("component-box").click();
  const name = page
    .getByRole("complementary", { name: "Inspector" })
    .getByLabel("Nombre");
  await name.fill("Billing");
  await name.press("Enter");
  await expect(canvasElementName(page, "Billing")).toBeVisible();

  await page.getByRole("button", { name: "Exportar" }).click();
  const exportDialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(exportDialog).toBeVisible();
  await exportDialog.getByRole("radio", { name: "PNG" }).click();
  await exportDialog.getByRole("radio", { name: "1x" }).click();
  const pending = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Descargar" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("Diagrama de componentes.png");
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
  await expect(page.getByRole("button", { name: "Componente" })).toHaveCount(0);
});
