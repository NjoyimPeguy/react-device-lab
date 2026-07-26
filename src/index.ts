export { DeviceFrame } from "./components/DeviceFrame.js";
export { DEVICE_PRESETS } from "./catalog/devicePresets.js";
export {
  getPhysicalResolution,
  getViewportDimensions,
  getViewportWidthClass,
} from "./catalog/dimensions.js";
export { groupDevicePresets } from "./catalog/group.js";
export { searchDevicePresets } from "./catalog/search.js";
export { getDeviceFrameDimensions } from "./frames/frameGeometry.js";

export type {
  AndroidViewportProfile,
  DeviceCategory,
  DeviceCornerProfile,
  DeviceCutoutStyle,
  DeviceDataSource,
  DeviceDataSourceKind,
  DeviceFoldMetadata,
  DeviceFoldState,
  DeviceFrameControl,
  DeviceFrameMetadata,
  DeviceFrameStyle,
  DeviceInputProfile,
  DeviceLogicalViewport,
  DeviceOrientation,
  DevicePhysicalResolution,
  DevicePlatform,
  DevicePreset,
  DevicePresetGroup,
  ViewportDimensions,
  ViewportWidthClass,
} from "./types/device.js";
export type {
  DeviceFrameDimensions,
  DeviceFrameProps,
  SafeAreaInsets,
} from "./types/frame.js";
