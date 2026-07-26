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

export function getViewportDimensions(
  device: DevicePreset,
  orientation: DeviceOrientation = "portrait",
): ViewportDimensions {
  return orient(device.logicalViewport, orientation);
}

export function getPhysicalResolution(
  device: DevicePreset,
  orientation: DeviceOrientation = "portrait",
): ViewportDimensions | null {
  return device.physicalResolution
    ? orient(device.physicalResolution, orientation)
    : null;
}

export function getViewportWidthClass(width: number): ViewportWidthClass {
  if (!Number.isFinite(width) || width < 0) {
    throw new RangeError("Viewport width must be a non-negative finite number.");
  }
  if (width < 600) return "compact";
  if (width < 840) return "medium";
  return "expanded";
}
