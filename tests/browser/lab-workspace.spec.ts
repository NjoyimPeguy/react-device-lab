import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("lab workspace layout and keyboard access", () => {
  test("lab workspace layout keeps the stage left and fixed panel right without document scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tests/browser/lab-harness.html");

    const lab = page.getByRole("main", { name: "Device preview lab" });
    const stage = page.getByRole("region", { name: "Preview stage" });
    const panel = page.getByRole("complementary", {
      name: "Preview configuration",
    });
    const [labBox, stageBox, panelBox] = await Promise.all([
      lab.boundingBox(),
      stage.boundingBox(),
      panel.boundingBox(),
    ]);

    expect(labBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(stageBox?.x ?? Infinity).toBeLessThan(panelBox?.x ?? 0);
    expect(stageBox?.y).toBe(panelBox?.y);
    expect((stageBox?.x ?? 0) + (stageBox?.width ?? 0)).toBeCloseTo(
      panelBox?.x ?? 0,
      0,
    );
    expect(panelBox?.width ?? 0).toBeGreaterThanOrEqual(304);
    expect((labBox?.y ?? 0) + (labBox?.height ?? 0)).toBeLessThanOrEqual(900);

    expect(
      await page.evaluate(() => ({
        height: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    ).toEqual({
      height: 900,
      scrollHeight: 900,
      width: 1440,
      scrollWidth: 1440,
    });
    await expect(panel).toHaveCSS("overflow-y", "auto");
    await expect(page.locator(".rdl-preview__stage")).toHaveCSS(
      "overflow",
      "auto",
    );
    expect(
      await panel.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    ).toBe(true);
  });

  test("layout zoom changes presentation without changing the logical viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tests/browser/lab-harness.html?device=pixel-10");
    const viewport = page.locator("[data-rdl-viewport-width]");
    const iframe = page.locator('iframe[title="Pixel 10 application preview"]');

    await expect(viewport).toHaveAttribute("data-rdl-viewport-width", "360");
    expect(await iframe.evaluate((element) => getComputedStyle(element).width))
      .toBe("360px");
    await page.getByRole("button", { name: "50%" }).click();
    await expect(page.locator("[data-rdl-preview-scale]")).toHaveAttribute(
      "data-rdl-preview-scale",
      "0.5",
    );
    await expect(viewport).toHaveAttribute("data-rdl-viewport-width", "360");
    expect(await iframe.evaluate((element) => getComputedStyle(element).width))
      .toBe("360px");
  });

  test("layout stacks the configuration panel before the stage on a narrow host", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tests/browser/lab-harness.html");
    const stage = page.getByRole("region", { name: "Preview stage" });
    const panel = page.getByRole("complementary", {
      name: "Preview configuration",
    });
    const [stageBox, panelBox] = await Promise.all([
      stage.boundingBox(),
      panel.boundingBox(),
    ]);

    expect(panelBox?.y ?? Infinity).toBeLessThan(stageBox?.y ?? 0);
    expect(panelBox?.width).toBe(stageBox?.width);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test("generic demo keeps interactive content inside configured safe areas", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      "http://127.0.0.1:4175/?theme=light&device=iphone-17-pro",
    );
    const iframe = page.locator(
      'iframe[title="iPhone 17 Pro application preview"]',
    );
    await expect(iframe).toBeVisible();
    expect(
      await iframe.evaluate((element) => {
        if (!(element instanceof HTMLIFrameElement)) return null;
        return {
          width: element.contentWindow?.innerWidth,
          height: element.contentWindow?.innerHeight,
        };
      }),
    ).toEqual({ width: 402, height: 874 });

    const clearance = await iframe.evaluate((element) => {
      if (!(element instanceof HTMLIFrameElement)) {
        throw new TypeError("Expected a preview iframe.");
      }
      const targetWindow = element.contentWindow;
      const targetDocument = element.contentDocument;
      const root = targetDocument?.documentElement;
      const brand = targetDocument?.querySelector(".brand");
      const headerAction = targetDocument?.querySelector("header button");
      const navigationActions = [
        ...(targetDocument?.querySelectorAll("nav button") ?? []),
      ];
      if (
        !targetWindow ||
        !root ||
        !brand ||
        !headerAction ||
        navigationActions.length === 0
      ) {
        throw new Error("Expected the integrated demo shell.");
      }
      const rootStyle = targetWindow.getComputedStyle(root);
      const topInset = Number.parseFloat(
        rootStyle.getPropertyValue("--rdl-safe-area-inset-top"),
      );
      const bottomInset = Number.parseFloat(
        rootStyle.getPropertyValue("--rdl-safe-area-inset-bottom"),
      );

      return {
        topInset,
        bottomInset,
        foregroundTop: Math.min(
          brand.getBoundingClientRect().top,
          headerAction.getBoundingClientRect().top,
        ),
        navigationBottom: Math.max(
          ...navigationActions.map(
            (action) => action.getBoundingClientRect().bottom,
          ),
        ),
        viewportHeight: targetWindow.innerHeight,
      };
    });

    expect(clearance.topInset).toBeGreaterThan(0);
    expect(clearance.bottomInset).toBeGreaterThan(0);
    expect(clearance.foregroundTop).toBeGreaterThanOrEqual(
      clearance.topInset,
    );
    expect(clearance.navigationBottom).toBeLessThanOrEqual(
      clearance.viewportHeight - clearance.bottomInset,
    );

    await page.getByRole("button", { name: "Rotate viewport" }).click();
    await expect(
      page.locator('[data-rdl-orientation="landscape"]'),
    ).toBeVisible();
    expect(
      await iframe.evaluate((element) => {
        if (!(element instanceof HTMLIFrameElement)) return null;
        return {
          width: element.contentWindow?.innerWidth,
          height: element.contentWindow?.innerHeight,
        };
      }),
    ).toEqual({ width: 874, height: 402 });
    const landscapeClearance = await iframe.evaluate((element) => {
      if (!(element instanceof HTMLIFrameElement)) {
        throw new TypeError("Expected a preview iframe.");
      }
      const targetWindow = element.contentWindow;
      const targetDocument = element.contentDocument;
      const root = targetDocument?.documentElement;
      const brand = targetDocument?.querySelector(".brand");
      const headerAction = targetDocument?.querySelector("header button");
      if (!targetWindow || !root || !brand || !headerAction) {
        throw new Error("Expected the integrated demo header.");
      }
      const rootStyle = targetWindow.getComputedStyle(root);

      return {
        leftInset: Number.parseFloat(
          rootStyle.getPropertyValue("--rdl-safe-area-inset-left"),
        ),
        rightInset: Number.parseFloat(
          rootStyle.getPropertyValue("--rdl-safe-area-inset-right"),
        ),
        foregroundLeft: brand.getBoundingClientRect().left,
        foregroundRight: headerAction.getBoundingClientRect().right,
        viewportWidth: targetWindow.innerWidth,
      };
    });

    expect(landscapeClearance.leftInset).toBeGreaterThan(0);
    expect(landscapeClearance.rightInset).toBeGreaterThan(0);
    expect(landscapeClearance.foregroundLeft).toBeGreaterThanOrEqual(
      landscapeClearance.leftInset,
    );
    expect(landscapeClearance.foregroundRight).toBeLessThanOrEqual(
      landscapeClearance.viewportWidth - landscapeClearance.rightInset,
    );

    await page.getByText("Environment scenarios").click();
    await page.getByLabel("Safe area left").fill("300");
    await page.getByLabel("Safe area right").fill("0");
    const asymmetricClearance = await iframe.evaluate((element) => {
      if (!(element instanceof HTMLIFrameElement)) {
        throw new TypeError("Expected a preview iframe.");
      }
      const targetWindow = element.contentWindow;
      const targetDocument = element.contentDocument;
      const root = targetDocument?.documentElement;
      const firstNavigationAction =
        targetDocument?.querySelector("nav button");
      if (!targetWindow || !root || !firstNavigationAction) {
        throw new Error("Expected the integrated demo navigation.");
      }
      const rootStyle = targetWindow.getComputedStyle(root);

      return {
        leftInset: Number.parseFloat(
          rootStyle.getPropertyValue("--rdl-safe-area-inset-left"),
        ),
        navigationLeft: firstNavigationAction.getBoundingClientRect().left,
      };
    });

    expect(asymmetricClearance.leftInset).toBe(300);
    expect(asymmetricClearance.navigationLeft).toBeGreaterThanOrEqual(
      asymmetricClearance.leftInset,
    );
  });

  test("keyboard controls expose visible focus and operate native selection", async ({
    page,
  }) => {
    await page.goto("/tests/browser/lab-harness.html");
    const search = page.getByLabel("Search devices");
    await search.focus();
    await expect(search).toBeFocused();
    expect(
      await search.evaluate((element) => getComputedStyle(element).outlineStyle),
    ).not.toBe("none");

    await search.fill("iPhone 17 Pro");
    await page.keyboard.press("Tab");
    const selector = page.getByLabel("Device", { exact: true });
    await expect(selector).toBeFocused();
    await selector.selectOption("iphone-17-pro");
    await expect(
      page.locator('[data-rdl-device-id="iphone-17-pro"]'),
    ).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Rotate viewport" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.locator('[data-rdl-orientation="landscape"]'),
    ).toBeVisible();
  });

  test("keyboard focus is visible on viewport-source radios", async ({
    page,
  }) => {
    await page.goto("/tests/browser/lab-harness.html");
    await page.getByLabel("Destination").focus();
    await page.keyboard.press("Tab");

    const namedDevice = page.getByLabel("Named device");
    await expect(namedDevice).toBeFocused();
    const visibleLabel = namedDevice.locator("xpath=following-sibling::span");
    expect(
      await visibleLabel.evaluate(
        (element) => getComputedStyle(element).outlineStyle,
      ),
    ).not.toBe("none");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`@a11y lab workspace ${theme} theme has no detectable package violations`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/tests/browser/lab-harness.html?theme=${theme}`);
      await expect(
        page.getByRole("main", { name: "Device preview lab" }),
      ).toHaveAttribute("data-rdl-theme", theme);

      const results = await new AxeBuilder({ page })
        .exclude("iframe")
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("@a11y lab workspace narrow layout has no detectable package violations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tests/browser/lab-harness.html");
    const results = await new AxeBuilder({ page })
      .exclude("iframe")
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
