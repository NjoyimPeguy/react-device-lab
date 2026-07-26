import type { CSSProperties } from "react";

import { getViewportDimensions } from "../catalog/dimensions.js";
import {
  getDeviceFrameDimensions,
  getDeviceFrameGeometry,
} from "../frames/frameGeometry.js";
import { FrameFeatures } from "../frames/FrameFeatures.js";
import type { DeviceFrameProps } from "../types/frame.js";

type FrameStyle = CSSProperties & Record<`--rdl-${string}`, string>;

function pixels(value: number): string {
  return `${value}px`;
}

/**
 * Renders a model-aware, repository-authored skin around an exact viewport.
 *
 * The frame is decorative geometry, not manufacturer artwork. Hiding it removes
 * all frame size while preserving the selected logical viewport.
 *
 * @param props - Device, orientation, content, and safe-area presentation.
 * @returns The framed preview content region.
 */
export function DeviceFrame({
  device,
  children,
  orientation = "portrait",
  frameVisible = true,
  contentLabel = `${device.name} application preview`,
  className,
  safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 },
  showSafeArea = false,
}: DeviceFrameProps) {
  const viewport = getViewportDimensions(device, orientation);
  const geometry = getDeviceFrameGeometry(device, orientation);
  const frame = getDeviceFrameDimensions(device, orientation, frameVisible);
  const shellWidth =
    viewport.width + geometry.bezel.left + geometry.bezel.right;
  const shellHeight =
    viewport.height + geometry.bezel.top + geometry.bezel.bottom;
  const frameStyle: FrameStyle = {
    width: pixels(frame.width),
    height: pixels(frame.height),
    "--rdl-bezel-top": pixels(frameVisible ? geometry.bezel.top : 0),
    "--rdl-bezel-right": pixels(frameVisible ? geometry.bezel.right : 0),
    "--rdl-bezel-bottom": pixels(frameVisible ? geometry.bezel.bottom : 0),
    "--rdl-bezel-left": pixels(frameVisible ? geometry.bezel.left : 0),
    "--rdl-cutout-height": pixels(geometry.cutoutHeight),
    "--rdl-cutout-offset": pixels(geometry.cutoutOffset),
    "--rdl-cutout-width": pixels(geometry.cutoutWidth),
    "--rdl-extension-height": pixels(
      frameVisible ? geometry.extensionHeight : 0,
    ),
    "--rdl-frame-overhang": pixels(frameVisible ? geometry.overhang : 0),
    "--rdl-frame-radius": pixels(frameVisible ? geometry.outerRadius : 0),
    "--rdl-screen-radius": pixels(
      frameVisible ? geometry.screenRadius : 0,
    ),
    "--rdl-shell-height": pixels(frameVisible ? shellHeight : viewport.height),
    "--rdl-shell-width": pixels(frameVisible ? shellWidth : viewport.width),
    "--rdl-viewport-height": pixels(viewport.height),
    "--rdl-viewport-width": pixels(viewport.width),
  };
  const safeAreaStyle: FrameStyle = {
    "--rdl-safe-top": pixels(safeAreaInsets.top),
    "--rdl-safe-right": pixels(safeAreaInsets.right),
    "--rdl-safe-bottom": pixels(safeAreaInsets.bottom),
    "--rdl-safe-left": pixels(safeAreaInsets.left),
  };
  const classes = ["rdl-frame", className].filter(Boolean).join(" ");
  const cutoutMount =
    orientation === "landscape" &&
    (device.category === "phone" || device.category === "foldable")
      ? "leading"
      : "top";

  return (
    <div
      className={classes}
      data-rdl-corner-profile={device.frame.cornerProfile}
      data-rdl-cutout-mount={cutoutMount}
      data-rdl-device-frame=""
      data-rdl-device-id={device.id}
      data-rdl-frame-style={device.frame.style}
      data-rdl-frame-visible={String(frameVisible)}
      data-rdl-fold-axis={device.fold?.axis}
      data-rdl-geometry={geometry.id}
      data-rdl-orientation={orientation}
      data-rdl-shell-tone={geometry.shellTone}
      style={frameStyle}
    >
      <div className="rdl-frame__shell">
        {frameVisible ? <FrameFeatures device={device} /> : null}
        <div
          aria-label={contentLabel}
          className="rdl-frame__viewport"
          data-rdl-viewport-height={viewport.height}
          data-rdl-viewport-width={viewport.width}
          role="region"
          style={{
            width: pixels(viewport.width),
            height: pixels(viewport.height),
          }}
        >
          <div className="rdl-frame__content">{children}</div>
          {showSafeArea ? (
            <div
              aria-hidden="true"
              className="rdl-frame__safe-area"
              data-rdl-safe-area=""
              style={safeAreaStyle}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
