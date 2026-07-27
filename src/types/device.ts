/** Operating-system family or display environment represented by a preset. */
export type DevicePlatform = "ios" | "android" | "desktop" | "web";

/** Form-factor group used to organize presets in selectors and catalogs. */
export type DeviceCategory =
  | "phone"
  | "foldable"
  | "tablet"
  | "laptop"
  | "desktop"
  | "ultrawide";

/** Rotation applied to a preset's logical and physical dimensions. */
export type DeviceOrientation = "portrait" | "landscape";

/**
 * Responsive layout class derived from logical viewport width.
 *
 * Compact is below 600 px, medium is 600–839 px, and expanded is 840 px or
 * wider.
 */
export type ViewportWidthClass = "compact" | "medium" | "expanded";

/** Repository-authored frame treatment used to render a preset. */
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

/** Screen cutout represented by a device frame. */
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

/** Outer screen-corner geometry represented by a device frame. */
export type DeviceCornerProfile =
  | "rounded-compact"
  | "rounded"
  | "rounded-large"
  | "squared";

/** Physical control represented on the side or face of a device frame. */
export type DeviceFrameControl =
  | "home"
  | "mute"
  | "action"
  | "camera-control"
  | "volume"
  | "power";

/** Display configuration represented by a foldable preset. */
export type DeviceFoldState = "cover" | "unfolded";

/** Authority class for a device-data source. */
export type DeviceDataSourceKind = "manufacturer" | "platform" | "profile";

/** Provenance for one device-data fact or selected browser profile. */
export interface DeviceDataSource {
  /** Kind of authority represented by the source. */
  readonly kind: DeviceDataSourceKind;
  /** Stable public URL for the source. */
  readonly url: string;
  /** Explanation of the fact derived from the source. */
  readonly note: string;
}

/**
 * Selected Android browser viewport profile.
 *
 * Android logical viewports vary with display-size and density settings. This
 * metadata records the deterministic default used by the preset.
 */
export interface AndroidViewportProfile {
  /** Whether browser chrome is excluded from the logical viewport. */
  readonly browserChrome: "excluded";
  /** Density selected for CSS pixel conversion, in dots per inch. */
  readonly densityDpi: number;
  /** Android display-size setting represented by the profile. */
  readonly displaySize: "default";
}

/** Logical browser viewport and the provenance of that selected profile. */
export interface DeviceLogicalViewport {
  /** Portrait logical width in CSS pixels. */
  readonly width: number;
  /** Portrait logical height in CSS pixels. */
  readonly height: number;
  /** Human-readable description of the browser or platform profile. */
  readonly profile: string;
  /** Source for the logical dimensions or profile decision. */
  readonly source: DeviceDataSource;
  /** Android-specific scaling metadata, or `null` for other platforms. */
  readonly androidProfile: AndroidViewportProfile | null;
}

/** Manufacturer-reported physical panel resolution. */
export interface DevicePhysicalResolution {
  /** Portrait panel width in physical pixels. */
  readonly width: number;
  /** Portrait panel height in physical pixels. */
  readonly height: number;
  /** Manufacturer source for the panel resolution. */
  readonly source: DeviceDataSource;
}

/** Pointer and hover capabilities applied to preview content. */
export interface DeviceInputProfile {
  /** Whether the preset represents a touch-capable device. */
  readonly touch: boolean;
  /** Primary-pointer precision exposed by the selected profile. */
  readonly pointer: "coarse" | "fine";
  /** Whether the selected profile has a primary hover capability. */
  readonly hover: boolean;
}

/** Visual metadata used by the repository-authored frame renderer. */
export interface DeviceFrameMetadata {
  /** High-level frame geometry. */
  readonly style: DeviceFrameStyle;
  /** Screen cutout or camera treatment. */
  readonly cutout: DeviceCutoutStyle;
  /** Outer screen-corner profile. */
  readonly cornerProfile: DeviceCornerProfile;
  /** Physical controls drawn on the frame. */
  readonly controls: readonly DeviceFrameControl[];
}

/** Fold state and crease metadata for a foldable preset. */
export interface DeviceFoldMetadata {
  /** Cover-screen or unfolded configuration. */
  readonly state: DeviceFoldState;
  /** Axis along which the visual crease runs. */
  readonly axis: "horizontal" | "vertical";
  /** Whether the frame should render a crease. */
  readonly crease: boolean;
  /** Stable id of the corresponding cover or unfolded preset, if available. */
  readonly pairedDeviceId: string | null;
}

/**
 * Complete immutable definition of a named preview device.
 *
 * Logical viewport size, physical panel resolution, and device pixel ratio are
 * independent facts and must not be derived from one another.
 */
export interface DevicePreset {
  /** Permanent machine-readable identifier. */
  readonly id: string;
  /** Unique human-readable catalog name. */
  readonly name: string;
  /** Platform family represented by the preset. */
  readonly platform: DevicePlatform;
  /** Form-factor category used for grouping. */
  readonly category: DeviceCategory;
  /** Device family name used by catalog search. */
  readonly family: string;
  /** Authoritative browser viewport used by the iframe. */
  readonly logicalViewport: DeviceLogicalViewport;
  /** Physical panel resolution, or `null` when no reliable value is known. */
  readonly physicalResolution: DevicePhysicalResolution | null;
  /** Default ratio of physical pixels to logical CSS pixels. */
  readonly devicePixelRatio: number;
  /** Touch, pointer, and hover profile. */
  readonly input: DeviceInputProfile;
  /** Repository-authored visual frame metadata. */
  readonly frame: DeviceFrameMetadata;
  /** Foldable configuration, or `null` for non-foldable devices. */
  readonly fold: DeviceFoldMetadata | null;
}

/** Two-dimensional size in CSS pixels unless a containing contract says otherwise. */
export interface ViewportDimensions {
  /** Horizontal extent. */
  readonly width: number;
  /** Vertical extent. */
  readonly height: number;
}

/** One non-empty catalog section returned by {@link groupDevicePresets}. */
export interface DevicePresetGroup {
  /** Form-factor represented by the section. */
  readonly category: DeviceCategory;
  /** Human-readable section label. */
  readonly label: string;
  /**
   * Platform shared by every device in the section. Present only when the
   * category splits into per-platform sections; omitted on unsplit sections.
   */
  readonly platform?: DevicePlatform;
  /** Presets in source-catalog order. */
  readonly devices: readonly DevicePreset[];
}
