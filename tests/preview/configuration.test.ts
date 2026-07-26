import { describe, expect, it } from "vitest";

import {
  DEFAULT_PREVIEW_ENVIRONMENT,
  applyPreviewEnvironment,
  createPreviewEnvironment,
  parsePreviewConfiguration,
  serializePreviewConfiguration,
  type PreviewConfiguration,
} from "../../src/index.js";

const configuration: PreviewConfiguration = {
  version: 1,
  deviceId: "iphone-17-pro",
  orientation: "portrait",
  zoom: "fit",
  frameVisible: true,
  environment: createPreviewEnvironment({
    colorScheme: "dark",
    direction: "rtl",
    foldPosture: "half-open",
    locale: "ar",
    permissions: {
      camera: "denied",
      geolocation: "granted",
    },
    safeArea: { top: 62, right: 0, bottom: 34, left: 0 },
    virtualKeyboard: { visible: true, height: 292 },
  }),
};

describe("preview configuration", () => {
  it("creates immutable, serializable environment defaults", () => {
    expect(DEFAULT_PREVIEW_ENVIRONMENT).toMatchObject({
      locale: "en",
      direction: "ltr",
      textScale: 1,
      colorScheme: "light",
      pointer: "coarse",
      hover: false,
      foldPosture: "flat",
    });
    expect(Object.isFrozen(DEFAULT_PREVIEW_ENVIRONMENT)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PREVIEW_ENVIRONMENT.safeArea)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PREVIEW_ENVIRONMENT.permissions)).toBe(true);
  });

  it("round-trips a versioned configuration without losing scenario data", () => {
    expect(
      parsePreviewConfiguration(serializePreviewConfiguration(configuration)),
    ).toEqual(configuration);
  });

  it.each([
    "{}",
    '{"version":2}',
    '{"version":1,"deviceId":"x","orientation":"portrait","zoom":0}',
    '{"version":1,"deviceId":"x","orientation":"upside-down","zoom":"fit","frameVisible":true,"environment":{}}',
    '{"version":1,"deviceId":"x","orientation":"portrait","zoom":"fit","frameVisible":true,"environment":{},"unknown":true}',
    '{"__proto__":{"polluted":true}}',
  ])("rejects invalid or unknown serialized data: %s", (serialized) => {
    expect(() => parsePreviewConfiguration(serialized)).toThrow(TypeError);
  });

  it("applies integrated target values without replacing browser APIs", () => {
    const originalPermissions = navigator.permissions;
    const cleanup = applyPreviewEnvironment(document, configuration.environment);
    const root = document.documentElement;

    expect(root).toHaveAttribute("lang", "ar");
    expect(root).toHaveAttribute("dir", "rtl");
    expect(root).toHaveAttribute("data-rdl-color-scheme", "dark");
    expect(root).toHaveAttribute("data-rdl-pointer", "coarse");
    expect(root).toHaveStyle({
      "--rdl-safe-area-inset-top": "62px",
      "--rdl-virtual-keyboard-height": "292px",
      "--rdl-text-scale": "1",
    });
    expect(navigator.permissions).toBe(originalPermissions);

    cleanup();
    expect(root).not.toHaveAttribute("data-rdl-color-scheme");
  });
});
