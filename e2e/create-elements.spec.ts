import { expect, test } from "@playwright/test";

test("crea cada elemento UML y cancela la herramienta con Escape", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();

  const boundaryTool = page.getByRole("button", { name: "Límite del sistema" });
  await expect(boundaryTool).toHaveAttribute("aria-disabled", "true");
  await boundaryTool.focus();
  await expect(page.getByTestId("editor-tooltip")).toHaveText(
    /admite uno solo/i,
  );

  await page.getByRole("button", { name: "Actor" }).click();
  await expect(page.getByRole("button", { name: "Actor" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
  await expect(page.getByTestId("editor-live")).toHaveText("Se creó Actor.");
  await expect(page.getByRole("button", { name: "Actor" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.getByRole("button", { name: "Caso de uso" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Caso de uso" }),
  ).toHaveAttribute("aria-pressed", "true");
  await canvas.click({ position: { x: 240, y: 180 } });
  await expect(canvas.getByText("Caso de uso", { exact: true })).toBeVisible();
  await expect(page.getByTestId("editor-live")).toHaveText(
    "Se creó Caso de uso.",
  );

  await page.getByRole("button", { name: "Actor" }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Actor" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await canvas.click({ position: { x: 100, y: 520 } });
  await expect(canvas.getByText("Actor 2")).toHaveCount(0);

  await expect(boundaryTool).toHaveAttribute("aria-disabled", "true");
  await expect(canvas.getByTestId("system-boundary-rect")).toHaveCount(1);
});
