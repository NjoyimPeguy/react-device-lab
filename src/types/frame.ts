import type { ReactNode } from "react";

import type {
  DeviceOrientation,
  DevicePreset,
  ViewportDimensions,
} from "./device.js";

/** Insets reserved inside preview content, measured in logical CSS pixels. */
export interface SafeAreaInsets {
  /** Clearance from the physical top edge. */
  readonly top: number;
  /** Clearance from the physical right edge. */
  readonly right: number;
  /** Clearance from the physical bottom edge. */
  readonly bottom: number;
  /** Clearance from the physical left edge. */
  readonly left: number;
}

/** Outer rendered width and height of a device frame in CSS pixels. */
export type DeviceFrameDimensions = ViewportDimensions;

/** Props for the repository-authored {@link DeviceFrame}. */
export interface DeviceFrameProps {
  /** Device preset whose geometry and features should be rendered. */
  readonly device: DevicePreset;
  /** Preview viewport rendered inside the device screen. */
  readonly children: ReactNode;
  /** Device rotation; defaults to portrait. */
  readonly orientation?: DeviceOrientation;
  /** Whether to render the skin around the viewport; defaults to `true`. */
  readonly frameVisible?: boolean;
  /**
   * Accessible name for the framed content region; defaults to
   * `"<device name> application preview"`.
   */
  readonly contentLabel?: string;
  /** Optional class added to the frame root. */
  readonly className?: string;
  /**
   * Explicit content insets; defaults to zero when `DeviceFrame` is used
   * directly. {@link DevicePreview} supplies its resolved environment insets.
   */
  readonly safeAreaInsets?: SafeAreaInsets;
  /** Whether to display the safe-area overlay; defaults to `false`. */
  readonly showSafeArea?: boolean;
}
