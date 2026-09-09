import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8]);
const PNG_1X = { width: 704, height: 464 };
const PNG_2X = { width: 1408, height: 928 };

test.describe("exportación de producto", { tag: "@export" }, () => {
  test(
    "PNG 1x: firma, transparencia, tamaño y sin chrome de edición",
    { tag: "@export-spike" },
    async ({ page }) => {
      await page.goto("/");
      const canvas = page.getByTestId("diagram-canvas");
      await expect(canvas.getByText("Sistema")).toBeVisible();
      await expect(
        canvas.locator(".react-flow__resize-control").first(),
      ).toBeVisible();

      const download = await downloadExport(page, { format: "png", scale: 1 });
      expect(download.suggestedFilename()).toBe("Diagrama de casos de uso.png");

      const bytes = await fileBytes(download);
      expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
      expect(bytes.byteLength).toBeGreaterThan(32);

      const report = await inspectRaster(page, bytes, "image/png");
      expect(report.width).toBe(PNG_1X.width);
      expect(report.height).toBe(PNG_1X.height);
      expect(report.opaqueCount).toBeGreaterThan(100);
      expect(report.corners.every((pixel) => pixel.a < 16)).toBe(true);
      expect(report.focusBlueCount).toBe(0);
    },
  );

  test("JPG 1x: firma JPEG, fondo opaco y mismas dimensiones CSS", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByTestId("diagram-canvas").getByText("Sistema"),
    ).toBeVisible();

    const download = await downloadExport(page, { format: "jpg", scale: 1 });
    expect(download.suggestedFilename()).toBe("Diagrama de casos de uso.jpg");

    const bytes = await fileBytes(download);
    expect(bytes.subarray(0, 2).equals(JPEG_SIGNATURE)).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(32);

    const report = await inspectRaster(page, bytes, "image/jpeg");
    expect(report.width).toBe(PNG_1X.width);
    expect(report.height).toBe(PNG_1X.height);
    expect(
      report.corners.every(
        (pixel) =>
          pixel.a === 255 && pixel.r > 240 && pixel.g > 240 && pixel.b > 240,
      ),
    ).toBe(true);
  });

  test("PNG 2x duplica las dimensiones sin mutar el zoom visible", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = page.getByTestId("diagram-canvas");
    await expect(canvas.getByText("Sistema")).toBeVisible();
    const viewport = page.locator(".react-flow__viewport");
    const before = await viewport.getAttribute("style");

    const download = await downloadExport(page, { format: "png", scale: 2 });
    const bytes = await fileBytes(download);
    expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);

    const report = await inspectRaster(page, bytes, "image/png");
    expect(report.width).toBe(PNG_2X.width);
    expect(report.height).toBe(PNG_2X.height);

    await expect(viewport).toHaveAttribute("style", before ?? "");
    await expect(
      page.getByRole("status", { name: "Estado del editor" }),
    ).toHaveText(/Zoom 100%/);
  });

  test("incluye el diagrama aunque esté fuera del viewport", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = page.getByTestId("diagram-canvas");
    await expect(canvas.getByText("Sistema")).toBeVisible();

    const box = await canvas.boundingBox();
    if (box === null) {
      throw new Error("No se pudo medir el lienzo");
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(
      box.x + box.width / 2 + 900,
      box.y + box.height / 2 + 600,
      {
        steps: 12,
      },
    );
    await page.mouse.up({ button: "middle" });

    const download = await downloadExport(page, { format: "png", scale: 1 });
    const bytes = await fileBytes(download);
    const report = await inspectRaster(page, bytes, "image/png");
    expect(report.width).toBe(PNG_1X.width);
    expect(report.height).toBe(PNG_1X.height);
    expect(report.opaqueCount).toBeGreaterThan(100);
    expect(report.corners.every((pixel) => pixel.a < 16)).toBe(true);
  });
});

async function downloadExport(
  page: Page,
  options: { format: "png" | "jpg"; scale: 1 | 2 },
) {
  await page.getByRole("button", { name: "Exportar" }).click();
  const dialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("radio", { name: options.format === "jpg" ? "JPG" : "PNG" })
    .click();
  await dialog
    .getByRole("radio", { name: options.scale === 2 ? "2x" : "1x" })
    .click();

  const pending = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Descargar" }).click();
  return pending;
}

async function fileBytes(download: {
  path: () => Promise<string | null>;
}): Promise<Buffer> {
  const filePath = await download.path();
  if (filePath === null) {
    throw new Error("La descarga no produjo un archivo");
  }
  return readFile(filePath);
}

type RasterPixel = { r: number; g: number; b: number; a: number };

type RasterReport = {
  width: number;
  height: number;
  corners: RasterPixel[];
  opaqueCount: number;
  focusBlueCount: number;
};

type BrowserCanvas = {
  width: number;
  height: number;
  getContext: (id: string) => BrowserCanvasContext | null;
};

type BrowserCanvasContext = {
  drawImage: (image: unknown, x: number, y: number) => void;
  getImageData: (
    x: number,
    y: number,
    w: number,
    h: number,
  ) => { data: Uint8ClampedArray };
};

type BrowserBitmap = {
  width: number;
  height: number;
  close: () => void;
};

async function inspectRaster(
  page: Page,
  bytes: Buffer,
  mime: "image/png" | "image/jpeg",
): Promise<RasterReport> {
  const base64 = bytes.toString("base64");
  return page.evaluate(
    async ({ payload, type }) => {
      const scope = globalThis as unknown as {
        fetch: (url: string) => Promise<{ blob: () => Promise<unknown> }>;
        createImageBitmap: (blob: unknown) => Promise<BrowserBitmap>;
        document: { createElement: (tag: string) => BrowserCanvas };
      };
      const response = await scope.fetch(`data:${type};base64,${payload}`);
      const blob = await response.blob();
      const bitmap = await scope.createImageBitmap(blob);
      const canvas = scope.document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (context === null) {
        throw new Error("No se pudo leer el raster exportado");
      }
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const { width, height } = canvas;
      const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ].map((point) => {
        const pixel = context.getImageData(
          point[0] ?? 0,
          point[1] ?? 0,
          1,
          1,
        ).data;
        return {
          r: pixel[0] ?? 0,
          g: pixel[1] ?? 0,
          b: pixel[2] ?? 0,
          a: pixel[3] ?? 0,
        };
      });
      const image = context.getImageData(0, 0, width, height);
      let opaqueCount = 0;
      let focusBlueCount = 0;
      for (let index = 0; index < image.data.length; index += 4) {
        const r = image.data[index] ?? 0;
        const g = image.data[index + 1] ?? 0;
        const b = image.data[index + 2] ?? 0;
        const a = image.data[index + 3] ?? 0;
        if (a <= 8) {
          continue;
        }
        opaqueCount += 1;
        if (
          Math.abs(r - 29) <= 24 &&
          Math.abs(g - 78) <= 24 &&
          Math.abs(b - 216) <= 24
        ) {
          focusBlueCount += 1;
        }
      }
      return { width, height, corners, opaqueCount, focusBlueCount };
    },
    { payload: base64, type: mime },
  );
}
