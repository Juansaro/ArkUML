import { expect, test, type Locator, type Page } from "@playwright/test";
import { canvasElementName, selectedEndpoint } from "./support.ts";

async function connectHandles(
  page: Page,
  source: Locator,
  target: Locator,
): Promise<void> {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (sourceBox === null || targetBox === null) {
    throw new Error("No se pudo medir un handle");
  }
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 16 },
  );
  await page.mouse.up();
}

async function createTwoUseCases(page: Page) {
  const canvas = page.getByTestId("diagram-canvas");
  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 220, y: 160 } });
  await expect(canvasElementName(page, "Caso de uso")).toBeVisible();

  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 430, y: 160 } });
  await expect(canvasElementName(page, "Caso de uso 2")).toBeVisible();

  const including = canvas.locator('[data-kind="use-case"]').filter({
    has: page.getByText("Caso de uso", { exact: true }),
  });
  const included = canvas.locator('[data-kind="use-case"]').filter({
    has: page.getByText("Caso de uso 2", { exact: true }),
  });
  return { canvas, including, included };
}

test("include conserva el sentido del drag, anuncia y deshace", async ({
  page,
}) => {
  await page.goto("/");

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const { canvas, including, included } = await createTwoUseCases(page);

  await page.getByRole("button", { name: "Include" }).click();
  await expect(page.getByRole("button", { name: "Include" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(inspector.getByTestId("connection-help")).toHaveText(
    /origen: caso que incluye/i,
  );

  await connectHandles(
    page,
    including.locator(".react-flow__handle-right").last(),
    included.locator(".react-flow__handle-left").first(),
  );

  const edge = canvas.getByLabel("Include entre Caso de uso y Caso de uso 2");
  await expect(edge).toBeVisible();
  await expect(edge.getByTestId("dependency-stereotype")).toHaveText(
    "«include»",
  );
  await expect(edge.getByTestId("dependency-arrow")).toBeVisible();
  await expect(edge.locator(".react-flow__edge-path")).not.toHaveAttribute(
    "marker-end",
  );
  await expect(page.getByTestId("editor-live")).toHaveText("Se creó include.");
  await expect(page.getByRole("button", { name: "Selección" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Include" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(canvas).toHaveAttribute("data-show-handles", "false");
  await expect(inspector.getByTestId("inspector-type")).toHaveText("Include");
  await expect(inspector.getByText("Origen (incluye)")).toBeVisible();
  await expect(selectedEndpoint(inspector, "inspector-source")).toHaveText(
    "Caso de uso Caso de uso",
  );
  await expect(selectedEndpoint(inspector, "inspector-target")).toHaveText(
    "Caso de uso Caso de uso 2",
  );

  await included.click();
  await expect(inspector.getByTestId("inspector-type")).toHaveText(
    "Caso de uso",
  );
  await expect(inspector.getByLabel("Nombre")).toHaveValue("Caso de uso 2");

  await edge.click();
  await page.keyboard.press("Delete");
  await expect(edge).toHaveCount(0);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(
    canvas.getByLabel("Include entre Caso de uso y Caso de uso 2"),
  ).toBeVisible();
});

test("el drag inverso de include no se reescribe como el sentido contrario", async ({
  page,
}) => {
  await page.goto("/");

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const { canvas, including, included } = await createTwoUseCases(page);

  await page.getByRole("button", { name: "Include" }).click();
  await connectHandles(
    page,
    included.locator(".react-flow__handle-left").last(),
    including.locator(".react-flow__handle-right").first(),
  );

  const reverseEdge = canvas.getByLabel(
    "Include entre Caso de uso 2 y Caso de uso",
  );
  await expect(reverseEdge).toBeVisible();
  await expect(selectedEndpoint(inspector, "inspector-source")).toHaveText(
    "Caso de uso Caso de uso 2",
  );
  await expect(selectedEndpoint(inspector, "inspector-target")).toHaveText(
    "Caso de uso Caso de uso",
  );
  await expect(
    canvas.getByLabel("Include entre Caso de uso y Caso de uso 2"),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Include" }).click();
  await connectHandles(
    page,
    included.locator(".react-flow__handle-left").last(),
    including.locator(".react-flow__handle-right").first(),
  );
  await expect(page.getByTestId("editor-live")).toHaveText(
    /ya existe una relación con el mismo tipo y extremos/i,
  );
  await expect(canvas.locator(".diagram-edge-include")).toHaveCount(1);
});

test("extend apunta al caso base y rechaza self o actor", async ({ page }) => {
  await page.goto("/");

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const canvas = page.getByTestId("diagram-canvas");
  const { including, included } = await createTwoUseCases(page);

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  const actor = canvas.locator('[data-kind="actor"]');

  await page.getByRole("button", { name: "Extend" }).click();
  await expect(inspector.getByTestId("connection-help")).toHaveText(
    /origen: caso que extiende/i,
  );

  await connectHandles(
    page,
    included.locator(".react-flow__handle-bottom").last(),
    including.locator(".react-flow__handle-bottom").first(),
  );

  const edge = canvas.getByLabel("Extend entre Caso de uso 2 y Caso de uso");
  await expect(edge).toBeVisible();
  await expect(edge.getByTestId("dependency-stereotype")).toHaveText(
    "«extend»",
  );
  await expect(page.getByTestId("editor-live")).toHaveText("Se creó extend.");
  await expect(inspector.getByText("Origen (extiende)")).toBeVisible();
  await expect(inspector.getByText("Destino (caso base)")).toBeVisible();
  await expect(selectedEndpoint(inspector, "inspector-source")).toHaveText(
    "Caso de uso Caso de uso 2",
  );
  await expect(selectedEndpoint(inspector, "inspector-target")).toHaveText(
    "Caso de uso Caso de uso",
  );

  await page.getByRole("button", { name: "Extend" }).click();
  await connectHandles(
    page,
    including.locator(".react-flow__handle-top").last(),
    including.locator(".react-flow__handle-right").first(),
  );
  await expect(page.getByTestId("editor-live")).toHaveText(
    /no se permite una relación de un elemento consigo mismo/i,
  );
  await expect(canvas.locator(".diagram-edge-extend")).toHaveCount(1);

  await connectHandles(
    page,
    actor.locator(".react-flow__handle-right").last(),
    including.locator(".react-flow__handle-left").first(),
  );
  await expect(page.getByTestId("editor-live")).toHaveText(
    /solo se permiten entre casos de uso/i,
  );
  await expect(canvas.locator(".diagram-edge-extend")).toHaveCount(1);
});

test("un ciclo include avisa en el inspector y no bloquea la edición", async ({
  page,
}) => {
  await page.goto("/");

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const { canvas, including, included } = await createTwoUseCases(page);

  await page.getByRole("button", { name: "Include" }).click();
  await connectHandles(
    page,
    including.locator(".react-flow__handle-right").last(),
    included.locator(".react-flow__handle-left").first(),
  );
  await expect(
    canvas.getByLabel("Include entre Caso de uso y Caso de uso 2"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Include" }).click();
  await connectHandles(
    page,
    included.locator(".react-flow__handle-left").last(),
    including.locator(".react-flow__handle-right").first(),
  );
  await expect(
    canvas.getByLabel("Include entre Caso de uso 2 y Caso de uso"),
  ).toBeVisible();
  await expect(page.getByTestId("editor-live")).toHaveText("Se creó include.");

  const warnings = inspector.getByTestId("inspector-warnings");
  await expect(warnings).toBeVisible();
  await expect(warnings).not.toHaveAttribute("aria-live");
  const cycleWarnings = inspector.locator(
    '[data-warning-code="INCLUDE_CYCLE"]',
  );
  await expect(cycleWarnings).toHaveCount(2);
  await expect(cycleWarnings.first()).toHaveText(
    /Participa en un ciclo de Include\./,
  );
  await expect(
    inspector.locator('[data-warning-code="EXTEND_CYCLE"]'),
  ).toHaveCount(0);

  await page.keyboard.press("Escape");
  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 700, y: 80 } });
  await canvasElementName(page, "Caso de uso").click();
  const name = inspector.getByLabel("Nombre");
  await expect(name).toHaveValue("Caso de uso");
  await name.fill("Login");
  await name.press("Enter");
  await expect(name).toHaveValue("Login");
  await expect(
    inspector.locator('[data-warning-code="INCLUDE_CYCLE"]'),
  ).toHaveCount(2);
  await expect(warnings).toContainText(
    "Login: Participa en un ciclo de Include.",
  );
});

test("click en include interno selecciona, cambia destino y borra solo la relación", async ({
  page,
}) => {
  await page.goto("/");

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const { canvas, including, included } = await createTwoUseCases(page);

  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 220, y: 280 } });
  await expect(canvasElementName(page, "Caso de uso 3")).toBeVisible();

  await page.getByRole("button", { name: "Include" }).click();
  await connectHandles(
    page,
    including.locator(".react-flow__handle-right").last(),
    included.locator(".react-flow__handle-left").first(),
  );
  const edge = canvas.getByLabel("Include entre Caso de uso y Caso de uso 2");
  await expect(edge).toBeVisible();

  await page.keyboard.press("Escape");
  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 700, y: 80 } });
  await expect(inspector.getByTestId("inspector-type")).toHaveCount(0);

  const midPoint = await edge
    .locator(".react-flow__edge-interaction")
    .evaluate((node) => {
      if (!(node instanceof SVGPathElement)) {
        throw new Error("Falta el path de include");
      }
      const length = node.getTotalLength();
      const pt = node.getPointAtLength(length * 0.5);
      const ctm = node.getScreenCTM();
      if (ctm === null) {
        throw new Error("No hay CTM");
      }
      const screen = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
      return { x: screen.x, y: screen.y };
    });
  await page.mouse.click(midPoint.x, midPoint.y);
  await expect(inspector.getByTestId("inspector-type")).toHaveText("Include");
  await expect(edge).toHaveClass(/selected/);

  await inspector.getByTestId("inspector-target").selectOption({
    label: "Caso de uso Caso de uso 3",
  });
  await expect(page.getByTestId("editor-live")).toHaveText(
    "Se actualizó include.",
  );
  await expect(
    canvas.getByLabel("Include entre Caso de uso y Caso de uso 3"),
  ).toBeVisible();

  await page.keyboard.press("Delete");
  await expect(
    canvas.getByLabel("Include entre Caso de uso y Caso de uso 3"),
  ).toHaveCount(0);
  await expect(canvasElementName(page, "Caso de uso")).toBeVisible();
  await expect(canvasElementName(page, "Caso de uso 2")).toBeVisible();
  await expect(canvasElementName(page, "Caso de uso 3")).toBeVisible();
});
