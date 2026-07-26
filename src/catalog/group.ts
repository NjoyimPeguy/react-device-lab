import type {
  DeviceCategory,
  DevicePreset,
  DevicePresetGroup,
} from "../types/device.js";

const GROUPS: readonly {
  readonly category: DeviceCategory;
  readonly label: string;
}[] = [
  { category: "phone", label: "Phones" },
  { category: "foldable", label: "Foldables" },
  { category: "tablet", label: "Tablets" },
  { category: "laptop", label: "Laptops" },
  { category: "desktop", label: "Desktop displays" },
  { category: "ultrawide", label: "Ultrawide displays" },
];

/**
 * Groups presets into non-empty form-factor sections in catalog order.
 *
 * @param presets - Presets to group without mutation.
 * @returns Phone, foldable, tablet, laptop, desktop, and ultrawide sections
 * that contain at least one preset.
 */
export function groupDevicePresets(
  presets: readonly DevicePreset[],
): readonly DevicePresetGroup[] {
  return GROUPS.map(({ category, label }) => ({
    category,
    label,
    devices: presets.filter((preset) => preset.category === category),
  })).filter(({ devices }) => devices.length > 0);
}
