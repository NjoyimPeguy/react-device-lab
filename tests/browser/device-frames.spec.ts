import { expect, test } from "@playwright/test";

const frameCases = [
  "iphone-13-mini",
  "iphone-17-pro",
  "galaxy-s25-ultra",
  "galaxy-z-flip-7-cover",
  "galaxy-z-fold-7-unfolded",
  "galaxy-tab-s10-ultra",
  "macbook-air-13",
  "full-hd-desktop",
  "ultrawide-desktop",
] as const;

test.describe("device frames", () => {
  for (const deviceId of frameCases) {
    test(`${deviceId} renders its authored skin`, async ({
      browserName,
      page,
    }) => {
      const externalRequests: string[] = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.origin !== "http://127.0.0.1:4173") {
          externalRequests.push(request.url());
        }
      });
      await page.setViewportSize({ width: 1180, height: 920 });
      await page.goto(
        `/tests/browser/frame-harness.html?device=${deviceId}`,
      );

      const stage = page.getByTestId("frame-stage");
      const viewport = page.locator("[data-rdl-viewport-width]");
      const expectedWidth = await viewport.getAttribute(
        "data-rdl-viewport-width",
      );
      const expectedHeight = await viewport.getAttribute(
        "data-rdl-viewport-height",
      );

      expect(
        await viewport.evaluate((element) => getComputedStyle(element).width),
      ).toBe(`${expectedWidth}px`);
      expect(
        await viewport.evaluate((element) => getComputedStyle(element).height),
      ).toBe(`${expectedHeight}px`);
      expect(externalRequests).toEqual([]);

      const topMountedCutout = page.locator(
        '[data-rdl-cutout-mount="top"] .rdl-frame__cutout:not(.rdl-frame__cutout--camera-pair)',
      );
      if (await topMountedCutout.count()) {
        const frameElement = page.locator("[data-rdl-device-frame]");
        const frameBox = await frameElement.boundingBox();
        const cutoutBox = await topMountedCutout.boundingBox();
        expect(frameBox).not.toBeNull();
        expect(cutoutBox).not.toBeNull();
        expect(
          Math.abs(
            (cutoutBox?.x ?? 0) +
              (cutoutBox?.width ?? 0) / 2 -
              ((frameBox?.x ?? 0) + (frameBox?.width ?? 0) / 2),
          ),
        ).toBeLessThan(2);
        // The cutout hugs the top at bezel-top + cutout-offset, in the
        // harness-scaled coordinate space. Calibrated bezels differ per
        // model, so read the authored offsets instead of a fixed margin.
        const geometry = await frameElement.evaluate((element) => ({
          bezelTop: parseFloat(
            element.style.getPropertyValue("--rdl-bezel-top"),
          ),
          cutoutOffset: parseFloat(
            element.style.getPropertyValue("--rdl-cutout-offset"),
          ),
          width: parseFloat(element.style.width),
        }));
        const scale = (frameBox?.width ?? 0) / geometry.width;
        expect(cutoutBox?.y ?? Infinity).toBeLessThan(
          (frameBox?.y ?? 0) +
            (geometry.bezelTop + geometry.cutoutOffset + 2) * scale,
        );
      }

      if (browserName === "chromium") {
        await expect(stage).toHaveScreenshot(`${deviceId}.png`, {
          animations: "disabled",
        });
      }
    });
  }
});
