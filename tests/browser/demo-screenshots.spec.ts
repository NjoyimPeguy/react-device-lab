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

  test("dark theme preserves light-theme geometry and separates the frame", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const readThemeGeometry = async (theme: "light" | "dark") => {
      await page.goto(`${DEMO}/?theme=${theme}&device=iphone-17-pro`);
      const main = page.getByRole("main", { name: "Device preview lab" });
      const stage = page.getByRole("region", { name: "Preview stage" });
      const panel = page.getByRole("complementary", {
        name: "Preview configuration",
      });
      const shell = page.locator(".rdl-frame__shell");

      await expect(main).toHaveAttribute("data-rdl-theme", theme);
      await expect(shell).toBeVisible();

      return {
        main: await main.boundingBox(),
        stage: await stage.boundingBox(),
        panel: await panel.boundingBox(),
        shell: await shell.boundingBox(),
        colors: await main.evaluate((element) => {
          const mainStyle = getComputedStyle(element);
          const stageElement = element.querySelector(".rdl-preview__stage");
          const shellElement = element.querySelector(".rdl-frame__shell");
          if (!stageElement || !shellElement) {
            throw new Error("Expected stage and frame shell.");
          }
          return {
            accent: mainStyle.getPropertyValue("--rdl-accent").trim(),
            canvas: mainStyle.backgroundColor,
            focus: mainStyle.getPropertyValue("--rdl-focus").trim(),
            stage: getComputedStyle(stageElement).backgroundColor,
            surface: mainStyle.getPropertyValue("--rdl-surface").trim(),
            shellShadow: getComputedStyle(shellElement).boxShadow,
          };
        }),
      };
    };

    const light = await readThemeGeometry("light");
    const dark = await readThemeGeometry("dark");

    expect(dark.main).toEqual(light.main);
    expect(dark.stage).toEqual(light.stage);
    expect(dark.panel).toEqual(light.panel);
    expect(dark.shell).toEqual(light.shell);
    expect(dark.colors.accent).toBe(light.colors.accent);
    expect(light.colors.stage).not.toBe(light.colors.canvas);
    expect(dark.colors.stage).not.toBe(dark.colors.canvas);
    expect(dark.colors.surface).not.toBe(dark.colors.canvas);
    expect(dark.colors.focus).not.toBe(dark.colors.accent);
    expect(dark.colors.shellShadow).toContain(
      "rgba(255, 255, 255, 0.34)",
    );
  });
});
