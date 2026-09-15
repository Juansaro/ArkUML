import { expect, test } from "@playwright/test";
import { canvasElementName } from "./support.ts";

test.describe("selector de diagramas", () => {
  test("abre, filtra, cambia, añade y borra", async ({ page }) => {
    await page.goto("/");
    const canvas = page.getByTestId("diagram-canvas");
    await expect(canvas).toBeVisible();

    const switcher = page.getByRole("combobox", { name: "Diagrama activo" });
    await expect(switcher).toBeVisible();
    await expect(switcher).toHaveText(/Diagrama de casos de uso/);
    await expect(switcher).toHaveText(/Casos de uso/);

    await page.getByRole("button", { name: "Actor" }).click();
    await canvas.click({ position: { x: 80, y: 480 } });
    await expect(canvasElementName(page, "Actor")).toBeVisible();
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeEnabled();

    await page.getByRole("button", { name: "Nuevo" }).click();
    const newDialog = page.getByRole("dialog", { name: "Nuevo diagrama" });
    await expect(newDialog).toBeVisible();
    await newDialog.getByRole("radio", { name: "Casos de uso" }).click();
    await newDialog.getByRole("button", { name: "Crear diagrama nuevo" }).click();
    await expect(newDialog).toHaveCount(0);
    await expect(canvasElementName(page, "Actor")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();

    await switcher.click();
    const search = page.getByRole("searchbox", { name: "Buscar diagrama" });
    await expect(search).toBeVisible();
    await search.click();
    const options = page.getByRole("option");
    await expect(options).toHaveCount(2);

    await search.fill("zzz");
    await expect(page.getByText("Sin coincidencias.")).toBeVisible();
    await expect(options).toHaveCount(0);

    await search.fill("casos");
    await expect(options).toHaveCount(2);

    await options.nth(0).click({ position: { x: 12, y: 16 } });
    await expect(canvasElementName(page, "Actor")).toBeVisible();
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeEnabled();
    await expect(switcher).toHaveAttribute("aria-expanded", "false");

    await page.getByRole("button", { name: "Ayuda" }).click();
    await expect(page.getByRole("dialog", { name: "Ayuda" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Ayuda" })).toHaveCount(0);

    await switcher.click();
    await expect(search).toBeVisible();
    await search.click();
    await page.keyboard.press("Escape");
    await expect(switcher).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("dialog", { name: "Ayuda" })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Exportar" })).toHaveCount(0);

    await switcher.click();
    await expect(options).toHaveCount(2);
    await options
      .nth(1)
      .getByRole("button", { name: "Eliminar diagrama" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Eliminar diagrama" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Eliminar diagrama" }).click();
    await expect(dialog).toHaveCount(0);

    await switcher.click();
    await expect(options).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Eliminar diagrama" }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
  });

  test("combobox usable en compacto", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 });
    await page.goto("/");
    const switcher = page.getByRole("combobox", { name: "Diagrama activo" });
    const nuevo = page.getByRole("button", { name: "Nuevo" });
    await expect(switcher).toBeVisible();
    await expect(nuevo).toBeVisible();
    const switcherBox = await switcher.boundingBox();
    const nuevoBox = await nuevo.boundingBox();
    expect(switcherBox).not.toBeNull();
    expect(nuevoBox).not.toBeNull();
    expect((switcherBox?.x ?? 0) + (switcherBox?.width ?? 0)).toBeLessThan(
      (nuevoBox?.x ?? 0) + 1,
    );
    expect(switcherBox?.height ?? 0).toBeGreaterThanOrEqual(32);
    await switcher.click();
    await expect(
      page.getByRole("searchbox", { name: "Buscar diagrama" }),
    ).toBeVisible();
  });
});
