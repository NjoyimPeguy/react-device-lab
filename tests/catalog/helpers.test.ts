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

    expect(groups.map(({ category, label }) => [category, label])).toEqual([
      ["phone", "Phones — Android"],
      ["phone", "Phones — iOS"],
      ["foldable", "Foldables"],
      ["tablet", "Tablets — Android"],
      ["tablet", "Tablets — iOS"],
      ["laptop", "Laptops"],
      ["desktop", "Desktop displays"],
      ["ultrawide", "Ultrawide displays"],
    ]);
    expect(groups.flatMap(({ devices }) => devices)).toHaveLength(
      DEVICE_PRESETS.length,
    );
    expect(
      new Set(groups.flatMap(({ devices }) => devices.map(({ id }) => id))).size,
    ).toBe(DEVICE_PRESETS.length);
  });

  it("splits only two-platform categories, Android first, in catalog order", () => {
    const groups = groupDevicePresets(DEVICE_PRESETS);
    const catalogOrder = new Map(
      DEVICE_PRESETS.map(({ id }, index) => [id, index]),
    );

    const split = groups.filter(
      ({ category }) => category === "phone" || category === "tablet",
    );
    expect(split.map(({ platform }) => platform)).toEqual([
      "android",
      "ios",
      "android",
      "ios",
    ]);
    for (const group of split) {
      expect(group.devices.length).toBeGreaterThan(0);
      expect(
        group.devices.every(({ platform }) => platform === group.platform),
      ).toBe(true);
    }

    const unsplit = groups.filter(
      ({ category }) => category !== "phone" && category !== "tablet",
    );
    expect(unsplit.map(({ category, label }) => [category, label])).toEqual([
      ["foldable", "Foldables"],
      ["laptop", "Laptops"],
      ["desktop", "Desktop displays"],
      ["ultrawide", "Ultrawide displays"],
    ]);
    expect(unsplit.every(({ platform }) => platform === undefined)).toBe(true);

    for (const { devices } of groups) {
      const indexes = devices.map(({ id }) => catalogOrder.get(id) as number);
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    }
  });

  it("rejects invalid widths", () => {
    expect(() => getViewportWidthClass(-1)).toThrow(RangeError);
    expect(() => getViewportWidthClass(Number.NaN)).toThrow(RangeError);
  });
});
