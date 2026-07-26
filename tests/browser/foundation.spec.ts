import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("@a11y browser harness has no detectable violations", async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head><title>Responsive preview</title></head>
      <body>
        <main>
          <h1>Responsive preview</h1>
          <button type="button">Choose a device</button>
        </main>
      </body>
    </html>
  `);

  await expect(page.getByRole("heading", { name: "Responsive preview" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose a device" })).toBeEnabled();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
