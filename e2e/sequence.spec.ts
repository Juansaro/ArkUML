import { expect, test, type Page } from "@playwright/test";
import {
  canvasElementName,
  connectHandles,
  createNewDiagram,
  diagramCanvas,
  diagramElement,
  downloadBytes,
  dragBy,
  PNG_SIGNATURE,
  sourceHandle,
  targetHandle,
} from "./support.ts";

async function createSequenceDiagram(page: Page): Promise<void> {
  await createNewDiagram(page, "Secuencia");
  await expect(page.getByRole("button", { name: "Lifeline" })).toBeVisible();
}

test("crea lifelines, sync, reply, rename, export y vuelve a casos de uso", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();

  await createSequenceDiagram(page);
  const canvas = diagramCanvas(page);
  await expect(canvas.getByTestId("system-boundary-rect")).toHaveCount(0);

  await page.getByRole("button", { name: "Lifeline" }).click();
  await canvas.click({ position: { x: 160, y: 80 } });
  await expect(canvasElementName(page, "Lifeline")).toBeVisible();

  await page.getByRole("button", { name: "Lifeline" }).click();
  await canvas.click({ position: { x: 420, y: 80 } });
  await expect(canvasElementName(page, "Lifeline 2")).toBeVisible();

  const first = diagramElement(page, "lifeline", "Lifeline");
  const second = diagramElement(page, "lifeline", "Lifeline 2");

  await page.getByRole("button", { name: "Mensaje síncrono" }).click();
  await expect(
    page.getByRole("button", { name: "Mensaje síncrono" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(sourceHandle(first)).toBeVisible();
  await expect(targetHandle(second)).toBeVisible();
  await connectHandles(page, sourceHandle(first), targetHandle(second));
  await expect(
    canvas.getByLabel("Mensaje síncrono entre Lifeline y Lifeline 2"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Selección" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 24, y: 24 } });
  await page.getByRole("button", { name: "Reply" }).click();
  await expect(page.getByRole("button", { name: "Reply" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByTestId("connect-source")
    .selectOption({ label: "Lifeline Lifeline" });
  await page
    .getByTestId("connect-target")
    .selectOption({ label: "Lifeline Lifeline" });
  await page.getByTestId("connect-relationship").click();
  await expect(
    canvas.getByLabel("Reply entre Lifeline y Lifeline"),
  ).toBeVisible();
  await expect(canvas.locator('[data-self="true"]')).toBeVisible();

  await first.getByTestId("lifeline-head").click();
  const name = page
    .getByRole("complementary", { name: "Inspector" })
    .getByLabel("Nombre");
  await name.fill("Cliente");
  await name.press("Enter");
  await expect(canvasElementName(page, "Cliente")).toBeVisible();

  await page.getByRole("button", { name: "Exportar" }).click();
  const exportDialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(exportDialog).toBeVisible();
  await exportDialog.getByRole("radio", { name: "PNG" }).click();
  await exportDialog.getByRole("radio", { name: "1x" }).click();
  const pending = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Descargar" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("Diagrama de secuencia.png");
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
  await expect(page.getByRole("button", { name: "Lifeline" })).toHaveCount(0);
});

test("Ajuste alinea una lifeline al eje vertical y un arrastre corto no imanta", async ({
  page,
}) => {
  await page.goto("/");
  await createSequenceDiagram(page);
  const canvas = diagramCanvas(page);

  await page.getByRole("button", { name: "Lifeline" }).click();
  await canvas.click({ position: { x: 220, y: 120 } });
  await expect(canvasElementName(page, "Lifeline")).toBeVisible();

  await page.getByRole("button", { name: "Lifeline" }).click();
  await canvas.click({ position: { x: 268, y: 200 } });
  await expect(canvasElementName(page, "Lifeline 2")).toBeVisible();

  const ajuste = page.getByRole("button", { name: "Ajuste" });
  const select = page.getByRole("button", { name: "Selección" });
  await expect(ajuste).toHaveAttribute("aria-pressed", "false");
  await expect(select).toHaveAttribute("aria-pressed", "true");

  await ajuste.click();
  await expect(ajuste).toHaveAttribute("aria-pressed", "true");
  await expect(select).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Lifeline" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  const anchor = diagramElement(page, "lifeline", "Lifeline").getByTestId(
    "lifeline-head",
  );
  const moving = diagramElement(page, "lifeline", "Lifeline 2").getByTestId(
    "lifeline-head",
  );
  const anchorBox = await anchor.boundingBox();
  const movingBox = await moving.boundingBox();
  if (anchorBox === null || movingBox === null) {
    throw new Error("No se pudieron medir las cabeceras");
  }
  expect(Math.abs(movingBox.x - anchorBox.x)).toBeGreaterThan(8);

  await dragBy(page, moving, anchorBox.x + 4 - movingBox.x, 0);

  const alignedAnchor = await anchor.boundingBox();
  const alignedMoving = await moving.boundingBox();
  if (alignedAnchor === null || alignedMoving === null) {
    throw new Error("No se pudieron medir las cabeceras alineadas");
  }
  expect(Math.abs(alignedMoving.x - alignedAnchor.x)).toBeLessThan(2);

  await ajuste.click();
  await expect(ajuste).toHaveAttribute("aria-pressed", "false");
  await expect(select).toHaveAttribute("aria-pressed", "true");

  const beforeShort = await moving.boundingBox();
  if (beforeShort === null) {
    throw new Error("No se pudo medir la cabecera antes del arrastre corto");
  }
  await dragBy(page, moving, 10, 0);
  const afterShort = await moving.boundingBox();
  if (afterShort === null) {
    throw new Error("No se pudo medir la cabecera tras el arrastre corto");
  }
  expect(Math.abs(afterShort.x - beforeShort.x - 10)).toBeLessThan(3);
});
