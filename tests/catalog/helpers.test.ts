import { describe, expect, it } from "vitest";

import {
  DEVICE_PRESETS,
  getViewportWidthClass,
  groupDevicePresets,
  searchDevicePresets,
} from "../../src/index.js";

describe("catalog helpers", () => {
  it.each([
    [320, "compact"],
    [599, "compact"],
    [600, "medium"],
    [839, "medium"],
    [840, "expanded"],
    [2560, "expanded"],
  ] as const)("classifies %i CSS pixels as %s", (width, expected) => {
    expect(getViewportWidthClass(width)).toBe(expected);
  });

  it("searches names, platforms, categories, and families without mutation", () => {
    const originalIds = DEVICE_PRESETS.map(({ id }) => id);

    expect(
      searchDevicePresets("iphone 17 pro").map(({ name }) => name),
    ).toEqual(["iPhone 17 Pro", "iPhone 17 Pro Max"]);
    expect(
      searchDevicePresets("foldable").every(
        ({ category }) => category === "foldable",
      ),
    ).toBe(true);
    expect(
      searchDevicePresets("android").every(
        ({ platform }) => platform === "android",
      ),
    ).toBe(true);
    expect(searchDevicePresets("  ").length).toBe(DEVICE_PRESETS.length);
    expect(DEVICE_PRESETS.map(({ id }) => id)).toEqual(originalIds);
  });

  it("groups every device once in predictable category order", () => {
    const groups = groupDevicePresets(DEVICE_PRESETS);

    expect(groups.map(({ category }) => category)).toEqual([
      "phone",
      "foldable",
      "tablet",
      "laptop",
      "desktop",
      "ultrawide",
    ]);
    expect(groups.flatMap(({ devices }) => devices)).toHaveLength(
      DEVICE_PRESETS.length,
    );
    expect(
      new Set(groups.flatMap(({ devices }) => devices.map(({ id }) => id))).size,
    ).toBe(DEVICE_PRESETS.length);
  });

  it("rejects invalid widths", () => {
    expect(() => getViewportWidthClass(-1)).toThrow(RangeError);
    expect(() => getViewportWidthClass(Number.NaN)).toThrow(RangeError);
  });
});
