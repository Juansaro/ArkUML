import { expect, test } from "@playwright/test";
import {
  PNG_SIGNATURE,
  connectHandles,
  diagramCanvas,
  diagramElement,
  downloadBytes,
  dragBy,
  placeElement,
  sourceHandle,
  targetHandle,
} from "./support.ts";

test(
  "recorrido de usuario: crear, asociar, mover, renombrar, include, zoom, undo, borrar y exportar",
  { tag: "@smoke" },
  async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => {
      if (error.message.includes("ResizeObserver loop")) {
        return;
      }
      pageErrors.push(error);
    });

    await page.goto("/");
    const canvas = diagramCanvas(page);
    await expect(
      page.getByRole("heading", { name: "ArkUML", level: 1 }),
    ).toBeVisible();
    await expect(canvas.getByText("Sistema")).toBeVisible();

    await placeElement(page, "Actor", { x: 80, y: 480 }, "Actor");
    await expect(page.getByTestId("editor-live")).toHaveText("Se creó Actor.");

    const inspector = page.getByRole("complementary", { name: "Inspector" });
    const name = inspector.getByLabel("Nombre");
    await expect(name).toHaveValue("Actor");
    await name.fill("Usuario");
    await name.press("Enter");
    await expect(canvas.getByText("Usuario", { exact: true })).toBeVisible();

    const useCase = await placeElement(
      page,
      "Caso de uso",
      { x: 240, y: 180 },
      "Caso de uso",
    );
    await expect(page.getByTestId("editor-live")).toHaveText(
      "Se creó Caso de uso.",
    );

    const actor = diagramElement(page, "actor", "Usuario");
    await page.getByRole("button", { name: "Asociación" }).click();
    await expect(canvas).toHaveAttribute("data-show-handles", "true");
    await connectHandles(page, sourceHandle(actor), targetHandle(useCase));
    await expect(
      canvas.getByLabel("Asociación entre Usuario y Caso de uso"),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Asociación" }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(canvas).toHaveAttribute("data-show-handles", "false");

    const actorNode = canvas.locator(".react-flow__node").filter({
      has: page.getByText("Usuario", { exact: true }),
    });
    const beforeMove = await actorNode.getAttribute("style");
    await dragBy(page, actorNode, 80, 0);
    await expect
      .poll(async () => actorNode.getAttribute("style"))
      .not.toBe(beforeMove);

    const included = await placeElement(
      page,
      "Caso de uso",
      { x: 430, y: 160 },
      "Caso de uso 2",
    );
    await page.getByRole("button", { name: "Include" }).click();
    await connectHandles(
      page,
      sourceHandle(diagramElement(page, "use-case", "Caso de uso")),
      targetHandle(included),
    );
    const includeEdge = canvas.getByLabel(
      "Include entre Caso de uso y Caso de uso 2",
    );
    await expect(includeEdge).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Include" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.getByRole("button", { name: "Acercar" }).click();
    await expect(
      page.getByRole("status", { name: "Estado del editor" }),
    ).not.toHaveText(/Zoom 100%/);

    await page.keyboard.press("ControlOrMeta+z");
    await expect(includeEdge).toHaveCount(0);
    await expect(
      page.getByRole("status", { name: "Estado del editor" }),
    ).not.toHaveText(/Zoom 100%/);

    await canvas.getByText("Usuario", { exact: true }).click({ force: true });
    await expect(inspector.getByTestId("inspector-type")).toHaveText("Actor");
    await page.keyboard.press("Delete");
    await expect(page.getByTestId("editor-live")).toHaveText(
      "Se eliminó la selección.",
    );
    await expect(canvas.getByText("Usuario", { exact: true })).toHaveCount(0);
    await expect(canvas.locator(".diagram-edge-association")).toHaveCount(0);

    await page.getByRole("button", { name: "Exportar" }).click();
    const dialog = page.getByRole("dialog", { name: "Exportar" });
    await expect(dialog).toBeVisible();
    const pending = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Descargar" }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("Diagrama de casos de uso.png");
    const bytes = await downloadBytes(download);
    expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
  },
);
