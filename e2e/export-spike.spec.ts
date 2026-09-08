import { expect, test } from "@playwright/test";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

type SpikeReport = {
  pngBase64: string;
  byteLength: number;
  width: number;
  height: number;
  hasPngSignature: boolean;
  opaquePixelCount: number;
  nodeFillDetected: boolean;
  textDetected: boolean;
  markerDetected: boolean;
};

test(
  "rasteriza texto, rectángulo y marker SVG a PNG",
  { tag: "@export-spike" },
  async ({ page }, testInfo) => {
    await page.goto("/?export-spike");
    await expect(page.getByTestId("export-spike")).toBeVisible();
    await expect(page.getByText("SPIKE")).toBeVisible();

    const raw: unknown = await page.evaluate(async () => {
      const run: unknown = Reflect.get(
        globalThis,
        "__arkumlRasterizeExportSpike",
      );
      if (typeof run !== "function") {
        throw new Error("El spike de export no está expuesto");
      }
      return (run as () => Promise<unknown>)();
    });
    if (!isSpikeReport(raw)) {
      throw new Error("El spike de export devolvió un reporte inválido");
    }
    const report = raw;

    const png = Buffer.from(report.pngBase64, "base64");
    expect(png.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(report.hasPngSignature).toBe(true);
    expect(report.byteLength).toBeGreaterThan(32);
    expect(report.width).toBeGreaterThan(0);
    expect(report.height).toBeGreaterThan(0);
    expect(report.opaquePixelCount).toBeGreaterThan(0);
    expect(report.nodeFillDetected).toBe(true);
    expect(report.textDetected || report.markerDetected).toBe(true);

    await testInfo.attach(`export-spike-${testInfo.project.name}.png`, {
      body: png,
      contentType: "image/png",
    });

    // Diferencias observadas se adjuntan; un fallo material (sin nodo y sin
    // texto/marker) debe detener TASK-008 y reabrir ADR-006.
    console.log(
      JSON.stringify({
        browser: testInfo.project.name,
        width: report.width,
        height: report.height,
        nodeFillDetected: report.nodeFillDetected,
        textDetected: report.textDetected,
        markerDetected: report.markerDetected,
      }),
    );
  },
);

function isSpikeReport(value: unknown): value is SpikeReport {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (
    !("pngBase64" in value) ||
    !("byteLength" in value) ||
    !("width" in value) ||
    !("height" in value) ||
    !("hasPngSignature" in value) ||
    !("opaquePixelCount" in value) ||
    !("nodeFillDetected" in value) ||
    !("textDetected" in value) ||
    !("markerDetected" in value)
  ) {
    return false;
  }
  return (
    typeof value.pngBase64 === "string" &&
    typeof value.byteLength === "number" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.hasPngSignature === "boolean" &&
    typeof value.opaquePixelCount === "number" &&
    typeof value.nodeFillDetected === "boolean" &&
    typeof value.textDetected === "boolean" &&
    typeof value.markerDetected === "boolean"
  );
}
