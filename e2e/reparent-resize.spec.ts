import { expect, test, type Locator, type Page } from "@playwright/test";

async function dragBy(
  page: Page,
  locator: Locator,
  deltaX: number,
  deltaY: number,
): Promise<void> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el elemento a arrastrar");
  }
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 16 });
  await page.mouse.up();
}

test("reparenta un caso de uso al entrar y salir del boundary", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas).toBeVisible();

  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 80, y: 500 } });
  const useCase = canvas.locator('[data-kind="use-case"]');
  await expect(useCase).toBeVisible();
  await expect(useCase).toHaveAttribute("data-parented", "false");

  const startBox = await useCase.boundingBox();
  if (startBox === null) {
    throw new Error("No se pudo medir el caso de uso");
  }
  await dragBy(page, useCase, 0, -280);
  await expect(useCase).toHaveAttribute("data-parented", "true");

  const afterEnter = await useCase.boundingBox();
  if (afterEnter === null) {
    throw new Error("No se pudo medir el caso de uso tras entrar");
  }
  expect(Math.abs(afterEnter.x - startBox.x)).toBeLessThan(24);
  expect(Math.abs(afterEnter.y - (startBox.y - 280))).toBeLessThan(24);

  const boundary = canvas.getByTestId("system-boundary-rect");
  const childBefore = await useCase.boundingBox();
  if (childBefore === null) {
    throw new Error("No se pudo medir el hijo");
  }
  await dragBy(page, boundary, 80, 0);

  const childAfterParentMove = await useCase.boundingBox();
  if (childAfterParentMove === null) {
    throw new Error("No se pudo medir el hijo tras mover el boundary");
  }
  expect(childAfterParentMove.x - childBefore.x).toBeGreaterThan(40);

  await dragBy(page, useCase, 0, 360);
  await expect(useCase).toHaveAttribute("data-parented", "false");
});

test("redimensiona el boundary en un gesto y no baja de 320×240", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  const handle = canvas.locator(
    ".react-flow__resize-control.handle.bottom.right",
  );
  await expect(handle).toBeVisible();

  const boundary = canvas.locator(".react-flow__node").filter({
    has: page.getByTestId("system-boundary-rect"),
  });
  const before = await boundary.boundingBox();
  if (before === null) {
    throw new Error("No se pudo medir el boundary");
  }

  await dragBy(page, handle, 80, 60);

  const afterGrow = await boundary.boundingBox();
  if (afterGrow === null) {
    throw new Error("No se pudo medir el boundary agrandado");
  }
  expect(afterGrow.width).toBeGreaterThan(before.width + 40);
  expect(afterGrow.height).toBeGreaterThan(before.height + 20);

  await dragBy(page, handle, -800, -600);

  const afterShrink = await boundary.boundingBox();
  if (afterShrink === null) {
    throw new Error("No se pudo medir el boundary reducido");
  }
  expect(afterShrink.width).toBeGreaterThanOrEqual(320);
  expect(afterShrink.height).toBeGreaterThanOrEqual(240);
});

test("muestra aviso no bloqueante de actor dentro y caso fuera", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 240, y: 180 } });
  await expect(inspector.getByTestId("inspector-warning")).toContainText(
    /actor.*SystemBoundary/i,
  );

  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 80, y: 520 } });
  await expect(inspector.getByTestId("inspector-warnings")).toContainText(
    /caso de uso.*fuera/i,
  );
});
