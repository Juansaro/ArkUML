import { expect, test } from "@playwright/test";
import { diagramCanvas } from "./support.ts";

const STORAGE_KEY = "arkuml:workspace:v1";

test("está en el DOM a 1024×720 y ausente a 800×720", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 720 });
  await page.goto("/");
  await expect(page.getByTestId("diagram-minimap")).toBeVisible();
  await expect(page.getByTestId("diagram-minimap")).toHaveAttribute(
    "aria-label",
    "Mapa del diagrama",
  );

  await page.setViewportSize({ width: 800, height: 720 });
  await expect(page.getByTestId("diagram-minimap")).toHaveCount(0);
});

test("arrastrar el mapa mueve el viewport sin mutar el documento ni el historial", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 720 });
  await page.goto("/");

  const canvas = diagramCanvas(page);
  await expect(canvas.getByTestId("system-boundary-rect")).toBeVisible();
  const minimap = page.getByTestId("diagram-minimap");
  await expect(minimap).toBeVisible();

  await page.keyboard.press("ControlOrMeta+s");
  const beforeRaw = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(beforeRaw).not.toBeNull();
  const before = parseSnapshot(beforeRaw);

  const viewport = page.locator(".react-flow__viewport");
  const styleBefore = await viewport.getAttribute("style");
  const box = await minimap.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el minimap");
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 48,
    box.y + box.height / 2 + 32,
    { steps: 12 },
  );
  await page.mouse.up();

  await expect
    .poll(async () => viewport.getAttribute("style"))
    .not.toBe(styleBefore);

  await page.keyboard.press("ControlOrMeta+s");
  const afterRaw = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  const after = parseSnapshot(afterRaw);
  expect(Object.keys(after.snapshot).sort()).toEqual([
    "activeDocumentId",
    "documents",
    "storageVersion",
  ]);
  expect(after.document.schemaVersion).toBe(2);
  expect(after.document).toEqual(before.document);
  expect(after.view).not.toEqual(before.view);

  const styleAfterPan = await viewport.getAttribute("style");
  await page.keyboard.press("ControlOrMeta+z");
  await expect(viewport).toHaveAttribute("style", styleAfterPan ?? "");
});

