import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG_SIGNATURE, diagramCanvas, downloadBytes } from "./support.ts";

const STORAGE_KEY = "arkuml:workspace:v1";
const TARGET_NODE_COUNT = 100;
const STRESS_NODE_COUNT = 200;
const ACTOR_NODE_ID = "diagram-node-aaaaaaaa-0000-4000-8000-000000000002";

test.describe("presupuesto de rendimiento", { tag: "@perf" }, () => {
  test.describe.configure({ timeout: 120_000 });

  test("100/150: restore, click, drag/pan/zoom, autosave y export 2x", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      if (error.message.includes("ResizeObserver loop")) {
        return;
      }
      pageErrors.push(error.message);
    });

    await seedWorkspace(page, "perf-target.json");
    const navigationStarted = Date.now();
    await page.goto("/");
    const canvas = diagramCanvas(page);
    await expect(page.getByText("Rendimiento 100/150")).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(
      TARGET_NODE_COUNT,
    );
    const restoreMs = Date.now() - navigationStarted;
    annotate(test.info(), "restore-ms", restoreMs);

    const node = page.getByTestId(ACTOR_NODE_ID);
    await expect(node).toBeVisible();
    const rfNode = page.getByTestId(
      "rf__node-aaaaaaaa-0000-4000-8000-000000000002",
    );
    const nodeBox = await rfNode.boundingBox();
    if (nodeBox === null) {
      throw new Error("No se pudo medir el actor");
    }

    const clickStarted = Date.now();
    await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + 20);
    await page.mouse.down();
    await page.mouse.up();
    await expect(node).toHaveAttribute("data-selected", "true");
    const clickMs = Date.now() - clickStarted;
    annotate(test.info(), "click-ms", clickMs);

    await startFrameCapture(page);
    await dragFromCenter(page, node, 40, 24);
    await expect(node).toBeVisible();
    const dragFrames = await stopFrameCapture(page);
    annotate(test.info(), "drag-p95-ms", dragFrames.p95);
    annotate(test.info(), "drag-max-ms", dragFrames.max);
    annotate(test.info(), "drag-frames", dragFrames.count);

    const viewport = page.locator(".react-flow__viewport");
    const beforePan = await viewport.getAttribute("style");
    const box = await canvas.boundingBox();
    if (box === null) {
      throw new Error("No se pudo medir el lienzo");
    }
    await startFrameCapture(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(
      box.x + box.width / 2 + 80,
      box.y + box.height / 2 + 40,
      { steps: 20 },
    );
    await page.mouse.up({ button: "middle" });
    await expect
      .poll(async () => viewport.getAttribute("style"))
      .not.toBe(beforePan);
    const panFrames = await stopFrameCapture(page);
    annotate(test.info(), "pan-p95-ms", panFrames.p95);

    const beforeZoom = await viewport.getAttribute("style");
    await startFrameCapture(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -240);
    await expect
      .poll(async () => viewport.getAttribute("style"))
      .not.toBe(beforeZoom);
    const zoomFrames = await stopFrameCapture(page);
    annotate(test.info(), "zoom-p95-ms", zoomFrames.p95);

    const autosaveStarted = Date.now();
    await expect
      .poll(async () => savedUpdatedAt(page), { timeout: 10_000 })
      .not.toBe("2026-09-08T00:00:00.000Z");
    const autosaveMs = Date.now() - autosaveStarted;
    annotate(test.info(), "autosave-ms", autosaveMs);
    await expect(page.getByTestId("save-status")).toHaveAttribute(
      "data-state",
      "saved",
    );

    const exportStarted = Date.now();
    const download = await downloadExport2x(page);
    const exportMs = Date.now() - exportStarted;
    annotate(test.info(), "export-2x-ms", exportMs);
    const bytes = await downloadBytes(download);
    expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(32);

    expect(restoreMs).toBeLessThan(15_000);
    expect(clickMs).toBeLessThan(2_000);
    expect(exportMs).toBeLessThan(30_000);
    expect(pageErrors).toEqual([]);
  });

  test("200/300: restore y gesto de drag sin crash", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      if (error.message.includes("ResizeObserver loop")) {
        return;
      }
      pageErrors.push(error.message);
    });

    await seedWorkspace(page, "perf-stress.json");
    const navigationStarted = Date.now();
    await page.goto("/");
    await expect(page.getByText("Rendimiento 200/300")).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(
      STRESS_NODE_COUNT,
    );
    annotate(test.info(), "stress-restore-ms", Date.now() - navigationStarted);

    const node = page.getByTestId(ACTOR_NODE_ID);
    await expect(node).toBeVisible();
    await dragFromCenter(page, node, 32, 16);
    await expect(node).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

