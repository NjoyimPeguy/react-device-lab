import { expect, test } from "@playwright/test";

const DEMO = "http://127.0.0.1:4175";

test.describe("@screenshots generic demo", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Documentation screenshots use the deterministic Chromium baseline.",
  );

  for (const theme of ["light", "dark"] as const) {
    test(`${theme} desktop workspace`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const device =
        theme === "light" ? "iphone-17-pro" : "galaxy-s25-ultra";
      await page.goto(`${DEMO}/?theme=${theme}&device=${device}`);
      await expect(
        page.getByRole("main", { name: "Device preview lab" }),
      ).toHaveAttribute("data-rdl-theme", theme);
      await expect(page.locator("iframe")).toHaveAttribute(
        "src",
        "/preview/",
      );
      await expect(page.locator("iframe")).toBeVisible();

      await expect(page).toHaveScreenshot(`demo-${theme}-desktop.png`, {
        animations: "disabled",
        caret: "hide",
      });
    });
  }

  test("narrow stacked workspace", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${DEMO}/?theme=light&device=pixel-10`);
    const panel = page.getByRole("complementary", {
      name: "Preview configuration",
    });
    const stage = page.getByRole("region", { name: "Preview stage" });
    const [panelBox, stageBox] = await Promise.all([
      panel.boundingBox(),
      stage.boundingBox(),
    ]);
    expect(panelBox?.y ?? Infinity).toBeLessThan(stageBox?.y ?? 0);

    await expect(page).toHaveScreenshot("demo-light-narrow.png", {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
    });
  });
});
