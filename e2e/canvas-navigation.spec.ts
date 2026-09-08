import { expect, test } from "@playwright/test";

test("pan, zoom y fit actualizan el lienzo sin perder el diagrama", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas.getByText("Sistema")).toBeVisible();
  await expect(page.getByRole("link", { name: /react flow/i })).toBeVisible();

  const viewport = page.locator(".react-flow__viewport");
  const before = await viewport.getAttribute("style");

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el lienzo");
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(
    box.x + box.width / 2 + 80,
    box.y + box.height / 2 + 40,
  );
  await page.mouse.up({ button: "middle" });

  await expect
    .poll(async () => viewport.getAttribute("style"))
    .not.toBe(before);

  await page.getByRole("button", { name: "Acercar" }).click();
  await expect(
    page.getByRole("status", { name: "Estado del editor" }),
  ).not.toHaveText(/Zoom 100%/);

  await page.getByRole("button", { name: "Ajustar vista" }).click();
  await expect(canvas.getByText("Sistema")).toBeVisible();
  await expect(page.getByTestId("diagram-canvas")).toBeVisible();
});
