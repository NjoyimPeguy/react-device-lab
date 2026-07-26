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
      width: 399,
      height: 815,
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
});
