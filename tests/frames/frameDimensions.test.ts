import { describe, expect, it } from "vitest";

import {
  DEVICE_PRESETS,
  getDeviceFrameDimensions,
  type DevicePreset,
} from "../../src/index.js";

function findPreset(name: string): DevicePreset {
  const preset = DEVICE_PRESETS.find((candidate) => candidate.name === name);
  expect(preset, name).toBeDefined();
  return preset as DevicePreset;
}

describe("frame dimensions", () => {
  it("adds profile-specific frame chrome to the requested orientation", () => {
    const phone = findPreset("iPhone SE (3rd generation)");
    const monitor = findPreset("Full HD desktop");

    expect(getDeviceFrameDimensions(phone, "portrait", true)).toEqual({
      width: 423,
      height: 859,
    });
    expect(getDeviceFrameDimensions(monitor, "landscape", true)).toEqual({
      width: 1944,
      height: 1194,
    });
  });

  it("returns exact target dimensions when frame chrome is hidden", () => {
    const foldable = findPreset("Galaxy Z Fold 7 — unfolded");

    expect(getDeviceFrameDimensions(foldable, "portrait", false)).toEqual({
      width: 884,
      height: 982,
    });
    expect(getDeviceFrameDimensions(foldable, "landscape", false)).toEqual({
      width: 982,
      height: 884,
    });
  });

  it("reflects the corrected Android density profiles in outer frame size", () => {
    const s9Plus = findPreset("Galaxy S9+");
    const a55 = findPreset("Galaxy A55");

    expect(getDeviceFrameDimensions(s9Plus, "portrait", false)).toEqual({
      width: 411,
      height: 846,
    });
    expect(getDeviceFrameDimensions(s9Plus, "portrait", true)).toEqual({
      width: 427,
      height: 898,
    });
    expect(getDeviceFrameDimensions(a55, "portrait", false)).toEqual({
      width: 360,
      height: 780,
    });
    expect(getDeviceFrameDimensions(a55, "portrait", true)).toEqual({
      width: 384,
      height: 813,
    });
  });

  it("frames the landscape-native unfolded panel around its base orientation", () => {
    const foldable = findPreset("Galaxy Z Fold 8 — unfolded");

    expect(getDeviceFrameDimensions(foldable, "landscape", false)).toEqual({
      width: 1088,
      height: 821,
    });
    expect(getDeviceFrameDimensions(foldable, "portrait", false)).toEqual({
      width: 821,
      height: 1088,
    });
    expect(getDeviceFrameDimensions(foldable, "landscape", true)).toEqual({
      width: 1136,
      height: 869,
    });
  });

  it("frames the Galaxy Tab S11 with the calibrated Tab S9 panel geometry", () => {
    const tablet = findPreset("Galaxy Tab S11");

    expect(getDeviceFrameDimensions(tablet, "portrait", false)).toEqual({
      width: 640,
      height: 1024,
    });
    expect(getDeviceFrameDimensions(tablet, "portrait", true)).toEqual({
      width: 684,
      height: 1068,
    });
    expect(getDeviceFrameDimensions(tablet, "landscape", true)).toEqual({
      width: 1068,
      height: 684,
    });
  });

  it("frames the Ultrawide QHD profile with the ultrawide monitor chrome", () => {
    const display = findPreset("Ultrawide QHD desktop");

    expect(getDeviceFrameDimensions(display, "landscape", false)).toEqual({
      width: 3440,
      height: 1440,
    });
    expect(getDeviceFrameDimensions(display, "landscape", true)).toEqual({
      width: 3460,
      height: 1544,
    });
  });
});
