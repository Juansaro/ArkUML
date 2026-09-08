import { expect, test } from "@playwright/test";

test("arrastra un nodo y selecciona varios con marquee", async ({ page }) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas).toBeVisible();

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await expect(inspector).toContainText(/Selecciona un elemento/i);

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
  await expect(inspector.getByTestId("inspector-type")).toHaveText("Actor");
  await expect(inspector.getByLabel("Nombre")).toHaveValue("Actor");

  const actorNode = canvas.locator(".react-flow__node").filter({
    has: page.getByText("Actor", { exact: true }),
  });
  const before = await actorNode.getAttribute("style");
  const actorBox = await actorNode.boundingBox();
  if (actorBox === null) {
    throw new Error("No se pudo medir el actor");
  }
  await page.mouse.move(
    actorBox.x + actorBox.width / 2,
    actorBox.y + actorBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    actorBox.x + actorBox.width / 2 + 140,
    actorBox.y + actorBox.height / 2 + 30,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect
    .poll(async () => actorNode.getAttribute("style"))
    .not.toBe(before);

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 200, y: 500 } });
  await expect(canvas.getByText("Actor 2", { exact: true })).toBeVisible();

  const canvasBox = await canvas.boundingBox();
  if (canvasBox === null) {
    throw new Error("No se pudo medir el lienzo");
  }

  await page.mouse.move(canvasBox.x + 40, canvasBox.y + 430);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + 280, canvasBox.y + 560, { steps: 8 });
  await page.mouse.up();

  await expect(inspector.getByTestId("inspector-multiple")).toHaveText(
    /seleccionados/,
  );
  await expect(inspector.getByLabel("Nombre")).toHaveCount(0);

  await canvas.locator(".react-flow__pane").click({
    position: { x: 700, y: 80 },
  });
  await expect(inspector).toContainText(/Selecciona un elemento/i);
});

test("renombra desde el inspector y descarta un nombre inválido", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const name = inspector.getByLabel("Nombre");
  await expect(name).toHaveValue("Actor");

  await name.fill("Cliente");
  await name.press("Enter");
  await expect(canvas.getByText("Cliente", { exact: true })).toBeVisible();
  await expect(page.getByTestId("editor-live")).not.toHaveText(
    /entre 1 y 80 caracteres/,
  );

  await name.fill("");
  await name.press("Enter");
  await expect(page.getByTestId("editor-live")).toHaveText(
    /entre 1 y 80 caracteres/,
  );
  await expect(canvas.getByText("Cliente", { exact: true })).toBeVisible();

  await name.press("Escape");
  await expect(name).toHaveValue("Cliente");
});
