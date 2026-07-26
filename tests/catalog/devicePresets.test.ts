import { describe, expect, it } from "vitest";

import {
  DEVICE_PRESETS,
  getPhysicalResolution,
  getViewportDimensions,
  type DevicePreset,
} from "../../src/index.js";

function findPreset(name: string): DevicePreset {
  const preset = DEVICE_PRESETS.find((candidate) => candidate.name === name);
  expect(preset, name).toBeDefined();
  return preset as DevicePreset;
}

describe("device presets", () => {
  it("contains at least 69 stable, unique ids and names", () => {
    const ids = new Set(DEVICE_PRESETS.map(({ id }) => id));
    const names = new Set(DEVICE_PRESETS.map(({ name }) => name));

    expect(DEVICE_PRESETS.length).toBeGreaterThanOrEqual(69);
    expect(ids.size).toBe(DEVICE_PRESETS.length);
    expect(names.size).toBe(DEVICE_PRESETS.length);
    expect(Object.isFrozen(DEVICE_PRESETS)).toBe(true);
  });

  it.each([
    "iPhone 17",
    "iPhone Air",
    "iPhone 17 Pro",
    "iPhone 17 Pro Max",
    "Galaxy S25",
    "Galaxy S25+",
    "Galaxy S25 Edge",
    "Galaxy S25 Ultra",
    "Galaxy S26",
    "Galaxy S26+",
    "Galaxy S26 Ultra",
    "Pixel 10",
    "Pixel 10 Pro",
    "Pixel 10 Pro XL",
    "iPad Air 13-inch",
    "iPad Pro 13-inch",
    "Galaxy Tab S10 Ultra",
    "Galaxy Z Flip 6 — cover",
    "Galaxy Z Flip 6 — unfolded",
    "Galaxy Z Flip 7 — cover",
    "Galaxy Z Flip 7 — unfolded",
    "Galaxy Z Fold 7 — cover",
    "Galaxy Z Fold 7 — unfolded",
    "Pixel 9 Pro Fold — cover",
    "Pixel 9 Pro Fold — unfolded",
  ])("includes %s", (name) => {
    expect(findPreset(name).name).toBe(name);
  });

  it("keeps complete viewport, interaction, frame, and provenance metadata", () => {
    for (const preset of DEVICE_PRESETS) {
      expect(preset.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
      expect(preset.family.length).toBeGreaterThan(0);
      expect(preset.logicalViewport.width).toBeGreaterThan(0);
      expect(preset.logicalViewport.height).toBeGreaterThan(0);
      expect(preset.logicalViewport.profile.length).toBeGreaterThan(0);
      expect(preset.logicalViewport.source.note.length).toBeGreaterThan(0);
      expect(preset.devicePixelRatio).toBeGreaterThan(0);
      expect(preset.input.pointer).toMatch(/^(coarse|fine)$/u);
      expect(typeof preset.input.touch).toBe("boolean");
      expect(typeof preset.input.hover).toBe("boolean");
      expect(preset.frame.style.length).toBeGreaterThan(0);
      expect(preset.frame.cornerProfile.length).toBeGreaterThan(0);
      expect(preset.frame.controls.length).toBeGreaterThan(0);

      if (preset.platform === "android") {
        expect(preset.logicalViewport.source.kind).toBe("profile");
        expect(preset.logicalViewport.androidProfile).toEqual({
          browserChrome: "excluded",
          densityDpi: preset.devicePixelRatio * 160,
          displaySize: "default",
        });
        expect(preset.logicalViewport.source.url).toContain(
          "/reference/android/util/DisplayMetrics",
        );
        expect(preset.logicalViewport.profile).toContain(
          `${preset.logicalViewport.width} × ${preset.logicalViewport.height}`,
        );
        expect(preset.logicalViewport.profile).toContain(
          `${preset.devicePixelRatio}×`,
        );
      } else {
        expect(preset.logicalViewport.androidProfile).toBeNull();
      }

      if (preset.physicalResolution) {
        expect(preset.physicalResolution.width).toBeGreaterThan(0);
        expect(preset.physicalResolution.height).toBeGreaterThan(0);
        expect(preset.physicalResolution.source.kind).toBe("manufacturer");
        expect(preset.physicalResolution.source.url).toMatch(/^https:\/\//u);
        expect(preset.physicalResolution.source.note).toContain(preset.name);
      }
    }
  });

  it("documents iPhone 16 Pro Max as 440 × 956 logical at 3×", () => {
    const preset = findPreset("iPhone 16 Pro Max");

    expect(preset.logicalViewport).toMatchObject({
      width: 440,
      height: 956,
    });
    expect(preset.devicePixelRatio).toBe(3);
    expect(preset.physicalResolution).toMatchObject({
      width: 1320,
      height: 2868,
    });
  });

  it("does not derive documented physical pixels from logical size and ratio", () => {
    const preset = findPreset("Galaxy S9+");

    expect(preset.logicalViewport).toMatchObject({
      width: 320,
      height: 658,
    });
    expect(preset.devicePixelRatio).toBe(4.5);
    expect(preset.physicalResolution).toMatchObject({
      width: 1440,
      height: 2960,
    });
    expect(preset.logicalViewport.height * preset.devicePixelRatio).toBe(2961);
  });

  it("models foldable cover and unfolded configurations explicitly", () => {
    const cover = findPreset("Galaxy Z Fold 7 — cover");
    const unfolded = findPreset("Galaxy Z Fold 7 — unfolded");

    expect(cover.fold).toMatchObject({
      state: "cover",
      crease: false,
      pairedDeviceId: unfolded.id,
    });
    expect(unfolded.fold).toMatchObject({
      state: "unfolded",
      crease: true,
      pairedDeviceId: cover.id,
    });
  });

  it("records the camera-pair cutout on clamshell cover displays", () => {
    for (const name of [
      "Galaxy Z Flip 6 — cover",
      "Galaxy Z Flip 7 — cover",
    ]) {
      expect(findPreset(name).frame).toMatchObject({
        style: "foldable-cover",
        cutout: "cover-camera-pair",
      });
    }
  });

  it("keeps every foldable pairing reciprocal", () => {
    for (const preset of DEVICE_PRESETS) {
      if (!preset.fold) continue;
      expect(preset.fold.pairedDeviceId, preset.id).not.toBeNull();
      const paired = DEVICE_PRESETS.find(
        ({ id }) => id === preset.fold?.pairedDeviceId,
      );

      expect(paired, preset.id).toBeDefined();
      expect(paired?.fold?.pairedDeviceId, preset.id).toBe(preset.id);
      expect(paired?.fold?.state, preset.id).not.toBe(preset.fold.state);
    }
  });

  it("deep-freezes presets and nested metadata", () => {
    for (const preset of DEVICE_PRESETS) {
      expect(Object.isFrozen(preset), preset.id).toBe(true);
      expect(Object.isFrozen(preset.logicalViewport), preset.id).toBe(true);
      expect(Object.isFrozen(preset.logicalViewport.source), preset.id).toBe(
        true,
      );
      if (preset.logicalViewport.androidProfile) {
        expect(
          Object.isFrozen(preset.logicalViewport.androidProfile),
          preset.id,
        ).toBe(true);
      }
      expect(Object.isFrozen(preset.input), preset.id).toBe(true);
      expect(Object.isFrozen(preset.frame), preset.id).toBe(true);
      expect(Object.isFrozen(preset.frame.controls), preset.id).toBe(true);
      if (preset.physicalResolution) {
        expect(Object.isFrozen(preset.physicalResolution), preset.id).toBe(
          true,
        );
      }
      if (preset.fold) {
        expect(Object.isFrozen(preset.fold), preset.id).toBe(true);
      }
    }
  });

  it("swaps logical and physical dimensions without replacing the preset", () => {
    const preset = findPreset("iPhone 16 Pro Max");

    expect(getViewportDimensions(preset, "portrait")).toEqual({
      width: 440,
      height: 956,
    });
    expect(getViewportDimensions(preset, "landscape")).toEqual({
      width: 956,
      height: 440,
    });
    expect(getPhysicalResolution(preset, "landscape")).toEqual({
      width: 2868,
      height: 1320,
    });
    expect(findPreset("iPhone 16 Pro Max")).toBe(preset);
  });

  it("normalizes naturally landscape devices for requested orientation", () => {
    const laptop = findPreset("Windows laptop");

    expect(getViewportDimensions(laptop, "landscape")).toEqual({
      width: 1366,
      height: 768,
    });
    expect(getViewportDimensions(laptop, "portrait")).toEqual({
      width: 768,
      height: 1366,
    });
  });

  it("does not present generic display modes as hardware panels", () => {
    expect(findPreset("Full HD desktop").physicalResolution).toBeNull();
    expect(findPreset("Ultrawide desktop").physicalResolution).toBeNull();
  });

  it.each([
    ["iPhone SE (3rd generation)", "/111866"],
    ["iPhone 13 mini", "/111873"],
    ["iPhone 14 Plus", "/111854"],
    ["iPhone 15 Pro Max", "/111828"],
    ["iPhone 16 Pro Max", "/121032"],
    ["iPad (10th generation)", "/111840"],
    ["iPad (A16)", "/ipad-11/specs/"],
    ["iPad mini (A17 Pro)", "/ipad-mini/specs/"],
    ["Galaxy S9+", "galaxy-s9"],
    ["Galaxy S24 Ultra", "galaxy-s24"],
    ["Galaxy S25 Edge", "galaxy-s25-edge"],
    ["Galaxy Z Flip 6 — unfolded", "galaxy-z-flip6"],
    ["Galaxy Tab S10 Ultra", "galaxy-tab-s10"],
    ["Pixel 9a", "pixel_9a_specs"],
  ])("uses a model-specific official source for %s", (name, pathToken) => {
    expect(findPreset(name).physicalResolution?.source.url).toContain(pathToken);
  });
});