async function dragFromCenter(
  page: Page,
  locator: Locator,
  deltaX: number,
  deltaY: number,
): Promise<void> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el elemento a arrastrar");
  }
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 24 });
  await page.mouse.up();
}

async function seedWorkspace(
  page: Page,
  fileName: "perf-target.json" | "perf-stress.json",
): Promise<void> {
  const snapshot = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "fixtures", fileName),
    "utf8",
  );
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: snapshot },
  );
}

async function savedUpdatedAt(page: Page): Promise<string> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return "";
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("document" in parsed)
      ) {
        return "";
      }
      const document = parsed.document;
      if (
        typeof document !== "object" ||
        document === null ||
        !("metadata" in document)
      ) {
        return "";
      }
      const metadata = document.metadata;
      if (
        typeof metadata !== "object" ||
        metadata === null ||
        !("updatedAt" in metadata) ||
        typeof metadata.updatedAt !== "string"
      ) {
        return "";
      }
      return metadata.updatedAt;
    } catch {
      return "";
    }
  }, STORAGE_KEY);
}

async function downloadExport2x(page: Page) {
  await page.getByRole("button", { name: "Exportar" }).click();
  const dialog = page.getByRole("dialog", { name: "Exportar" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("radio", { name: "PNG" }).click();
  await dialog.getByRole("radio", { name: "2x" }).click();
  const pending = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Descargar" }).click();
  return pending;
}

type FrameProbe = {
  stamps: number[];
  handle: number;
};

type FrameHost = {
  requestAnimationFrame: (callback: (time: number) => void) => number;
  cancelAnimationFrame: (handle: number) => void;
  __arkumlFrames?: FrameProbe;
};

async function startFrameCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    const host = globalThis as unknown as FrameHost;
    const stamps: number[] = [];
    const state: FrameProbe = { stamps, handle: 0 };
    function loop(time: number): void {
      stamps.push(time);
      state.handle = host.requestAnimationFrame(loop);
    }
    state.handle = host.requestAnimationFrame(loop);
    host.__arkumlFrames = state;
  });
}

async function stopFrameCapture(page: Page): Promise<{
  count: number;
  p95: number;
  max: number;
}> {
  return page.evaluate(() => {
    const host = globalThis as unknown as FrameHost;
    const state = host.__arkumlFrames;
    if (state === undefined) {
      return { count: 0, p95: 0, max: 0 };
    }
    host.cancelAnimationFrame(state.handle);
    const deltas: number[] = [];
    for (let index = 1; index < state.stamps.length; index += 1) {
      const previous = state.stamps[index - 1];
      const current = state.stamps[index];
      if (previous === undefined || current === undefined) {
        continue;
      }
      deltas.push(current - previous);
    }
    deltas.sort((left, right) => left - right);
    const last = deltas.length === 0 ? 0 : (deltas[deltas.length - 1] ?? 0);
    const p95Index = Math.min(
      Math.max(deltas.length - 1, 0),
      Math.floor(deltas.length * 0.95),
    );
    return {
      count: deltas.length,
      p95: deltas[p95Index] ?? 0,
      max: last,
    };
  });
}

function annotate(
  info: { annotations: { type: string; description?: string }[] },
  type: string,
  value: number,
): void {
  info.annotations.push({ type, description: String(Math.round(value)) });
  console.log(`[perf] ${type}=${Math.round(value)}`);
}
