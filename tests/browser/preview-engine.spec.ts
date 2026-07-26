import { expect, test } from "@playwright/test";

test.describe("preview engine", () => {
  test("same origin SPA navigation, reload, and new-tab actions preserve the route", async ({
    context,
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tests/browser/preview-harness.html");

    const target = page.frameLocator('iframe[title*="application preview"]');
    await target.getByRole("button", { name: "Open tasks" }).click();
    const route =
      "/tests/browser/preview-target.html?screen=tasks#today";
    await expect(
      page.getByRole("status", { name: "Current embedded route" }),
    ).toHaveText(route);

    const generation = Number(
      await target
        .getByRole("status", { name: "Target load generation" })
        .textContent(),
    );
    await page.getByRole("button", { name: "Reload preview" }).click();
    await expect(
      target.getByRole("status", { name: "Target load generation" }),
    ).toHaveText(String(generation + 1));
    await expect(
      page.getByRole("status", { name: "Current embedded route" }),
    ).toHaveText(route);

    const popupPromise = context.waitForEvent("page");
    await page
      .getByRole("button", { name: "Open preview in new tab" })
      .click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    expect(new URL(popup.url()).pathname + new URL(popup.url()).search + new URL(popup.url()).hash).toBe(route);
    await popup.close();
  });

  test("cross origin targets remain usable without prohibited DOM access", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.goto(
      "/tests/browser/preview-harness.html?origin=cross",
    );

    const iframe = page.locator('iframe[title*="application preview"]');
    await expect(iframe).toHaveAttribute(
      "src",
      /^http:\/\/127\.0\.0\.1:4174\//u,
    );
    await expect(
      page
        .frameLocator('iframe[title*="application preview"]')
        .getByRole("heading", { name: "Responsive task board" }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("same origin targets can navigate cross origin without host security errors", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.goto("/tests/browser/preview-harness.html");
    const target = page.frameLocator('iframe[title*="application preview"]');

    await target
      .getByRole("button", { name: "Navigate across origins" })
      .click();
    await expect(
      target.getByText("Generic embedded application"),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("same origin hard navigation preserves route and environment inspection", async ({
    page,
  }) => {
    await page.goto("/tests/browser/preview-harness.html?device=pixel-10");
    const target = page.frameLocator('iframe[title*="application preview"]');

    await target.getByRole("link", { name: "Open full document" }).click();
    await expect(
      page.getByRole("status", { name: "Current embedded route" }),
    ).toHaveText(
      "/tests/browser/preview-target.html?document=next",
    );
    await expect(target.locator("html")).toHaveAttribute(
      "data-rdl-pointer",
      "coarse",
    );
  });

  test("cross origin bridge synchronizes routes and exact configuration", async ({
    page,
  }) => {
    await page.goto(
      "/tests/browser/preview-harness.html?origin=cross&bridge=true",
    );
    const target = page.frameLocator('iframe[title*="application preview"]');
    await expect(
      target.locator("html"),
    ).toHaveAttribute("data-rdl-pointer", "coarse");
    await target.getByRole("button", { name: "Open tasks" }).click();
    await expect(
      page.getByRole("status", { name: "Current embedded route" }),
    ).toContainText("screen=tasks");
  });

  test("touch scrollbars are hidden without disabling target scrolling", async ({
    page,
  }) => {
    await page.goto(
      "/tests/browser/preview-harness.html?device=pixel-10",
    );
    const target = page.frameLocator('iframe[title*="application preview"]');
    const root = target.locator("html");

    await expect(root).toHaveAttribute("data-rdl-pointer", "coarse");
    await expect
      .poll(() =>
        root.evaluate((element) => getComputedStyle(element).scrollbarWidth),
      )
      .toBe("none");
    const scrollResult = await root.evaluate((element) => {
      const scope = element.ownerDocument.defaultView;
      if (!scope) return null;
      const before = scope.scrollY;
      scope.scrollTo(0, 300);
      return {
        before,
        after: scope.scrollY,
        height: element.scrollHeight,
        viewport: scope.innerHeight,
      };
    });
    expect(scrollResult).not.toBeNull();
    expect(scrollResult?.height).toBeGreaterThan(scrollResult?.viewport ?? 0);
    expect(scrollResult?.after).toBeGreaterThan(scrollResult?.before ?? 0);
  });

  test("desktop targets retain system scrollbar behavior", async ({ page }) => {
    await page.goto(
      "/tests/browser/preview-harness.html?device=full-hd-desktop",
    );
    const targetRoot = page
      .frameLocator('iframe[title*="application preview"]')
      .locator("html");

    await expect(targetRoot).toHaveAttribute("data-rdl-pointer", "fine");
    await expect
      .poll(() =>
        targetRoot.evaluate(
          (element) => getComputedStyle(element).scrollbarWidth,
        ),
      )
      .not.toBe("none");
  });

  test("portal mode uses the iframe viewport for media queries", async ({
    page,
  }) => {
    await page.goto(
      "/tests/browser/preview-harness.html?mode=portal&device=iphone-16-pro-max&zoom=0.5",
    );
    const iframe = page.locator('iframe[title*="application preview"]');
    const portal = page
      .frameLocator('iframe[title*="application preview"]')
      .locator(".portal-application");

    await expect(
      page
        .frameLocator('iframe[title*="application preview"]')
        .getByRole("heading", { name: "Portal application" }),
    ).toBeVisible();
    expect(
      await iframe.evaluate(
        (element: HTMLIFrameElement) => element.contentWindow?.innerWidth,
      ),
    ).toBe(440);
    expect(
      await portal.evaluate((element) =>
        getComputedStyle(element, "::after").content.replaceAll('"', ""),
      ),
    ).toBe("compact");
    await expect(page.locator("[data-rdl-viewport-width]")).toHaveAttribute(
      "data-rdl-viewport-width",
      "440",
    );
    await expect(page.locator("[data-rdl-preview-scale]")).toHaveAttribute(
      "data-rdl-preview-scale",
      "0.5",
    );
  });
});
