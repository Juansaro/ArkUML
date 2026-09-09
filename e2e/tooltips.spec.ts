import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectTooltipCopy(page: Page, name: string, copy: string) {
  const trigger = page.getByRole("button", { name, exact: true });
  await trigger.focus();
  const tooltip = page.getByTestId("editor-tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(copy);
  await expect(trigger).toHaveAttribute(
    "aria-describedby",
    (await tooltip.getAttribute("id")) ?? "",
  );
}

async function expectWithinViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  if (box === null || viewport === null) {
    throw new Error("No se pudo medir el tooltip");
  }
  expect(box.x).toBeGreaterThanOrEqual(7);
  expect(box.y).toBeGreaterThanOrEqual(7);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 7);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 7);
}

test.describe("tooltips del chrome", () => {
  test.use({ viewport: { width: 1024, height: 720 } });

  test("abre por foco, un solo tooltip, Escape no cierra diálogos", async ({
    page,
  }) => {
    await page.goto("/");

    await expectTooltipCopy(page, "Nuevo", "Crear un diagrama nuevo.");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("editor-tooltip")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Nuevo" })).toBeFocused();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Exportar" }).focus();
    await expect(page.getByTestId("editor-tooltip")).toBeVisible();
    await page.getByRole("button", { name: "Ayuda" }).focus();
    await expect(page.getByTestId("editor-tooltip")).toHaveCount(1);
    await expect(page.getByTestId("editor-tooltip")).toHaveText(
      "Ver ayuda y atajos.",
    );

    await page.getByRole("button", { name: "Deshacer" }).focus();
    await expect(page.getByTestId("editor-tooltip")).toHaveText(
      "Nada que deshacer (Ctrl/Cmd+Z).",
    );
    await expect(
      page.getByRole("button", { name: "Deshacer" }),
    ).toHaveAttribute("aria-disabled", "true");

    await page.getByRole("button", { name: "Include" }).focus();
    await expect(page.getByTestId("editor-tooltip")).toHaveText(
      "Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte.",
    );

    await page.getByRole("button", { name: "Acercar" }).focus();
    await expect(page.getByTestId("editor-tooltip")).toHaveText("Acercar.");

    await page.getByRole("button", { name: "Ayuda" }).click();
    await expect(page.getByRole("dialog", { name: "Ayuda" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Ayuda" })).toHaveCount(0);
  });

  test("hover abre el tooltip y no hay title en las superficies migradas", async ({
    page,
  }) => {
    await page.goto("/");
    const nuevo = page.getByRole("button", { name: "Nuevo" });
    await nuevo.hover();
    await expect(page.getByTestId("editor-tooltip")).toHaveText(
      "Crear un diagrama nuevo.",
    );
    await expect(nuevo).not.toHaveAttribute("title");
    await expect(
      page.getByRole("button", { name: "Actor" }),
    ).not.toHaveAttribute("title");
    await expect(
      page.getByRole("button", { name: "Límite del sistema" }),
    ).not.toHaveAttribute("title");
  });
});

const viewports = [
  { width: 768, height: 720 },
  { width: 1024, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

for (const viewport of viewports) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test("tooltip y trigger caben en el viewport", async ({ page }) => {
      await page.goto("/");
      if (viewport.width <= 1023) {
        await page.getByRole("button", { name: "Paleta" }).focus();
      } else {
        await page.getByRole("button", { name: "Nuevo" }).focus();
      }
      const tooltip = page.getByTestId("editor-tooltip");
      await expect(tooltip).toBeVisible();
      await expectWithinViewport(page, tooltip);

      await page.getByRole("button", { name: "Ajustar vista" }).focus();
      await expect(tooltip).toBeVisible();
      await expectWithinViewport(page, tooltip);
    });
  });
}
