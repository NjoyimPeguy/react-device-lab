import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PLACEHOLDER_RGB = [32, 33, 36] as const;

interface CaptureAnalysis {
  signature: number[];
  width: number;
  height: number;
  expectedWidth: number;
  expectedHeight: number;
  distinctContentColors: number;
  cornerSamples: number[][];
}

function analyzeCapture(page: Page): Promise<CaptureAnalysis> {
  return page.evaluate(async () => {
    const capture = (
      window as unknown as { __rdlExportPreview: () => Promise<Blob> }
    ).__rdlExportPreview;
    const blob = await capture();
    const buffer = new Uint8Array(await blob.arrayBuffer());
    const header = new DataView(buffer.buffer);
    const root = document.querySelector("[data-rdl-export-root]");
    const iframe = root?.querySelector("iframe");
    if (!root || !iframe) {
      throw new TypeError("Expected the composed preview and its iframe.");
    }
    const rootRect = root.getBoundingClientRect();
    const frameRect = iframe.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new TypeError("Expected a 2D canvas context.");
    context.drawImage(bitmap, 0, 0);
    const sample = (fractionX: number, fractionY: number): number[] => {
      const x = Math.round(
        (frameRect.left - rootRect.left + frameRect.width * fractionX) * ratio,
      );
      const y = Math.round(
        (frameRect.top - rootRect.top + frameRect.height * fractionY) * ratio,
      );
      return Array.from(context.getImageData(x, y, 1, 1).data);
    };
    const colors = new Set<string>();
    for (let gridY = 0.1; gridY < 1; gridY += 0.15) {
      for (let gridX = 0.1; gridX < 1; gridX += 0.15) {
        colors.add(sample(gridX, gridY).join(","));
      }
    }
    return {
      signature: Array.from(buffer.slice(0, 8)),
      width: header.getUint32(16),
      height: header.getUint32(20),
      expectedWidth: Math.round(rootRect.width * ratio),
      expectedHeight: Math.round(rootRect.height * ratio),
      distinctContentColors: colors.size,
      cornerSamples: [
        sample(0.05, 0.05),
        sample(0.95, 0.05),
        sample(0.05, 0.95),
        sample(0.95, 0.95),
      ],
    };
  });
}

function expectValidPng(analysis: CaptureAnalysis): void {
  expect(analysis.signature).toEqual(PNG_SIGNATURE);
  expect(analysis.width).toBe(analysis.expectedWidth);
  expect(analysis.height).toBe(analysis.expectedHeight);
  expect(analysis.width).toBeGreaterThan(0);
  expect(analysis.height).toBeGreaterThan(0);
}

test.describe("PNG export", () => {
  test("demo exports a PNG download of the same-origin preview", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://127.0.0.1:4175/?theme=light&device=iphone-17-pro");
    const exportRoot = page.locator("[data-rdl-export-root]");
    await expect(exportRoot).toBeVisible();
    const expected = await exportRoot.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      return {
        width: Math.round(rect.width * ratio),
        height: Math.round(rect.height * ratio),
      };
    });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export PNG" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      "device-preview-iphone-17-pro-portrait.png",
    );
    const path = await download.path();
    if (!path) throw new TypeError("Expected the downloaded PNG path.");
    const bytes = await readFile(path);
    expect(Array.from(bytes.subarray(0, 8))).toEqual(PNG_SIGNATURE);
    expect(bytes.readUInt32BE(16)).toBe(expected.width);
    expect(bytes.readUInt32BE(20)).toBe(expected.height);
  });

  test("captures same-origin content, zoom, and orientation exactly as displayed", async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "warning") warnings.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tests/browser/export-harness.html?device=pixel-10");
    const previewFrame = page.frameLocator(
      'iframe[title="Pixel 10 application preview"]',
    );
    await expect(previewFrame.locator(".target-application")).toBeVisible();

    const fitAnalysis = await analyzeCapture(page);
    expectValidPng(fitAnalysis);
    expect(fitAnalysis.distinctContentColors).toBeGreaterThanOrEqual(4);

    await page.getByRole("button", { name: "50%" }).click();
    await expect(page.locator("[data-rdl-preview-scale]")).toHaveAttribute(
      "data-rdl-preview-scale",
      "0.5",
    );
    const zoomedAnalysis = await analyzeCapture(page);
    expectValidPng(zoomedAnalysis);
    expect(zoomedAnalysis.width).toBeLessThan(fitAnalysis.width);
    // Richness is scale- and font-rendering-dependent: at 50% the sampled
    // grid collapses onto fewer distinct surfaces (3–4 in CI, ≥4 on some
    // hosts). Assert the zoomed capture is still real content — anything
    // above a uniform blank/placeholder.
    expect(zoomedAnalysis.distinctContentColors).toBeGreaterThanOrEqual(2);

    await page.getByRole("button", { name: "Rotate viewport" }).click();
    await expect(
      page.locator('[data-rdl-orientation="landscape"]'),
    ).toBeVisible();
    const rotatedAnalysis = await analyzeCapture(page);
    expectValidPng(rotatedAnalysis);
    expect(rotatedAnalysis.width).toBeGreaterThan(rotatedAnalysis.height);

    expect(
      warnings.filter((text) => text.includes("cross-origin")),
    ).toEqual([]);
  });

  test("renders a neutral placeholder for a cross-origin destination", async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "warning") warnings.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      "/tests/browser/export-harness.html?device=pixel-10&origin=cross",
    );
    await expect(
      page.locator('iframe[title="Pixel 10 application preview"]'),
    ).toBeVisible();

    const analysis = await analyzeCapture(page);
    expectValidPng(analysis);

    const crossOriginWarnings = warnings.filter((text) =>
      text.includes("cross-origin iframe cannot be serialized"),
    );
    expect(crossOriginWarnings).toHaveLength(1);

    for (const sample of analysis.cornerSamples) {
      expect(sample[3]).toBe(255);
      for (let channel = 0; channel < 3; channel += 1) {
        expect(
          Math.abs((sample[channel] ?? 0) - (PLACEHOLDER_RGB[channel] ?? 0)),
        ).toBeLessThanOrEqual(3);
      }
    }
  });
});
