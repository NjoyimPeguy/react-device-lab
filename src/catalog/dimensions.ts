import type {
  DeviceOrientation,
  DevicePreset,
  ViewportDimensions,
  ViewportWidthClass,
} from "../types/device.js";

function orient(
  dimensions: ViewportDimensions,
  orientation: DeviceOrientation,
): ViewportDimensions {
  const shortEdge = Math.min(dimensions.width, dimensions.height);
  const longEdge = Math.max(dimensions.width, dimensions.height);
  return orientation === "portrait"
    ? { width: shortEdge, height: longEdge }
    : { width: longEdge, height: shortEdge };
}

/**
 * Returns the exact logical iframe viewport for a device and orientation.
 *
 * @param device - Named device preset.
 * @param orientation - Requested rotation; defaults to portrait.
 * @returns Logical width and height in CSS pixels.
 */
export function getViewportDimensions(
  device: DevicePreset,
  orientation: DeviceOrientation = "portrait",
): ViewportDimensions {
  return orient(device.logicalViewport, orientation);
}

/**
 * Returns the manufacturer physical resolution in the requested orientation.
 *
 * @param device - Named device preset.
 * @param orientation - Requested rotation; defaults to portrait.
 * @returns Physical panel width and height in pixels, or `null` when unknown.
 */
export function getPhysicalResolution(
  device: DevicePreset,
  orientation: DeviceOrientation = "portrait",
): ViewportDimensions | null {
  return device.physicalResolution
    ? orient(device.physicalResolution, orientation)
    : null;
}

/**
 * Classifies an application viewport using Material-style responsive
 * breakpoints.
 *
 * @param width - Logical viewport width in CSS pixels.
 * @returns `compact` below 600 px, `medium` below 840 px, otherwise `expanded`.
 * @throws `RangeError` when width is negative or not finite.
 */
export function getViewportWidthClass(width: number): ViewportWidthClass {
  if (!Number.isFinite(width) || width < 0) {
    throw new RangeError("Viewport width must be a non-negative finite number.");
  }
  if (width < 600) return "compact";
  if (width < 840) return "medium";
  return "expanded";
}
