import { expect, test } from "@playwright/test";

const STORAGE_KEY = "arkuml:workspace:v1";

test("reload conserva el contenido y el viewport", async ({ page }) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas.getByText("Sistema")).toBeVisible();

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();

  const viewport = page.locator(".react-flow__viewport");
  const beforePan = await viewport.getAttribute("style");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el lienzo");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(
    box.x + box.width / 2 + 90,
    box.y + box.height / 2 + 50,
  );
  await page.mouse.up({ button: "middle" });
  await expect
    .poll(async () => viewport.getAttribute("style"))
    .not.toBe(beforePan);

  await page.keyboard.press("ControlOrMeta+s");
  await expect(page.getByTestId("save-status")).toHaveAttribute(
    "data-state",
    "saved",
  );
  await expect(page.getByTestId("editor-live")).toHaveText(
    "Diagrama guardado.",
  );
  const savedViewport = await viewport.getAttribute("style");

  await page.reload();
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
  await expect(canvas.getByText("Sistema")).toBeVisible();
  await expect(page.locator(".react-flow__viewport")).toHaveAttribute(
    "style",
    savedViewport ?? "",
  );
});

test("nuevo cancelado conserva; confirmado resetea a Sistema", async ({
  page,
}) => {
  await page.goto("/");
  const canvas = page.getByTestId("diagram-canvas");

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Nuevo" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo diagrama" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Nuevo" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Crear diagrama nuevo" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(canvas.getByText("Actor", { exact: true })).toHaveCount(0);
  await expect(canvas.getByText("Sistema")).toBeVisible();
  await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();
});

test("corrupción simulada no pisa hasta confirmar", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "{not-json");
  }, STORAGE_KEY);

  await page.goto("/");
  const recovery = page.getByRole("dialog", {
    name: "No se pudo recuperar el diagrama",
  });
  await expect(recovery).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe("{not-json");

  await recovery.getByRole("button", { name: "Continuar en memoria" }).click();
  await expect(recovery).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe("{not-json");

  await page.getByRole("button", { name: "Nuevo" }).click();
  const createDialog = page.getByRole("dialog", { name: "Nuevo diagrama" });
  await expect(createDialog).toBeVisible();
  await createDialog.getByRole("button", { name: "Cancelar" }).click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe("{not-json");

  await page.reload();
  await expect(recovery).toBeVisible();
  await recovery.getByRole("button", { name: "Comenzar limpio" }).click();
  await expect(recovery).toHaveCount(0);
  await expect(
    page.getByTestId("diagram-canvas").getByText("Sistema"),
  ).toBeVisible();

  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(raw).not.toBe("{not-json");
  expect(JSON.parse(raw ?? "")).toMatchObject({
    document: {
      elements: [{ kind: "system-boundary", name: "Sistema" }],
    },
  });
});

test("storage bloqueado permite editar en memoria y muestra error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
      clear() {
        throw new Error("blocked");
      },
      key() {
        return null;
      },
      get length() {
        return 0;
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        return blocked;
      },
    });
  });

  await page.goto("/");
  const canvas = page.getByTestId("diagram-canvas");
  await expect(canvas.getByText("Sistema")).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveAttribute(
    "data-state",
    "error",
  );
  await expect(page.getByTestId("save-status")).toContainText(/memoria/i);

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveAttribute(
    "data-state",
    "error",
  );
});
