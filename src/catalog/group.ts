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

export function groupDevicePresets(
  presets: readonly DevicePreset[],
): readonly DevicePresetGroup[] {
  return GROUPS.map(({ category, label }) => ({
    category,
    label,
    devices: presets.filter((preset) => preset.category === category),
  })).filter(({ devices }) => devices.length > 0);
}
