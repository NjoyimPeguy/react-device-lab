import { describe, expect, it } from "vitest";

import { computeFitScale, resolvePreviewScale } from "../../src/index.js";

describe("preview scaling", () => {
  it("fits the complete authored frame inside bounded space", () => {
    expect(
      computeFitScale({
        availableWidth: 800,
        availableHeight: 700,
        contentWidth: 458,
        contentHeight: 974,
        padding: 24,
      }),
    ).toBeCloseTo(652 / 974);
  });

  it("does not enlarge Fit mode past 100% by default", () => {
    expect(
      computeFitScale({
        availableWidth: 2000,
        availableHeight: 2000,
        contentWidth: 400,
        contentHeight: 800,
      }),
    ).toBe(1);
  });

  it("preserves Fit semantics in a container requiring less than 10% scale", () => {
    expect(resolvePreviewScale("fit", 0.05)).toBe(0.05);
  });

  it("supports presets and bounded custom zoom without changing viewport math", () => {
    expect(resolvePreviewScale("fit", 0.62)).toBe(0.62);
    expect(resolvePreviewScale(0.5, 0.62)).toBe(0.5);
    expect(resolvePreviewScale(0.75, 0.62)).toBe(0.75);
    expect(resolvePreviewScale(1, 0.62)).toBe(1);
    expect(resolvePreviewScale(1.35, 0.62)).toBe(1.35);
    expect(resolvePreviewScale(0.01, 0.62)).toBe(0.1);
    expect(resolvePreviewScale(9, 0.62)).toBe(2);
  });
});
