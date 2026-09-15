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

  const palette = page.getByRole("navigation", {
    name: "Paleta",
    includeHidden: true,
  });
  const inspector = page.getByRole("complementary", {
    name: "Inspector",
    includeHidden: true,
  });

  await expect(page.getByRole("button", { name: "Paleta" })).toBeVisible();
  await expect(palette).not.toBeInViewport();
  await expect(inspector).not.toBeInViewport();

  await page.getByRole("button", { name: "Paleta" }).click();
  await expect(
    page.getByRole("navigation", { name: "Paleta" }),
  ).toBeInViewport();

  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toBeInViewport();
  await expect(
    page.getByRole("navigation", { name: "Paleta", includeHidden: true }),
  ).not.toBeInViewport();
});

test("oculta paleta e inspector de forma independiente en desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const paletteToggle = page.getByRole("button", { name: "Paleta" });
  const inspectorToggle = page.getByRole("button", { name: "Inspector" });
  const palette = page.getByRole("navigation", { name: "Paleta" });
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const canvas = page.getByRole("main", { name: "Lienzo" });

  await expect(paletteToggle).toBeVisible();
  await expect(inspectorToggle).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Paleta" }),
  ).toHaveCount(0);
  await expect(paletteToggle).toHaveAttribute("aria-expanded", "true");
  await expect(inspectorToggle).toHaveAttribute("aria-expanded", "true");
  await expect(palette).toBeVisible();
  await expect(inspector).toBeVisible();

  const canvasBefore = await canvas.boundingBox();

  await paletteToggle.click();
  await expect(paletteToggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("navigation", { name: "Paleta", includeHidden: true }),
  ).toBeHidden();
  await expect(inspector).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cerrar paneles" }),
  ).toHaveCount(0);

  const canvasAfterHidePalette = await canvas.boundingBox();
  expect(canvasAfterHidePalette?.width ?? 0).toBeGreaterThan(
    canvasBefore?.width ?? 0,
  );
  const hiddenPaletteRail = await paletteToggle.boundingBox();
  expect(hiddenPaletteRail?.x ?? 80).toBeLessThan(40);

  await inspectorToggle.click();
  await expect(inspectorToggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("complementary", { name: "Inspector", includeHidden: true }),
  ).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Paleta", includeHidden: true }),
  ).toBeHidden();

  await paletteToggle.click();
  await expect(page.getByRole("navigation", { name: "Paleta" })).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Inspector", includeHidden: true }),
  ).toBeHidden();

  await inspectorToggle.click();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Paleta" })).toBeVisible();
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

    // Baselines: Windows (build 26200), Chromium, deviceScaleFactor 1.
    // CI E2E corre en windows-latest para coincidir.
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
