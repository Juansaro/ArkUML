import { expect, test } from "@playwright/test";
import {
  connectHandles,
  diagramCanvas,
  diagramElement,
  placeElement,
  sourceHandle,
  targetHandle,
} from "./support.ts";

test.describe("invalidación de conexión", () => {
  test("rechaza asociación actor–actor sin mutar el diagrama", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = diagramCanvas(page);

    const actor = await placeElement(page, "Actor", { x: 80, y: 500 }, "Actor");
    await placeElement(page, "Actor", { x: 200, y: 520 }, "Actor 2");
    const secondActor = diagramElement(page, "actor", "Actor 2");

    await page.getByRole("button", { name: "Asociación" }).click();
    await expect(canvas).toHaveAttribute("data-show-handles", "true");
    await connectHandles(
      page,
      actor.locator(".react-flow__handle-bottom").last(),
      secondActor.locator(".react-flow__handle-top").first(),
    );

    await expect(page.getByTestId("editor-live")).toHaveText(
      /solo puede unir un actor y un caso de uso/i,
    );
    await expect(canvas.locator(".diagram-edge-association")).toHaveCount(0);
  });

  test("rechaza include reflexivo y duplicado sin mutar de más", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = diagramCanvas(page);

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

    await page.getByRole("button", { name: "Include" }).click();
    await connectHandles(
      page,
      including.locator(".react-flow__handle-top").last(),
      including.locator(".react-flow__handle-right").first(),
    );
    await expect(page.getByTestId("editor-live")).toHaveText(
      /no se permite una relación de un elemento consigo mismo/i,
    );
    await expect(canvas.locator(".diagram-edge-include")).toHaveCount(0);

    await connectHandles(page, sourceHandle(including), targetHandle(included));
    await expect(
      canvas.getByLabel("Include entre Caso de uso y Caso de uso 2"),
    ).toBeVisible();
    await expect(canvas.locator(".diagram-edge-include")).toHaveCount(1);

    await connectHandles(page, sourceHandle(including), targetHandle(included));
    await expect(page.getByTestId("editor-live")).toHaveText(
      /ya existe una relación con el mismo tipo y extremos/i,
    );
    await expect(canvas.locator(".diagram-edge-include")).toHaveCount(1);
  });

  test("rechaza extend con un actor sin crear la relación", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = diagramCanvas(page);

    const useCase = await placeElement(
      page,
      "Caso de uso",
      { x: 240, y: 180 },
      "Caso de uso",
    );
    const actor = await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");

    await page.getByRole("button", { name: "Extend" }).click();
    await connectHandles(page, sourceHandle(actor), targetHandle(useCase));
    await expect(page.getByTestId("editor-live")).toHaveText(
      /solo se permiten entre casos de uso/i,
    );
    await expect(canvas.locator(".diagram-edge-extend")).toHaveCount(0);
  });
});
