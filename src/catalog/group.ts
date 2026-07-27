import type {
  DeviceCategory,
  DevicePlatform,
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

const PLATFORM_LABELS: Readonly<Record<DevicePlatform, string>> = {
  android: "Android",
  ios: "iOS",
  desktop: "Desktop",
  web: "Web",
};

/**
 * Groups presets into non-empty form-factor sections in catalog order.
 *
 * A category whose presets span exactly two platforms splits into two
 * per-platform sections labeled `"<Label> — <Platform>"`, Android first;
 * categories with a single platform keep one section with the existing
 * label. Devices keep source-catalog order within every section.
 *
 * @param presets - Presets to group without mutation.
 * @returns Phone, foldable, tablet, laptop, desktop, and ultrawide sections
 * that contain at least one preset.
 *
 * @example
 * ```ts
 * const sections = groupDevicePresets(DEVICE_PRESETS);
 * for (const section of sections) {
 *   console.log(section.label, section.devices.length);
 * }
 * ```
 */
export function groupDevicePresets(
  presets: readonly DevicePreset[],
): readonly DevicePresetGroup[] {
  return GROUPS.flatMap(({ category, label }) => {
    const devices = presets.filter((preset) => preset.category === category);
    if (devices.length === 0) return [];
    const platforms = [...new Set(devices.map(({ platform }) => platform))];
    if (platforms.length !== 2) return [{ category, label, devices }];
    return platforms.sort().map((platform) => ({
      category,
      label: `${label} — ${PLATFORM_LABELS[platform]}`,
      platform,
      devices: devices.filter((device) => device.platform === platform),
    }));
  });
}
