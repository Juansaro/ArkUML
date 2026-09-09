import { expect, test } from "@playwright/test";
import {
  connectHandles,
  diagramCanvas,
  diagramElement,
  placeElement,
  sourceHandle,
  targetHandle,
} from "./support.ts";

test.describe("diagrama de referencia", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });

  // Baselines: Windows (build 26200), Chromium, deviceScaleFactor 1,
  // fuente Segoe UI. CI E2E corre en windows-latest para coincidir.
  test("captura el diagrama de referencia con viewport y fuentes fijos", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = diagramCanvas(page);
    await expect(canvas.getByText("Sistema")).toBeVisible();

    const actor = await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");
    const including = await placeElement(
      page,
      "Caso de uso",
      { x: 220, y: 160 },
      "Caso de uso",
    );
    const included = await placeElement(
      page,
      "Caso de uso",
      { x: 430, y: 160 },
      "Caso de uso 2",
    );

    await page.getByRole("button", { name: "Asociación" }).click();
    await connectHandles(page, sourceHandle(actor), targetHandle(including));

    await page.getByRole("button", { name: "Include" }).click();
    await connectHandles(page, sourceHandle(including), targetHandle(included));

    await page.getByRole("button", { name: "Extend" }).click();
    await connectHandles(
      page,
      included.locator(".react-flow__handle-bottom").last(),
      including.locator(".react-flow__handle-bottom").first(),
    );

    await page.keyboard.press("Escape");
    await canvas.locator(".react-flow__pane").click({
      position: { x: 700, y: 40 },
    });
    await expect(canvas.getByTestId("dependency-stereotype")).toHaveCount(2);
    await expect(
      canvas.getByLabel("Asociación entre Actor y Caso de uso"),
    ).toBeVisible();
    await expect(diagramElement(page, "actor", "Actor")).toBeVisible();

    await expect(canvas).toHaveScreenshot("reference-diagram.png", {
      mask: [
        canvas.locator(".react-flow__controls"),
        canvas.locator(".react-flow__attribution"),
      ],
    });
  });
});
