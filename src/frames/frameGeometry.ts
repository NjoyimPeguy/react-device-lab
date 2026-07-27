import { getViewportDimensions } from "../catalog/dimensions.js";
import type {
  DeviceCategory,
  DeviceFrameStyle,
  DeviceOrientation,
  DevicePreset,
} from "../types/device.js";
import type { DeviceFrameDimensions } from "../types/frame.js";

interface FrameInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

interface GeometryValues {
  readonly bezel: FrameInsets;
  readonly outerRadius: number;
  readonly screenRadius: number;
  readonly extensionHeight: number;
  readonly overhang: number;
  readonly cutoutWidth: number;
  readonly cutoutHeight: number;
  readonly cutoutOffset: number;
  readonly shellTone:
    | "graphite"
    | "silver"
    | "titanium-dark"
    | "titanium-light"
    | "porcelain";
}

export interface DeviceFrameGeometry extends GeometryValues {
  readonly id: string;
}

const BASE_GEOMETRY: Readonly<Record<DeviceFrameStyle, GeometryValues>> = {
  "phone-home-button": {
    bezel: { top: 74, right: 12, bottom: 74, left: 12 },
    outerRadius: 34,
    screenRadius: 3,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 54,
    cutoutHeight: 6,
    cutoutOffset: 20,
    shellTone: "silver",
  },
  "phone-notch": {
    bezel: { top: 10, right: 10, bottom: 10, left: 10 },
    outerRadius: 52,
    screenRadius: 43,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 146,
    cutoutHeight: 31,
    cutoutOffset: 0,
    shellTone: "graphite",
  },
  "phone-island": {
    bezel: { top: 9, right: 9, bottom: 9, left: 9 },
    outerRadius: 54,
    screenRadius: 46,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 92,
    cutoutHeight: 27,
    cutoutOffset: 12,
    shellTone: "graphite",
  },
  "phone-earpiece": {
    bezel: { top: 30, right: 8, bottom: 16, left: 8 },
    outerRadius: 30,
    screenRadius: 24,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 56,
    cutoutHeight: 5,
    cutoutOffset: 12,
    shellTone: "graphite",
  },
  "phone-punch-hole": {
    bezel: { top: 7, right: 7, bottom: 7, left: 7 },
    outerRadius: 42,
    screenRadius: 35,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 13,
    cutoutHeight: 13,
    cutoutOffset: 9,
    shellTone: "graphite",
  },
  "foldable-cover": {
    bezel: { top: 8, right: 8, bottom: 8, left: 8 },
    outerRadius: 38,
    screenRadius: 31,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 13,
    cutoutHeight: 13,
    cutoutOffset: 10,
    shellTone: "graphite",
  },
  "foldable-unfolded": {
    bezel: { top: 9, right: 9, bottom: 9, left: 9 },
    outerRadius: 28,
    screenRadius: 20,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 12,
    cutoutHeight: 12,
    cutoutOffset: 10,
    shellTone: "graphite",
  },
  tablet: {
    bezel: { top: 18, right: 18, bottom: 18, left: 18 },
    outerRadius: 28,
    screenRadius: 16,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 8,
    cutoutHeight: 8,
    cutoutOffset: 6,
    shellTone: "silver",
  },
  "tablet-notch": {
    bezel: { top: 14, right: 14, bottom: 14, left: 14 },
    outerRadius: 24,
    screenRadius: 13,
    extensionHeight: 0,
    overhang: 0,
    cutoutWidth: 42,
    cutoutHeight: 12,
    cutoutOffset: 0,
    shellTone: "graphite",
  },
  laptop: {
    bezel: { top: 17, right: 13, bottom: 22, left: 13 },
    outerRadius: 16,
    screenRadius: 9,
    extensionHeight: 28,
    overhang: 28,
    cutoutWidth: 7,
    cutoutHeight: 7,
    cutoutOffset: 6,
    shellTone: "silver",
  },
  "laptop-notch": {
    bezel: { top: 12, right: 11, bottom: 18, left: 11 },
    outerRadius: 14,
    screenRadius: 8,
    extensionHeight: 30,
    overhang: 34,
    cutoutWidth: 94,
    cutoutHeight: 20,
    cutoutOffset: 0,
    shellTone: "silver",
  },
  monitor: {
    bezel: { top: 12, right: 12, bottom: 28, left: 12 },
    outerRadius: 9,
    screenRadius: 2,
    extensionHeight: 74,
    overhang: 0,
    cutoutWidth: 7,
    cutoutHeight: 7,
    cutoutOffset: 4,
    shellTone: "graphite",
  },
  "monitor-ultrawide": {
    bezel: { top: 10, right: 10, bottom: 24, left: 10 },
    outerRadius: 12,
    screenRadius: 5,
    extensionHeight: 70,
    overhang: 0,
    cutoutWidth: 7,
    cutoutHeight: 7,
    cutoutOffset: 4,
    shellTone: "graphite",
  },
};

const MODEL_OVERRIDES: Readonly<
  Record<string, Partial<Omit<GeometryValues, "bezel">> & { bezel?: FrameInsets }>
