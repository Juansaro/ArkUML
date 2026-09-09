import { expect, test, type Locator, type Page } from "@playwright/test";
import { diagramCanvas, diagramElement } from "./support.ts";

const STORAGE_KEY = "arkuml:workspace:v1";

test("muestra guías al alinear un actor y las quita al soltar", async ({
  page,
}) => {
  await seedWorkspace(page, {
    anclaY: 420,
    arrastreY: 420,
    arrastreX: 220,
  });
  await page.goto("/");

  const canvas = diagramCanvas(page);
  await expect(canvas.getByText("Arrastre", { exact: true })).toBeVisible();
  await expect(canvas.getByTestId("alignment-guides")).toHaveCount(0);

  const arrastre = diagramElement(page, "actor", "Arrastre");
  const before = await arrastre.boundingBox();
  if (before === null) {
    throw new Error("No se pudo medir el actor");
  }

  await dragWithoutRelease(page, arrastre, -40, 0);
  const guides = canvas.getByTestId("alignment-guides");
  await expect(guides).toHaveCount(1);
  await expect(guides).toHaveAttribute("aria-hidden", "true");

  await page.mouse.up();
  await expect(guides).toHaveCount(0);

  await page.keyboard.press("ControlOrMeta+s");
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(raw).not.toBeNull();
  const snapshot: unknown = JSON.parse(raw ?? "");
  expect(snapshotKeys(snapshot).sort()).toEqual([
    "document",
    "storageVersion",
    "view",
  ]);
  expect(documentSchemaVersion(snapshot)).toBe(1);

  await page.keyboard.press("ControlOrMeta+z");
  await expect
    .poll(async () => arrastre.boundingBox())
    .toMatchObject({ x: before.x, y: before.y });
});

test("a 8 px del umbral no muestra guía durante el drag", async ({ page }) => {
  await seedWorkspace(page, {
    anclaY: 420,
    arrastreY: 428,
    arrastreX: 220,
  });
  await page.goto("/");

  const arrastre = diagramElement(page, "actor", "Arrastre");
  await expect(arrastre).toBeVisible();
  await dragWithoutRelease(page, arrastre, -24, 0);
  await expect(diagramCanvas(page).getByTestId("alignment-guides")).toHaveCount(
    0,
  );
  await page.mouse.up();
  await expect(diagramCanvas(page).getByTestId("alignment-guides")).toHaveCount(
    0,
  );
});

test("resize de boundary y nudge no activan guías", async ({ page }) => {
  await seedWorkspace(page, {
    anclaY: 420,
    arrastreY: 420,
    arrastreX: 220,
  });
  await page.goto("/");

  const canvas = diagramCanvas(page);
  const handle = canvas.locator(
    ".react-flow__resize-control.handle.bottom.right",
  );
  await expect(handle).toBeVisible();

  const handleBox = await handle.boundingBox();
  if (handleBox === null) {
    throw new Error("No se pudo medir el handle de resize");
  }
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 48,
    handleBox.y + handleBox.height / 2 + 32,
    { steps: 12 },
  );
  await expect(canvas.getByTestId("alignment-guides")).toHaveCount(0);
  await page.mouse.up();
  await expect(canvas.getByTestId("alignment-guides")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await canvas
    .getByTestId("diagram-node-aaaaaaaa-0000-4000-8000-000000000002")
    .getByTestId("actor-figure")
    .click();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(canvas.getByTestId("alignment-guides")).toHaveCount(0);
});

type SeedOptions = {
  anclaY: number;
  arrastreY: number;
  arrastreX: number;
};

async function seedWorkspace(page: Page, options: SeedOptions): Promise<void> {
  const snapshot = {
    storageVersion: 1,
    document: {
      schemaVersion: 1,
      id: "aaaaaaaa-0000-4000-8000-000000000000",
      kind: "use-case",
      metadata: {
        title: "Guías",
        createdAt: "2026-09-09T00:00:00.000Z",
        updatedAt: "2026-09-09T00:00:00.000Z",
      },
      elements: [
        {
          id: "aaaaaaaa-0000-4000-8000-000000000001",
          kind: "system-boundary",
          name: "Sistema",
          geometry: { x: 0, y: 0, width: 640, height: 400 },
        },
        {
          id: "aaaaaaaa-0000-4000-8000-000000000002",
          kind: "actor",
          name: "Ancla",
          geometry: { x: 40, y: options.anclaY, width: 72, height: 112 },
        },
        {
          id: "aaaaaaaa-0000-4000-8000-000000000003",
          kind: "actor",
          name: "Arrastre",
          geometry: {
            x: options.arrastreX,
            y: options.arrastreY,
            width: 72,
            height: 112,
          },
        },
      ],
      relationships: [],
    },
    view: { x: 80, y: -24, zoom: 1 },
  };

  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify(snapshot) },
  );
}

async function dragWithoutRelease(
  page: Page,
  locator: Locator,
  deltaX: number,
  deltaY: number,
): Promise<void> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error("No se pudo medir el elemento a arrastrar");
  }
  const startX = box.x + Math.min(16, box.width / 4);
  const startY = box.y + box.height * 0.35;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 12 });
}

function snapshotKeys(value: unknown): string[] {
  if (typeof value !== "object" || value === null) {
    return [];
  }
  return Object.keys(value);
}

function documentSchemaVersion(value: unknown): number | undefined {
  if (typeof value !== "object" || value === null || !("document" in value)) {
    return undefined;
  }
  const document = value.document;
  if (
    typeof document !== "object" ||
    document === null ||
    !("schemaVersion" in document) ||
    typeof document.schemaVersion !== "number"
  ) {
    return undefined;
  }
  return document.schemaVersion;
}
