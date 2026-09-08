import { expect, test } from "@playwright/test";

const viewports = [
  { width: 1024, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

test("expone landmarks del shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Paleta" })).toBeVisible();
  await expect(page.getByRole("main", { name: "Lienzo" })).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Estado del editor" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "ArkUML", level: 1 }),
  ).toBeVisible();
});

test("drawers de paleta e inspector entre 768 y 1023 px", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 720 });
  await page.goto("/");

  const palette = page.getByRole("navigation", { name: "Paleta" });
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await expect(page.getByRole("button", { name: "Paleta" })).toBeVisible();
  await expect(palette).not.toBeInViewport();
  await expect(inspector).not.toBeInViewport();

  await page.getByRole("button", { name: "Paleta" }).click();
  await expect(palette).toBeInViewport();

  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(inspector).toBeInViewport();
  await expect(palette).not.toBeInViewport();
});

test("aviso bajo 768 px sin desmontar el shell", async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 720 });
  await page.goto("/");

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "ArkUML", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("main", { name: "Lienzo" })).toBeVisible();
});

for (const viewport of viewports) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({
      viewport,
      deviceScaleFactor: 1,
      colorScheme: "light",
    });

    // Baselines: Windows 10 (build 26200), Chromium, deviceScaleFactor 1.
    // No mezclar con capturas Linux de CI hasta la política de TASK-020.
    test(`captura el shell a ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByRole("banner")).toBeVisible();
      await page.getByRole("heading", { name: "ArkUML", level: 1 }).click();

      await expect(page).toHaveScreenshot(
        `shell-${viewport.width}x${viewport.height}.png`,
      );
    });
  });
}
