import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoAxeBlockers(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .exclude(".react-flow")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blockers = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
}

test.describe("accesibilidad @a11y", () => {
  test("axe del shell inicial sin violaciones critical/serious", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "ArkUML", level: 1 }),
    ).toBeVisible();
    await expectNoAxeBlockers(page);
  });

  test("axe con inspector, diálogo de ayuda y diálogo de exportar", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Actor" }).press("Enter");
    await page
      .getByRole("button", { name: "Colocar en el lienzo" })
      .press("Enter");
    await expect(page.getByLabel("Nombre")).toHaveValue("Actor");
    await expectNoAxeBlockers(page);

    await page.getByRole("button", { name: "Ayuda" }).press("Enter");
    await expect(page.getByRole("dialog", { name: "Ayuda" })).toBeVisible();
    await expectNoAxeBlockers(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Ayuda" })).toBeFocused();

    await page.getByRole("button", { name: "Exportar" }).press("Enter");
    await expect(page.getByRole("dialog", { name: "Exportar" })).toBeVisible();
    await expectNoAxeBlockers(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Exportar" })).toBeFocused();
  });

  test("crear, editar, conectar, borrar y deshacer solo con teclado", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Actor" }).press("Enter");
    await page
      .getByRole("button", { name: "Colocar en el lienzo" })
      .press("Enter");
    const name = page.getByLabel("Nombre");
    await expect(name).toHaveValue("Actor");
    await name.fill("Usuario");
    await page.keyboard.press("Enter");
    await expect(name).toHaveValue("Usuario");

    await page.getByRole("button", { name: "Caso de uso" }).press("Enter");
    await page
      .getByRole("button", { name: "Colocar en el lienzo" })
      .press("Enter");
    await expect(page.getByLabel("Nombre")).toHaveValue("Caso de uso");
    await page.getByLabel("Nombre").fill("Login");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Asociación" }).press("Enter");
    await page.getByLabel("Origen").selectOption({ label: "Actor Usuario" });
    await page
      .getByLabel("Destino")
      .selectOption({ label: "Caso de uso Login" });
    await page.getByRole("button", { name: "Conectar" }).press("Enter");
    await expect(page.getByTestId("editor-live")).toHaveText(
      "Se creó la asociación.",
    );
    await expect(page.getByTestId("inspector-type")).toHaveText("Asociación");
    await expectNoAxeBlockers(page);

    await page.keyboard.press("Delete");
    await expect(page.getByTestId("editor-live")).toHaveText(
      "Se eliminó la selección.",
    );
    await page.keyboard.press("ControlOrMeta+z");
    await expect(
      page.getByLabel(/Asociación entre Usuario y Login/),
    ).toBeVisible();
  });

  test("drawers a 768 px son operables por teclado", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 });
    await page.goto("/");

    const paletteToggle = page.getByRole("button", { name: "Paleta" });
    await paletteToggle.press("Enter");
    const palette = page.getByRole("navigation", { name: "Paleta" });
    await expect(palette).toBeInViewport();
    await expect(page.getByRole("button", { name: "Actor" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(paletteToggle).toBeFocused();
    await expect(
      page.getByRole("navigation", { name: "Paleta", includeHidden: true }),
    ).not.toBeInViewport();

    await paletteToggle.press("Enter");
    await page.getByRole("button", { name: "Actor" }).press("Enter");
    await page.getByRole("button", { name: "Inspector" }).press("Enter");
    await expect(
      page.getByRole("complementary", { name: "Inspector" }),
    ).toBeInViewport();
    await page
      .getByRole("button", { name: "Colocar en el lienzo" })
      .press("Enter");
    await expect(page.getByLabel("Nombre")).toHaveValue("Actor");
    await expectNoAxeBlockers(page);
  });

  test("bajo 768 px avisa y conserva el diagrama", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 720 });
    await page.goto("/");
    await page.getByRole("button", { name: "Actor" }).press("Enter");
    await page
      .getByRole("button", { name: "Colocar en el lienzo" })
      .press("Enter");
    await expect(page.getByLabel("Nombre")).toHaveValue("Actor");

    await page.setViewportSize({ width: 500, height: 720 });
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(
      /el diagrama no se borra/i,
    );
    await expect(page.getByLabel(/^Actor Actor/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ArkUML", level: 1 }),
    ).toBeVisible();
    await expectNoAxeBlockers(page);
  });
});
