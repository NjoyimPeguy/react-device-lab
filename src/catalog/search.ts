import { DEVICE_PRESETS } from "./devicePresets.js";
import type { DevicePreset } from "../types/device.js";

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en");
}

export function searchDevicePresets(
  query: string,
  presets: readonly DevicePreset[] = DEVICE_PRESETS,
): readonly DevicePreset[] {
  const terms = normalize(query).trim().split(/\s+/u).filter(Boolean);
  if (terms.length === 0) return [...presets];

  return presets.filter((preset) => {
    const searchable = normalize(
      [
        preset.name,
        preset.platform,
        preset.category,
        preset.family,
        preset.fold?.state ?? "",
      ].join(" "),
    );
    return terms.every((term) => searchable.includes(term));
  });
}
