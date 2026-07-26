import { useId, useMemo, useState } from "react";

import { DEVICE_PRESETS } from "../catalog/devicePresets.js";
import { groupDevicePresets } from "../catalog/group.js";
import { searchDevicePresets } from "../catalog/search.js";
import type { DeviceSelectorProps } from "../types/lab.js";

/**
 * Renders a searchable, grouped device catalog with native keyboard controls.
 *
 * @param props - Catalog, selected id, labels, and change callback.
 * @returns Accessible search and grouped selection controls.
 */
export function DeviceSelector({
  devices = DEVICE_PRESETS,
  value,
  onChange,
  searchLabel = "Search devices",
  selectLabel = "Device",
  disabled = false,
  className,
}: DeviceSelectorProps) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const selectId = useId();
  const matches = useMemo(
    () => searchDevicePresets(query, devices),
    [devices, query],
  );
  const groups = useMemo(() => groupDevicePresets(matches), [matches]);
  const classes = ["rdl-device-selector", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <label htmlFor={searchId}>{searchLabel}</label>
      <input
        autoComplete="off"
        disabled={disabled}
        id={searchId}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Search name, family, or platform"
        type="search"
        value={query}
      />
      <label htmlFor={selectId}>{selectLabel}</label>
      <select
        disabled={disabled}
        id={selectId}
        onChange={(event) => {
          const selected = devices.find(
            (device) => device.id === event.currentTarget.value,
          );
          if (selected) onChange(selected);
        }}
        value={matches.some((device) => device.id === value) ? value : ""}
      >
        {matches.length === 0 ? (
          <option value="">No matching devices</option>
        ) : null}
        {groups.map((group) => (
          <optgroup key={group.category} label={group.label}>
            {group.devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
