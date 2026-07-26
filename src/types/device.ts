export type DevicePlatform = "ios" | "android" | "desktop";

export type DeviceCategory =
  | "phone"
  | "foldable"
  | "tablet"
  | "laptop"
  | "desktop"
  | "ultrawide";

export type DeviceOrientation = "portrait" | "landscape";

export type ViewportWidthClass = "compact" | "medium" | "expanded";

export type DeviceFrameStyle =
  | "phone-home-button"
  | "phone-notch"
  | "phone-island"
  | "phone-earpiece"
  | "phone-punch-hole"
  | "foldable-cover"
  | "foldable-unfolded"
  | "tablet"
  | "tablet-notch"
  | "laptop"
  | "laptop-notch"
  | "monitor"
  | "monitor-ultrawide";

export type DeviceCutoutStyle =
  | "none"
  | "dynamic-island"
  | "traditional-notch"
  | "earpiece"
  | "punch-hole"
  | "cover-camera-pair"
  | "tablet-camera"
  | "tablet-notch"
  | "laptop-notch";

export type DeviceCornerProfile =
  | "rounded-compact"
  | "rounded"
  | "rounded-large"
  | "squared";

export type DeviceFrameControl =
  | "home"
  | "mute"
  | "action"
  | "camera-control"
  | "volume"
  | "power";

export type DeviceFoldState = "cover" | "unfolded";

export type DeviceDataSourceKind = "manufacturer" | "platform" | "profile";

export interface DeviceDataSource {
  readonly kind: DeviceDataSourceKind;
  readonly url: string;
  readonly note: string;
}

export interface AndroidViewportProfile {
  readonly browserChrome: "excluded";
  readonly densityDpi: number;
  readonly displaySize: "default";
}

export interface DeviceLogicalViewport {
  readonly width: number;
  readonly height: number;
  readonly profile: string;
  readonly source: DeviceDataSource;
  readonly androidProfile: AndroidViewportProfile | null;
}

export interface DevicePhysicalResolution {
  readonly width: number;
  readonly height: number;
  readonly source: DeviceDataSource;
}

export interface DeviceInputProfile {
  readonly touch: boolean;
  readonly pointer: "coarse" | "fine";
  readonly hover: boolean;
}

export interface DeviceFrameMetadata {
  readonly style: DeviceFrameStyle;
  readonly cutout: DeviceCutoutStyle;
  readonly cornerProfile: DeviceCornerProfile;
  readonly controls: readonly DeviceFrameControl[];
}

export interface DeviceFoldMetadata {
  readonly state: DeviceFoldState;
  readonly axis: "horizontal" | "vertical";
  readonly crease: boolean;
  readonly pairedDeviceId: string | null;
}

export interface DevicePreset {
  readonly id: string;
  readonly name: string;
  readonly platform: DevicePlatform;
  readonly category: DeviceCategory;
  readonly family: string;
  readonly logicalViewport: DeviceLogicalViewport;
  readonly physicalResolution: DevicePhysicalResolution | null;
  readonly devicePixelRatio: number;
  readonly input: DeviceInputProfile;
  readonly frame: DeviceFrameMetadata;
  readonly fold: DeviceFoldMetadata | null;
}

export interface ViewportDimensions {
  readonly width: number;
  readonly height: number;
}

export interface DevicePresetGroup {
  readonly category: DeviceCategory;
  readonly label: string;
  readonly devices: readonly DevicePreset[];
}
