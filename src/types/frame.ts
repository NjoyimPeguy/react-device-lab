import type { ReactNode } from "react";

import type {
  DeviceOrientation,
  DevicePreset,
  ViewportDimensions,
} from "./device.js";

export interface SafeAreaInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export type DeviceFrameDimensions = ViewportDimensions;

export interface DeviceFrameProps {
  readonly device: DevicePreset;
  readonly children: ReactNode;
  readonly orientation?: DeviceOrientation;
  readonly frameVisible?: boolean;
  readonly contentLabel?: string;
  readonly className?: string;
  readonly safeAreaInsets?: SafeAreaInsets;
  readonly showSafeArea?: boolean;
}
