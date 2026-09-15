import { expect, test } from "@playwright/test";
import {
  downloadBytes,
  canvasElementName,
  createNewDiagram,
  diagramCanvas,
  placeElement,
} from "./support.ts";

const STORAGE_KEY = "arkuml:workspace:v1";
const INVALID_MESSAGE = "El archivo no es un documento ArkUML válido.";

const LEGACY_V1_FILE = {
  format: "arkuml-usecase-json",
  formatVersion: 1,
  document: {
    schemaVersion: 1,
    id: "00000000-0000-4000-8000-0000000000a1",
    kind: "use-case",
    metadata: {
      title: "Importado 1.x",
      createdAt: "2026-09-07T12:00:00.000Z",
      updatedAt: "2026-09-07T12:00:00.000Z",
    },
    elements: [
      {
        id: "00000000-0000-4000-8000-0000000000a2",
        kind: "system-boundary",
        name: "Sistema",
        geometry: { x: 0, y: 0, width: 640, height: 400 },
      },
      {
        id: "00000000-0000-4000-8000-0000000000a3",
        kind: "actor",
        name: "Actor 1.x",
        geometry: { x: 8, y: 40, width: 48, height: 96 },
      },
    ],
    relationships: [],
  },
  view: { x: 0, y: 0, zoom: 1 },
};

test.describe("archivo JSON de usuario", () => {
  test("exportar e importar 3.x use-case añade, restaura actor y viewport e historial vacío", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = diagramCanvas(page);
    await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();

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
        format: "arkuml-document-json",
        formatVersion: 3,
        document: expect.objectContaining({
          schemaVersion: 3,
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

    await createNewDiagram(page, "Casos de uso");
    await expect(canvasElementName(page, "Actor")).toHaveCount(0);
    await page.keyboard.press("ControlOrMeta+s");

    await page.getByTestId("document-file-input").setInputFiles({
      name: "Diagrama de casos de uso.arkuml.json",
      mimeType: "application/json",
      buffer: bytes,
    });
    await expect(
      page.getByRole("dialog", { name: "Abrir archivo" }),
    ).toHaveCount(0);

    await expect(canvasElementName(page, "Actor")).toBeVisible();
    await expect(page.locator(".react-flow__viewport")).toHaveAttribute(
      "style",
      exportedViewport ?? "",
    );
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();

    const switcher = page.getByRole("combobox", { name: "Diagrama activo" });
    await switcher.click();
    await expect(page.getByRole("option")).toHaveCount(3);
    await page.keyboard.press("Escape");

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
          !("documents" in snapshot)
        ) {
          return false;
        }
        return JSON.stringify(snapshot.documents).includes("Actor");
      })
      .toBe(true);
  });

  test("exportar e importar 3.x secuencia añade y deja el diagrama editable", async ({
    page,
  }) => {
    await page.goto("/");
    await createNewDiagram(page, "Secuencia");
    const canvas = diagramCanvas(page);
    await expect(page.getByRole("button", { name: "Lifeline" })).toBeVisible();

    await page.getByRole("button", { name: "Lifeline" }).click();
    await canvas.click({ position: { x: 160, y: 80 } });
    await expect(canvasElementName(page, "Lifeline")).toBeVisible();

    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Guardar JSON" }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(
      "Diagrama de secuencia.arkuml.json",
    );

    const bytes = await downloadBytes(download);
    const parsed: unknown = JSON.parse(bytes.toString("utf8"));
    expect(parsed).toEqual(
      expect.objectContaining({
        format: "arkuml-document-json",
        formatVersion: 3,
        document: expect.objectContaining({
          schemaVersion: 3,
          kind: "sequence",
        }),
      }),
    );

    await page.getByTestId("document-file-input").setInputFiles({
      name: "Diagrama de secuencia.arkuml.json",
      mimeType: "application/json",
      buffer: bytes,
    });
    await expect(canvasElementName(page, "Lifeline")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lifeline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Actor" })).toHaveCount(0);

    await page.getByRole("button", { name: "Lifeline" }).click();
    await canvas.click({ position: { x: 420, y: 80 } });
    await expect(canvasElementName(page, "Lifeline 2")).toBeVisible();

    const switcher = page.getByRole("combobox", { name: "Diagrama activo" });
    await switcher.click();
    await expect(page.getByRole("option")).toHaveCount(3);
  });

  test("importar arkuml-usecase-json 1.x migra y añade", async ({ page }) => {
    await page.goto("/");
    await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");

    await page.getByTestId("document-file-input").setInputFiles({
      name: "Importado 1.x.arkuml.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(LEGACY_V1_FILE), "utf8"),
    });

    await expect(canvasElementName(page, "Actor 1.x")).toBeVisible();
    await expect(page.getByRole("button", { name: "Actor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();

    const switcher = page.getByRole("combobox", { name: "Diagrama activo" });
    await switcher.click();
    await expect(page.getByRole("option")).toHaveCount(2);
    await page
      .getByRole("option")
      .nth(0)
      .click({ position: { x: 12, y: 16 } });
    await expect(canvasElementName(page, "Actor")).toBeVisible();
  });

  test("JSON basura y un snapshot interno se rechazan sin mutar", async ({
    page,
  }) => {
    await page.goto("/");
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
    await expect(canvasElementName(page, "Actor")).toBeVisible();
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
    await expect(canvasElementName(page, "Actor")).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
    ).toBe(saved);
  });

  test("importar no sustituye el diagrama anterior", async ({ page }) => {
    await page.goto("/");
    const canvas = diagramCanvas(page);
    await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");

    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Guardar JSON" }).click();
    const download = await pending;
    const bytes = await downloadBytes(download);

    await page.getByRole("button", { name: "Caso de uso" }).click();
    await canvas.click({ position: { x: 280, y: 180 } });
    await expect(canvasElementName(page, "Caso de uso")).toBeVisible();

    await page.getByTestId("document-file-input").setInputFiles({
      name: "Diagrama de casos de uso.arkuml.json",
      mimeType: "application/json",
      buffer: bytes,
    });
    await expect(
      page.getByRole("dialog", { name: "Abrir archivo" }),
    ).toHaveCount(0);
    await expect(canvasElementName(page, "Actor")).toBeVisible();
    await expect(canvasElementName(page, "Caso de uso")).toHaveCount(0);

    const switcher = page.getByRole("combobox", { name: "Diagrama activo" });
    await switcher.click();
    await expect(page.getByRole("option")).toHaveCount(2);
    await page
      .getByRole("option")
      .nth(0)
      .click({ position: { x: 12, y: 16 } });
    await expect(canvasElementName(page, "Actor")).toBeVisible();
    await expect(canvasElementName(page, "Caso de uso")).toBeVisible();
  });
});
