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

async function createDeploymentDiagram(page: Page): Promise<void> {
  await createNewDiagram(page, "Despliegue");
  await expect(page.getByRole("button", { name: "Nodo" })).toBeVisible();
}

test("crea nodos, artefacto, camino, deploy, export y vuelve a casos de uso", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();

  await createDeploymentDiagram(page);
  const canvas = diagramCanvas(page);
  await expect(canvas.getByTestId("system-boundary-rect")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Artefacto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Camino" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desplegar" })).toBeVisible();

  await page.getByRole("button", { name: "Nodo" }).click();
  await canvas.click({ position: { x: 160, y: 120 } });
  await expect(canvasElementName(page, "Nodo")).toBeVisible();
  await expect(canvas.getByTestId("deployment-node-prism")).toBeVisible();

  await page.getByRole("button", { name: "Nodo" }).click();
  await canvas.click({ position: { x: 420, y: 120 } });
  await expect(canvasElementName(page, "Nodo 2")).toBeVisible();

  await page.getByRole("button", { name: "Artefacto" }).click();
  await canvas.click({ position: { x: 160, y: 320 } });
  await expect(canvasElementName(page, "Artefacto")).toBeVisible();
  await expect(canvas.getByTestId("artifact-icon")).toBeVisible();

  const first = diagramElement(page, "node", "Nodo");
  const second = diagramElement(page, "node", "Nodo 2");

  await page.getByRole("button", { name: "Camino" }).click();
  await expect(page.getByRole("button", { name: "Camino" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(sourceHandle(first)).toBeVisible();
  await expect(targetHandle(second)).toBeVisible();
  await connectHandles(page, sourceHandle(first), targetHandle(second));
  await expect(canvas.locator(".diagram-edge-communication-path")).toHaveCount(1);
  await expect(
    canvas.getByLabel(/Camino de comunicación entre Nodo y Nodo 2/),
  ).toBeAttached();
  await expect(page.getByRole("button", { name: "Selección" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
  await page.getByRole("button", { name: "Desplegar" }).click();
  await expect(page.getByRole("button", { name: "Desplegar" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByTestId("connect-source")
    .selectOption({ label: "Artefacto Artefacto" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Nodo Nodo" });
  await page.getByTestId("connect-relationship").click();
  await expect(canvas.locator(".diagram-edge-deploy")).toHaveCount(1);
  await expect(canvas.getByLabel(/Deploy entre Artefacto y Nodo/)).toBeAttached();
  await expect(canvas.getByTestId("deploy-arrow")).toBeVisible();
  await expect(canvas.getByTestId("deployment-relationship-label")).toHaveText(
    "«deploy»",
  );

  await first.click({ position: { x: 40, y: 60 } });
  const name = page
    .getByRole("complementary", { name: "Inspector" })
    .getByLabel("Nombre");
  await name.fill("AppServer");
  await name.press("Enter");
  await expect(canvasElementName(page, "AppServer")).toBeVisible();

  await page.getByRole("button", { name: "Exportar" }).click();
  const exportDialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(exportDialog).toBeVisible();
  await exportDialog.getByRole("radio", { name: "PNG" }).click();
  await exportDialog.getByRole("radio", { name: "1x" }).click();
  const pending = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Descargar" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("Diagrama de despliegue.png");
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
  await expect(page.getByRole("button", { name: "Nodo" })).toHaveCount(0);
});
