import { expect, test } from "@playwright/test";
import {
  activeWorkspaceViewX,
  canvasElementName,
  createNewDiagram,
} from "./support.ts";

const STORAGE_KEY = "arkuml:workspace:v1";

test(
  "reload conserva el contenido y el viewport",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto("/");

    const canvas = page.getByTestId("diagram-canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();

    await page.getByRole("button", { name: "Actor" }).click();
    await canvas.click({ position: { x: 80, y: 480 } });
    await expect(canvasElementName(page, "Actor")).toBeVisible();

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
      { steps: 12 },
    );
    await page.mouse.up({ button: "middle" });
    await expect
      .poll(async () => viewport.getAttribute("style"))
      .not.toBe(beforePan);

    await expect
      .poll(async () => {
        await page.keyboard.press("ControlOrMeta+s");
        const raw = await page.evaluate(
          (key) => localStorage.getItem(key),
          STORAGE_KEY,
        );
        return activeWorkspaceViewX(raw);
      })
      .not.toBe(0);

    await expect(page.getByTestId("save-status")).toHaveAttribute(
      "data-state",
      "saved",
    );
    await expect(page.getByTestId("editor-live")).toHaveText(
      "Diagrama guardado.",
    );
    const savedViewport = await viewport.getAttribute("style");

    await page.reload();
    await expect(canvasElementName(page, "Actor")).toBeVisible();
    await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();
    await expect(page.locator(".react-flow__viewport")).toHaveAttribute(
      "style",
      savedViewport ?? "",
    );
  },
);

test(
  "nuevo añade un diagrama y conserva el anterior",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto("/");
    const canvas = page.getByTestId("diagram-canvas");

    await page.getByRole("button", { name: "Actor" }).click();
    await canvas.click({ position: { x: 80, y: 480 } });
    await expect(canvasElementName(page, "Actor")).toBeVisible();

    await createNewDiagram(page, "Casos de uso");
    await expect(canvasElementName(page, "Actor")).toHaveCount(0);
    await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();

    await page.getByRole("combobox", { name: "Diagrama activo" }).click();
    await expect(page.getByRole("option")).toHaveCount(2);
    await page
      .getByRole("option")
      .nth(0)
      .click({ position: { x: 12, y: 16 } });
    await expect(canvasElementName(page, "Actor")).toBeVisible();

    await createNewDiagram(page, "Secuencia");
    await expect
      .poll(async () => {
        await page.keyboard.press("ControlOrMeta+s");
        const raw = await page.evaluate(
          (key) => localStorage.getItem(key),
          STORAGE_KEY,
        );
        if (raw === null) {
          return 0;
        }
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          !("documents" in parsed) ||
          !Array.isArray(parsed.documents)
        ) {
          return 0;
        }
        return parsed.documents.length;
      })
      .toBe(3);

    await page.reload();
    await expect(page.getByTestId("diagram-canvas")).toBeVisible();
    await page.getByRole("combobox", { name: "Diagrama activo" }).click();
    const options = page.getByRole("option");
    await expect(options).toHaveCount(3);
    await expect(options.filter({ hasText: "Casos de uso" })).toHaveCount(2);
    await expect(options.filter({ hasText: "Secuencia" })).toHaveCount(1);
  },
);

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

  await createNewDiagram(page, "Casos de uso");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe("{not-json");

  await page.reload();
  await expect(recovery).toBeVisible();
  await recovery.getByRole("button", { name: "Comenzar limpio" }).click();
  await expect(recovery).toHaveCount(0);
  await expect(page.getByTestId("system-boundary-rect")).toBeVisible();

  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(raw).not.toBe("{not-json");
  expect(JSON.parse(raw ?? "")).toMatchObject({
    storageVersion: 2,
    documents: [
      {
        document: {
          elements: [{ kind: "system-boundary", name: "Sistema" }],
        },
      },
    ],
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
  await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveAttribute(
    "data-state",
    "error",
  );
  await expect(page.getByTestId("save-status")).toContainText(/memoria/i);

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvasElementName(page, "Actor")).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveAttribute(
    "data-state",
    "error",
  );
});
