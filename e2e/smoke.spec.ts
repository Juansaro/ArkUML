import { expect, test } from "@playwright/test";

test(
  "abre la app y muestra el heading ArkUML",
  { tag: "@smoke" },
  async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "ArkUML", level: 1 }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  },
);
