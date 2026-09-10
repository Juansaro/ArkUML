import { expect, test } from "@playwright/test";
import { downloadBytes, placeElement } from "./support.ts";

const STORAGE_KEY = "arkuml:workspace:v1";
const INVALID_MESSAGE = "El archivo no es un documento ArkUML válido.";

test.describe("archivo JSON de usuario", () => {
  test("exportar e importar restaura actor, viewport e historial vacío", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = page.getByTestId("diagram-canvas");
    await expect(canvas.getByText("Sistema")).toBeVisible();

    await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");

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
    const exportedViewport = await viewport.getAttribute("style");

    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Guardar JSON" }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(
      "Diagrama de casos de uso.arkuml.json",
    );

    const bytes = await downloadBytes(download);
    const parsed: unknown = JSON.parse(bytes.toString("utf8"));
    expect(parsed).toEqual(
      expect.objectContaining({
        format: "arkuml-usecase-json",
        formatVersion: 1,
        document: expect.objectContaining({
          schemaVersion: 1,
          kind: "use-case",
        }),
        view: expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          zoom: expect.any(Number),
        }),
      }),
    );
    expect(parsed).not.toHaveProperty("storageVersion");
    expect(parsed).not.toHaveProperty("history");

    await page.getByRole("button", { name: "Nuevo" }).click();
    const newDialog = page.getByRole("dialog", { name: "Nuevo diagrama" });
    await expect(newDialog).toBeVisible();
    await newDialog
      .getByRole("button", { name: "Crear diagrama nuevo" })
      .click();
    await expect(canvas.getByText("Actor", { exact: true })).toHaveCount(0);

    await page.getByTestId("document-file-input").setInputFiles({
      name: "Diagrama de casos de uso.arkuml.json",
      mimeType: "application/json",
      buffer: bytes,
    });
    const openDialog = page.getByRole("dialog", { name: "Abrir archivo" });
    await expect(openDialog).toBeVisible();
    await openDialog.getByRole("button", { name: "Abrir archivo" }).click();
    await expect(openDialog).toHaveCount(0);

    await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
    await expect(page.locator(".react-flow__viewport")).toHaveAttribute(
      "style",
      exportedViewport ?? "",
    );
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();

    await expect
      .poll(async () => {
        const raw = await page.evaluate(
          (key) => localStorage.getItem(key),
          STORAGE_KEY,
        );
        if (raw === null) {
          return false;
        }
        const snapshot: unknown = JSON.parse(raw);
        if (
          typeof snapshot !== "object" ||
          snapshot === null ||
          !("storageVersion" in snapshot) ||
          !("document" in snapshot)
        ) {
          return false;
        }
        const document = snapshot.document;
        if (typeof document !== "object" || document === null) {
          return false;
        }
        return JSON.stringify(document).includes("Actor");
      })
      .toBe(true);
  });

  test("JSON basura y un snapshot interno se rechazan sin mutar", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = page.getByTestId("diagram-canvas");
    await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByTestId("save-status")).toHaveAttribute(
      "data-state",
      "saved",
    );
    const saved = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(saved).not.toBeNull();

    await page.getByTestId("document-file-input").setInputFiles({
      name: "basura.json",
      mimeType: "application/json",
      buffer: Buffer.from("{not-json", "utf8"),
    });
    const invalid = page.getByRole("alertdialog", { name: INVALID_MESSAGE });
    await expect(invalid).toBeVisible();
    await invalid.getByRole("button", { name: "Cerrar" }).click();
    await expect(invalid).toHaveCount(0);
    await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
    ).toBe(saved);

    await page.getByTestId("document-file-input").setInputFiles({
      name: "workspace.json",
      mimeType: "application/json",
      buffer: Buffer.from(saved ?? "", "utf8"),
    });
    await expect(
      page.getByRole("alertdialog", { name: INVALID_MESSAGE }),
    ).toBeVisible();
    await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
    ).toBe(saved);
  });

  test("cancelar Abrir archivo no muta el diagrama", async ({ page }) => {
    await page.goto("/");
    const canvas = page.getByTestId("diagram-canvas");
    await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");

    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Guardar JSON" }).click();
    const download = await pending;
    const bytes = await downloadBytes(download);

    await page.getByRole("button", { name: "Caso de uso" }).click();
    await canvas.click({ position: { x: 280, y: 180 } });
    await expect(
      canvas.getByText("Caso de uso", { exact: true }),
    ).toBeVisible();

    await page.getByTestId("document-file-input").setInputFiles({
      name: "Diagrama de casos de uso.arkuml.json",
      mimeType: "application/json",
      buffer: bytes,
    });
    const dialog = page.getByRole("dialog", { name: "Abrir archivo" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();
    await expect(
      canvas.getByText("Caso de uso", { exact: true }),
    ).toBeVisible();
  });
});
