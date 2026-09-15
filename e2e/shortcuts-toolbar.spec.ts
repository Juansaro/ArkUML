import { expect, test } from "@playwright/test";
import { canvasElementName } from "./support.ts";

test("elimina, duplica y deshace desde teclado y toolbar", async ({ page }) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas).toBeVisible();

  const undo = page.getByRole("button", { name: "Deshacer" });
  const redo = page.getByRole("button", { name: "Rehacer" });
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvasElementName(page, "Actor")).toBeVisible();
  await expect(undo).toBeEnabled();

  await page.keyboard.press("ControlOrMeta+d");
  await expect(canvasElementName(page, "Actor")).toHaveCount(2);

  await page.keyboard.press("Delete");
  await expect(canvasElementName(page, "Actor")).toHaveCount(1);

  await page.keyboard.press("ControlOrMeta+z");
  await expect(canvasElementName(page, "Actor")).toHaveCount(2);

  await undo.click();
  await expect(canvasElementName(page, "Actor")).toHaveCount(1);
  await expect(redo).toBeEnabled();

  await redo.click();
  await expect(canvasElementName(page, "Actor")).toHaveCount(2);

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 220, y: 500 } });
  await expect(canvasElementName(page, "Actor 2")).toBeVisible();

  const canvasBox = await canvas.boundingBox();
  if (canvasBox === null) {
    throw new Error("No se pudo medir el lienzo");
  }
  await page.mouse.move(canvasBox.x + 40, canvasBox.y + 430);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + 280, canvasBox.y + 560, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId("inspector-multiple")).toBeVisible();
  await page.keyboard.press("Backspace");
  await expect(canvasElementName(page, "Actor")).toHaveCount(0);
  await expect(canvasElementName(page, "Actor 2")).toHaveCount(0);
});

test("no elimina mientras se edita el nombre", async ({ page }) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 240, y: 180 } });
  const useCase = canvas.locator('[data-kind="use-case"]');
  await expect(useCase).toBeVisible();

  await useCase.click();
  await page.keyboard.press("Enter");
  const name = canvas.getByLabel("Nombre del elemento");
  await expect(name).toBeFocused();
  await page.keyboard.press("Delete");
  await expect(useCase).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(name).toHaveCount(0);
  await page.keyboard.press("Delete");
  await expect(canvas.locator('[data-kind="use-case"]')).toHaveCount(0);

  await page.keyboard.press("ControlOrMeta+z");
  await expect(canvas.locator('[data-kind="use-case"]')).toBeVisible();
});

test("mueve la selección con flechas y ajusta la vista con Ctrl+0", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });

  const actor = canvas.locator(".react-flow__node").filter({
    has: page.getByText("Actor", { exact: true }),
  });
  const before = await actor.boundingBox();
  if (before === null) {
    throw new Error("No se pudo medir el actor");
  }

  await page.keyboard.press("Shift+ArrowRight");
  const after = await actor.boundingBox();
  if (after === null) {
    throw new Error("No se pudo medir el actor desplazado");
  }
  expect(after.x).toBeGreaterThan(before.x);

  await page.getByRole("button", { name: "Acercar" }).click();
  await expect(
    page.getByRole("status", { name: "Estado del editor" }),
  ).not.toHaveText(/Zoom 100%/);

  await page.keyboard.press("ControlOrMeta+0");
  await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();
});

test("copia y pega actores y casos con teclado y menú contextual", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas).toBeVisible();

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvasElementName(page, "Actor")).toBeVisible();

  await page.keyboard.press("ControlOrMeta+c");
  await page.keyboard.press("ControlOrMeta+v");
  await expect(canvasElementName(page, "Actor")).toHaveCount(2);

  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 240, y: 180 } });
  const useCase = canvas.locator('[data-kind="use-case"]');
  await expect(useCase).toBeVisible();
  await useCase.click();
  await useCase.click({ button: "right" });

  const menu = page.getByTestId("canvas-context-menu");
  await expect(menu).toBeVisible();
  await page.getByRole("menuitem", { name: "Copiar" }).click();
  await expect(menu).toHaveCount(0);

  await canvas.click({ button: "right", position: { x: 80, y: 80 } });
  await expect(page.getByTestId("canvas-context-menu")).toBeVisible();
  await page.getByRole("menuitem", { name: "Pegar" }).click();
  await expect(canvas.locator('[data-kind="use-case"]')).toHaveCount(2);
});

test("lista los atajos en la ayuda de la barra superior", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Ayuda" }).click();
  const dialog = page.getByRole("dialog", { name: "Ayuda" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Ctrl/Cmd+Z");
  await expect(dialog).toContainText("Ctrl/Cmd+D");
  await expect(dialog).toContainText("Ctrl/Cmd+C");
  await expect(dialog).toContainText("Ctrl/Cmd+V");
  await expect(dialog).toContainText("Flechas / Shift+flechas");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
