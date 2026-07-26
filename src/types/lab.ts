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
import type { PreviewRouteState, PreviewZoom } from "./preview.js";

export type PreviewTheme = "light" | "dark";
export type PreviewViewportMode = "device" | "custom";
export type PreviewWorkspaceMode = "fullscreen" | "bounded";

export interface PreviewDestination {
  readonly id: string;
  readonly label: string;
  readonly src: string;
}

export interface DeviceSelectorProps {
  readonly devices?: readonly DevicePreset[];
  readonly value: string;
  readonly onChange: (device: DevicePreset) => void;
  readonly searchLabel?: string;
  readonly selectLabel?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export interface PreviewConfigurationPanelProps {
  readonly devices: readonly DevicePreset[];
  readonly device: DevicePreset;
  readonly onDeviceChange: (device: DevicePreset) => void;
  readonly orientation: DeviceOrientation;
  readonly onOrientationChange: (orientation: DeviceOrientation) => void;
  readonly zoom: PreviewZoom;
  readonly onZoomChange: (zoom: PreviewZoom) => void;
  readonly frameVisible: boolean;
  readonly onFrameVisibleChange: (visible: boolean) => void;
  readonly theme: PreviewTheme;
  readonly onThemeChange: (theme: PreviewTheme) => void;
  readonly showSafeArea: boolean;
  readonly onShowSafeAreaChange: (visible: boolean) => void;
  readonly environment: PreviewEnvironment;
  readonly onEnvironmentChange: (environment: PreviewEnvironment) => void;
  readonly viewportMode: PreviewViewportMode;
  readonly onViewportModeChange: (mode: PreviewViewportMode) => void;
  readonly customViewport: ViewportDimensions;
  readonly onCustomViewportChange: (viewport: ViewportDimensions) => void;
  readonly destinations?: readonly PreviewDestination[];
  readonly destinationId?: string;
  readonly onDestinationChange?: (destination: PreviewDestination) => void;
  readonly className?: string;
}

interface DevicePreviewLabBaseProps {
  readonly devices?: readonly DevicePreset[];
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly badge?: ReactNode;
  readonly notice?: ReactNode;
  readonly className?: string;
  readonly workspaceMode?: PreviewWorkspaceMode;
  readonly deviceId?: string;
  readonly defaultDeviceId?: string;
  readonly onDeviceChange?: (device: DevicePreset) => void;
  readonly orientation?: DeviceOrientation;
  readonly defaultOrientation?: DeviceOrientation;
  readonly onOrientationChange?: (orientation: DeviceOrientation) => void;
  readonly zoom?: PreviewZoom;
  readonly defaultZoom?: PreviewZoom;
  readonly onZoomChange?: (zoom: PreviewZoom) => void;
  readonly frameVisible?: boolean;
  readonly defaultFrameVisible?: boolean;
  readonly onFrameVisibleChange?: (visible: boolean) => void;
  readonly theme?: PreviewTheme;
  readonly defaultTheme?: PreviewTheme;
  readonly onThemeChange?: (theme: PreviewTheme) => void;
  readonly showSafeArea?: boolean;
  readonly defaultShowSafeArea?: boolean;
  readonly onShowSafeAreaChange?: (visible: boolean) => void;
  readonly environment?: PreviewEnvironment;
  readonly defaultEnvironment?: PreviewEnvironmentOverrides;
  readonly onEnvironmentChange?: (environment: PreviewEnvironment) => void;
  readonly viewportMode?: PreviewViewportMode;
  readonly defaultViewportMode?: PreviewViewportMode;
  readonly onViewportModeChange?: (mode: PreviewViewportMode) => void;
  readonly customViewport?: ViewportDimensions;
  readonly defaultCustomViewport?: ViewportDimensions;
  readonly onCustomViewportChange?: (viewport: ViewportDimensions) => void;
  readonly fitPadding?: number;
  readonly onRouteChange?: (route: PreviewRouteState) => void;
}

interface DevicePreviewLabSourceProps extends DevicePreviewLabBaseProps {
  readonly src: string;
  readonly children?: never;
  readonly portalStyles?: never;
  readonly destinations?: readonly PreviewDestination[];
  readonly destinationId?: string;
  readonly defaultDestinationId?: string;
  readonly onDestinationChange?: (destination: PreviewDestination) => void;
  readonly bridgeOrigins?: readonly string[];
  readonly sandbox?: string;
  readonly allow?: string;
  readonly referrerPolicy?: HTMLIFrameElement["referrerPolicy"];
}

interface DevicePreviewLabPortalProps extends DevicePreviewLabBaseProps {
  readonly src?: never;
  readonly children: ReactNode;
  readonly portalStyles?: string;
  readonly destinations?: never;
  readonly destinationId?: never;
  readonly defaultDestinationId?: never;
  readonly onDestinationChange?: never;
  readonly bridgeOrigins?: never;
  readonly sandbox?: never;
  readonly allow?: never;
  readonly referrerPolicy?: never;
}

export type DevicePreviewLabProps =
  | DevicePreviewLabSourceProps
  | DevicePreviewLabPortalProps;
