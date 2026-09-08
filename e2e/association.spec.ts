import { expect, test, type Locator, type Page } from "@playwright/test";

async function dragBy(
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
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 16 });
  await page.mouse.up();
}

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

test("conecta Actor y Caso de uso, mueve, selecciona, borra y deshace", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await expect(canvas).toBeVisible();

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 480 } });
  await expect(canvas.getByText("Actor", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 240, y: 180 } });
  await expect(canvas.getByText("Caso de uso", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Asociación" }).click();
  await expect(
    page.getByRole("button", { name: "Asociación" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(canvas).toHaveAttribute("data-show-handles", "true");

  const actor = canvas.locator('[data-kind="actor"]');
  const useCase = canvas.locator('[data-kind="use-case"]');
  await connectHandles(
    page,
    actor.locator(".react-flow__handle-right").last(),
    useCase.locator(".react-flow__handle-left").first(),
  );

  const edge = canvas.getByLabel("Asociación entre Actor y Caso de uso");
  await expect(edge).toBeVisible();
  await expect(edge.locator(".react-flow__edge-path")).not.toHaveAttribute(
    "marker-end",
  );
  await expect(page.getByTestId("editor-live")).toHaveText(
    "Se creó la asociación.",
  );
  await expect(inspector.getByTestId("inspector-type")).toHaveText(
    "Asociación",
  );
  await expect(inspector.getByTestId("inspector-source")).toHaveText(
    "Actor Actor",
  );
  await expect(inspector.getByTestId("inspector-target")).toHaveText(
    "Caso de uso Caso de uso",
  );
  await expect(inspector.getByLabel("Nombre")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Asociación" }),
  ).toHaveAttribute("aria-pressed", "false");

  const edgePath = edge.locator(".react-flow__edge-path");
  const pathBefore = await edgePath.getAttribute("d");
  await dragBy(page, actor, 80, 0);
  await expect
    .poll(async () => edgePath.getAttribute("d"))
    .not.toBe(pathBefore);
  await expect(edge).toBeVisible();

  await edge.click();
  await expect(inspector.getByTestId("inspector-type")).toHaveText(
    "Asociación",
  );
  await page.keyboard.press("Delete");
  await expect(edge).toHaveCount(0);
  await expect(page.getByTestId("editor-live")).toHaveText(
    "Se eliminó la selección.",
  );

  await page.keyboard.press("ControlOrMeta+z");
  await expect(
    canvas.getByLabel("Asociación entre Actor y Caso de uso"),
  ).toBeVisible();
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(
    canvas.getByLabel("Asociación entre Actor y Caso de uso"),
  ).toHaveCount(0);
});

test("el drag inverso normaliza el actor como origen y un intento inválido no muta", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.getByTestId("diagram-canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 80, y: 500 } });
  const actor = canvas.locator('[data-kind="actor"]').filter({
    has: page.getByText("Actor", { exact: true }),
  });
  await page.getByRole("button", { name: "Caso de uso" }).click();
  await canvas.click({ position: { x: 260, y: 180 } });

  await page.getByRole("button", { name: "Asociación" }).click();
  const useCase = canvas.locator('[data-kind="use-case"]');
  await connectHandles(
    page,
    useCase.locator(".react-flow__handle-left").last(),
    actor.locator(".react-flow__handle-right").first(),
  );

  await expect(
    canvas.getByLabel("Asociación entre Actor y Caso de uso"),
  ).toBeVisible();
  await expect(inspector.getByTestId("inspector-source")).toHaveText(
    "Actor Actor",
  );
  await expect(inspector.getByTestId("inspector-target")).toHaveText(
    "Caso de uso Caso de uso",
  );

  await page.getByRole("button", { name: "Actor" }).click();
  await canvas.click({ position: { x: 200, y: 520 } });
  await expect(canvas.getByText("Actor 2", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Asociación" }).click();
  const secondActor = canvas.locator('[data-kind="actor"]').filter({
    hasText: "Actor 2",
  });
  await connectHandles(
    page,
    actor.locator(".react-flow__handle-bottom").last(),
    secondActor.locator(".react-flow__handle-top").first(),
  );

  await expect(page.getByTestId("editor-live")).toHaveText(
    /solo puede unir un actor y un caso de uso/i,
  );
  await expect(canvas.locator(".diagram-edge-association")).toHaveCount(1);
});