> = {
  "iphone-13-mini": {
    bezel: { top: 9, right: 9, bottom: 9, left: 9 },
    outerRadius: 49,
    screenRadius: 41,
    cutoutWidth: 132,
  },
  "iphone-14-plus": {
    outerRadius: 56,
    screenRadius: 48,
  },
  "iphone-16e": {
    outerRadius: 54,
    screenRadius: 46,
    cutoutWidth: 139,
  },
  "iphone-air": {
    bezel: { top: 7, right: 7, bottom: 7, left: 7 },
    outerRadius: 58,
    screenRadius: 52,
    cutoutWidth: 88,
    cutoutHeight: 26,
  },
  "iphone-17-pro-max": {
    bezel: { top: 8, right: 8, bottom: 8, left: 8 },
    outerRadius: 62,
    screenRadius: 54,
    cutoutWidth: 94,
  },
  "galaxy-s25-edge": {
    bezel: { top: 5, right: 5, bottom: 5, left: 5 },
    outerRadius: 48,
    screenRadius: 43,
    cutoutWidth: 12,
    cutoutHeight: 12,
  },
  "galaxy-s24-ultra": {
    outerRadius: 20,
    screenRadius: 14,
  },
  "galaxy-s25-ultra": {
    bezel: { top: 6, right: 6, bottom: 6, left: 6 },
    outerRadius: 25,
    screenRadius: 19,
    cutoutWidth: 12,
    cutoutHeight: 12,
  },
  "galaxy-s26-ultra": {
    outerRadius: 28,
    screenRadius: 22,
  },
  "galaxy-z-flip-6-cover": {
    outerRadius: 44,
    screenRadius: 37,
    cutoutWidth: 76,
    cutoutHeight: 34,
    cutoutOffset: 16,
  },
  "galaxy-z-flip-7-cover": {
    outerRadius: 47,
    screenRadius: 40,
    cutoutWidth: 82,
    cutoutHeight: 36,
    cutoutOffset: 17,
  },
  "galaxy-z-flip-6": {
    outerRadius: 43,
    screenRadius: 35,
  },
  "galaxy-z-flip-7": {
    outerRadius: 45,
    screenRadius: 37,
  },
  "galaxy-z-fold-6-unfolded": {
    outerRadius: 24,
    screenRadius: 17,
  },
  "galaxy-z-fold-7-unfolded": {
    bezel: { top: 7, right: 7, bottom: 7, left: 7 },
    outerRadius: 23,
    screenRadius: 17,
  },
  "pixel-9-pro-fold-unfolded": {
    outerRadius: 34,
    screenRadius: 27,
  },
  "ipad-mini": {
    bezel: { top: 16, right: 16, bottom: 16, left: 16 },
    outerRadius: 31,
    screenRadius: 18,
  },
  "ipad-pro-11": {
    bezel: { top: 14, right: 14, bottom: 14, left: 14 },
  },
  "ipad-pro-13": {
    bezel: { top: 15, right: 15, bottom: 15, left: 15 },
  },
  "galaxy-tab-s10-ultra": {
    cutoutWidth: 46,
    cutoutHeight: 13,
  },
  "galaxy-tab-s11-ultra": {
    cutoutWidth: 44,
    cutoutHeight: 12,
  },
  "macbook-air-13": {
    extensionHeight: 32,
    overhang: 38,
    cutoutWidth: 102,
    cutoutHeight: 21,
  },
  "surface-pro-9": {
    bezel: { top: 16, right: 16, bottom: 16, left: 16 },
    extensionHeight: 18,
    overhang: 4,
    outerRadius: 12,
  },
};

const MODEL_FAMILY_OVERRIDES: Readonly<
  Partial<
    Record<
      string,
      Partial<Omit<GeometryValues, "bezel">> & { bezel?: FrameInsets }
    >
  >
> = {
  Pixel: {
    outerRadius: 47,
    screenRadius: 40,
  },
  "Pixel 8": {
    outerRadius: 45,
    screenRadius: 38,
  },
  "Pixel 9": {
    outerRadius: 48,
    screenRadius: 41,
  },
  "Pixel 10": {
    outerRadius: 49,
    screenRadius: 42,
  },
};

function rotateInsetsClockwise(insets: FrameInsets): FrameInsets {
  return {
    top: insets.left,
    right: insets.top,
    bottom: insets.right,
    left: insets.bottom,
  };
}

function isRotatableCategory(category: DeviceCategory): boolean {
  return (
    category === "phone" ||
    category === "foldable" ||
    category === "tablet"
  );
}

export function getDeviceFrameGeometry(
  device: DevicePreset,
  orientation: DeviceOrientation = "portrait",
): DeviceFrameGeometry {
  const base = BASE_GEOMETRY[device.frame.style];
  const familyOverride =
    MODEL_FAMILY_OVERRIDES[device.family] ??
    (device.family.startsWith("Pixel")
      ? MODEL_FAMILY_OVERRIDES["Pixel"]
      : undefined);
  const modelOverride = MODEL_OVERRIDES[device.id];
  const unrotatedBezel =
    modelOverride?.bezel ?? familyOverride?.bezel ?? base.bezel;
  const bezel =
    orientation === "landscape" && isRotatableCategory(device.category)
      ? rotateInsetsClockwise(unrotatedBezel)
      : unrotatedBezel;

  return {
    ...base,
    ...familyOverride,
    ...modelOverride,
    id: device.id,
    bezel,
  };
}

/**
 * Returns the rendered outer size of a device preview.
 *
 * @param device - Preset whose model-aware frame geometry is measured.
 * @param orientation - Requested rotation; defaults to portrait.
 * @param frameVisible - Whether bezel, controls, and extensions are included.
 * @returns Outer width and height in CSS pixels. With a hidden frame, these
 * equal the logical viewport dimensions.
 */
export function getDeviceFrameDimensions(
  device: DevicePreset,
  orientation: DeviceOrientation = "portrait",
  frameVisible = true,
): DeviceFrameDimensions {
  const viewport = getViewportDimensions(device, orientation);
  if (!frameVisible) return viewport;

  const geometry = getDeviceFrameGeometry(device, orientation);
  return {
    width:
      viewport.width +
      geometry.bezel.left +
      geometry.bezel.right +
      geometry.overhang * 2,
    height:
      viewport.height +
      geometry.bezel.top +
      geometry.bezel.bottom +
      geometry.extensionHeight,
  };
}
