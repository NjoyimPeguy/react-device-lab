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

/**
 * Computes a visual scale that fits content inside stage bounds.
 *
 * The result never mutates logical viewport dimensions.
 *
 * @param options - Available bounds, unscaled content size, padding, and cap.
 * @returns The smallest axis ratio after subtracting padding, capped by
 * `maximumScale`. If padding consumes an axis, one CSS pixel remains available
 * for a deterministic positive result.
 * @throws `TypeError` when dimensions or maximum scale are not positive
 * finite numbers, or padding is negative or not finite.
 */
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

/**
 * Resolves Fit or explicit zoom to its supported range.
 *
 * @param zoom - `"fit"` or an explicit presentation multiplier.
 * @param fitScale - Scale computed for current stage bounds.
 * @returns Fit capped at 200%, or explicit zoom clamped to 10%–200%. Fit can
 * remain below 10% when the stage requires it.
 * @throws `TypeError` when the selected numeric input is not finite or a
 * Fit scale is not positive.
 */
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