test("el mapa muestra el plano completo y se duplica al ampliar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const canvas = diagramCanvas(page);
  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 240, y: 180 } });

  const minimap = page.getByTestId("diagram-minimap");
  const expand = page.getByRole("button", { name: "Ampliar mapa" });
  const expandChrome = page.getByTestId("minimap-expand");
  await expect(expandChrome).toHaveCSS("opacity", "0");
  await minimap.hover();
  await expect(expandChrome).toHaveCSS("opacity", "1");
  await expect(expand).toBeVisible();

  await expect(minimap.locator('[data-minimap-kind="actor"]')).toHaveCount(1);
  const svg = minimap.locator("svg.react-flow__minimap-svg");
  const mask = minimap.locator(".react-flow__minimap-mask");
  await expect(mask).toBeVisible();
  const viewBoxAtStart = await svg.getAttribute("viewBox");
  const maskAtStart = await mask.getAttribute("d");
  const startBox = parseViewBox(viewBoxAtStart);
  const startHole = parseMaskHole(maskAtStart);
  expect(startBox.y + startBox.height).toBeGreaterThan(500);

  await page.getByRole("button", { name: "Acercar" }).click();
  await page.getByRole("button", { name: "Acercar" }).click();
  await expect.poll(async () => mask.getAttribute("d")).not.toBe(maskAtStart);
  const zoomedInHole = parseMaskHole(await mask.getAttribute("d"));
  expect(zoomedInHole.width * zoomedInHole.height).toBeLessThan(
    startHole.width * startHole.height,
  );

  const viewBoxBeforePan = await svg.getAttribute("viewBox");
  const canvasBox = await canvas.boundingBox();
  if (canvasBox === null) {
    throw new Error("No se pudo medir el lienzo");
  }
  await page.mouse.move(
    canvasBox.x + canvasBox.width / 2,
    canvasBox.y + canvasBox.height / 2,
  );
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(
    canvasBox.x + canvasBox.width / 2 + 80,
    canvasBox.y + canvasBox.height / 2 + 40,
    { steps: 8 },
  );
  await page.mouse.up({ button: "middle" });
  await expect
    .poll(async () => svg.getAttribute("viewBox"))
    .not.toBe(viewBoxBeforePan);

  await page.getByRole("button", { name: "Alejar" }).click();
  await page.getByRole("button", { name: "Alejar" }).click();
  await page.getByRole("button", { name: "Alejar" }).click();
  await expect(mask).toBeVisible();
  const zoomedOutHole = parseMaskHole(await mask.getAttribute("d"));
  expect(zoomedOutHole.width * zoomedOutHole.height).toBeGreaterThan(
    zoomedInHole.width * zoomedInHole.height,
  );
  await expect(minimap.locator('[data-minimap-kind="actor"]')).toHaveCount(1);

  await minimap.hover();
  const before = await minimap.boundingBox();
  if (before === null) {
    throw new Error("No se pudo medir el minimap");
  }
  await expand.click();
  await expect(minimap).toHaveAttribute("data-expanded", "true");
  const after = await minimap.boundingBox();
  if (after === null) {
    throw new Error("No se pudo medir el minimap ampliado");
  }
  expect(after.width).toBe(before.width * 2);
  expect(after.height).toBe(before.height * 2);
  await minimap.hover();
  await page.getByRole("button", { name: "Reducir mapa" }).click();
  await expect(minimap).toHaveAttribute("data-expanded", "false");

  const viewBoxAfterZoom = await minimap
    .locator("svg.react-flow__minimap-svg")
    .getAttribute("viewBox");
  const zoomParts = (viewBoxAfterZoom ?? "").split(" ").map(Number);
  expect((zoomParts[1] ?? 0) + (zoomParts[3] ?? 0)).toBeGreaterThan(500);

  const canvasViewport = page.locator(".react-flow__viewport");
  const styleBefore = await canvasViewport.getAttribute("style");
  const box = await minimap.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el minimap");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 40,
    box.y + box.height / 2 + 24,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect
    .poll(async () => canvasViewport.getAttribute("style"))
    .not.toBe(styleBefore);
});

function parseViewBox(value: string | null): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const parts = (value ?? "").split(/[\s,]+/).map(Number);
  return {
    x: parts[0] ?? Number.NaN,
    y: parts[1] ?? Number.NaN,
    width: parts[2] ?? Number.NaN,
    height: parts[3] ?? Number.NaN,
  };
}

function parseMaskHole(path: string | null): { width: number; height: number } {
  const matches = [
    ...(path ?? "").matchAll(/M(-?[\d.]+),(-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)/g),
  ];
  const hole = matches.at(-1);
  return {
    width: Number(hole?.[3] ?? Number.NaN),
    height: Number(hole?.[4] ?? Number.NaN),
  };
}

function parseSnapshot(raw: string | null): {
  snapshot: Record<string, unknown>;
  document: { schemaVersion: number };
  view: unknown;
} {
  if (raw === null) {
    throw new Error("Falta el workspace");
  }
  const snapshot: unknown = JSON.parse(raw);
  if (typeof snapshot !== "object" || snapshot === null) {
    throw new Error("Workspace inválido");
  }
  const record = snapshot as Record<string, unknown>;
  const documents = record.documents;
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("Falta schemaVersion");
  }
  const entry = documents[0];
  if (typeof entry !== "object" || entry === null) {
    throw new Error("Falta schemaVersion");
  }
  const entryRecord = entry as Record<string, unknown>;
  const document = entryRecord.document;
  if (
    typeof document !== "object" ||
    document === null ||
    !("schemaVersion" in document) ||
    typeof document.schemaVersion !== "number"
  ) {
    throw new Error("Falta schemaVersion");
  }
  return {
    snapshot: record,
    document: document as { schemaVersion: number },
    view: entryRecord.view,
  };
}
