import type {
  ComputeFitScaleOptions,
  PreviewZoom,
} from "../types/preview.js";

const MINIMUM_ZOOM = 0.1;
const MAXIMUM_ZOOM = 2;

function finitePositive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} must be a finite positive number.`);
  }
  return value;
}

export function computeFitScale({
  availableWidth,
  availableHeight,
  contentWidth,
  contentHeight,
  padding = 0,
  maximumScale = 1,
}: ComputeFitScaleOptions): number {
  finitePositive(availableWidth, "availableWidth");
  finitePositive(availableHeight, "availableHeight");
  finitePositive(contentWidth, "contentWidth");
  finitePositive(contentHeight, "contentHeight");
  finitePositive(maximumScale, "maximumScale");
  if (!Number.isFinite(padding) || padding < 0) {
    throw new TypeError("padding must be a finite non-negative number.");
  }

  const usableWidth = Math.max(1, availableWidth - padding * 2);
  const usableHeight = Math.max(1, availableHeight - padding * 2);
  return Math.min(
    maximumScale,
    usableWidth / contentWidth,
    usableHeight / contentHeight,
  );
}

export function resolvePreviewScale(
  zoom: PreviewZoom,
  fitScale: number,
): number {
  if (zoom === "fit") {
    finitePositive(fitScale, "fitScale");
    return Math.min(MAXIMUM_ZOOM, fitScale);
  }
  if (!Number.isFinite(zoom)) {
    throw new TypeError("zoom must be Fit or a finite number.");
  }
  return Math.min(MAXIMUM_ZOOM, Math.max(MINIMUM_ZOOM, zoom));
}
