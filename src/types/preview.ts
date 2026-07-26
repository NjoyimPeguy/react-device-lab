import type { ReactNode } from "react";

import type {
  DeviceOrientation,
  DevicePreset,
  ViewportDimensions,
} from "./device.js";
import type {
  PreviewEnvironment,
  PreviewEnvironmentOverrides,
} from "./environment.js";

export type PreviewZoom = "fit" | number;

export type PreviewRouteSource =
  | "initial"
  | "same-origin"
  | "bridge"
  | "portal";

export interface PreviewRouteState {
  readonly href: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly source: PreviewRouteSource;
}

export interface PreviewConfiguration {
  readonly version: 1;
  readonly deviceId: string;
  readonly orientation: DeviceOrientation;
  readonly zoom: PreviewZoom;
  readonly frameVisible: boolean;
  readonly environment: PreviewEnvironment;
}

export interface ComputeFitScaleOptions {
  readonly availableWidth: number;
  readonly availableHeight: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly padding?: number;
  readonly maximumScale?: number;
}

export interface IframePortalProps {
  readonly children: ReactNode;
  readonly title: string;
  readonly className?: string;
  readonly styles?: string;
  readonly environment?: PreviewEnvironment;
  readonly onLoad?: (iframe: HTMLIFrameElement) => void;
}

interface DevicePreviewBaseProps {
  readonly device?: DevicePreset;
  readonly devices?: readonly DevicePreset[];
  readonly defaultDeviceId?: string;
  readonly orientation?: DeviceOrientation;
  readonly zoom?: PreviewZoom;
  readonly frameVisible?: boolean;
  readonly title?: string;
  readonly className?: string;
  readonly showSafeArea?: boolean;
  readonly environment?: PreviewEnvironmentOverrides;
  readonly fitPadding?: number;
  readonly fitBounds?: ViewportDimensions;
  readonly bridgeOrigins?: readonly string[];
  readonly sandbox?: string;
  readonly allow?: string;
  readonly referrerPolicy?: HTMLIFrameElement["referrerPolicy"];
  readonly onRouteChange?: (route: PreviewRouteState) => void;
}

interface DevicePreviewSourceProps extends DevicePreviewBaseProps {
  readonly src: string;
  readonly children?: never;
  readonly portalStyles?: never;
}

interface DevicePreviewPortalProps extends DevicePreviewBaseProps {
  readonly src?: never;
  readonly children: ReactNode;
  readonly portalStyles?: string;
}

export type DevicePreviewProps =
  | DevicePreviewSourceProps
  | DevicePreviewPortalProps;
