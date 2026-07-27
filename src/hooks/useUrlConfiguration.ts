import { useEffect, useRef } from "react";

import { serializePreviewConfiguration } from "../environment/configuration.js";
import {
  PREVIEW_CONFIGURATION_URL_PARAM,
  readPreviewConfigurationFromSearch,
  writePreviewConfigurationToSearch,
} from "../preview/urlConfiguration.js";
import type { PreviewConfiguration } from "../types/preview.js";

/**
 * Synchronizes a preview configuration with the page query string.
 *
 * On mount a valid URL payload is restored through `onRestore`; afterwards
 * every state change rewrites the parameter with `history.replaceState`, so
 * preview churn never adds history entries. A later `popstate` navigation
 * restores the payload again. The hook touches no browser global outside
 * effects and emits no navigation on unmount.
 *
 * @param sync - `true` for the default parameter, a string for a custom
 * parameter name, `false` or `undefined` to disable synchronization.
 * @param configuration - Current effective configuration to persist.
 * @param onRestore - Called with a validated URL payload on mount and after
 * `popstate` navigation.
 */
export function useUrlConfiguration(
  sync: boolean | string | undefined,
  configuration: PreviewConfiguration,
  onRestore: (configuration: PreviewConfiguration) => void,
): void {
  const enabled = sync !== undefined && sync !== false;
  const param =
    typeof sync === "string" ? sync : PREVIEW_CONFIGURATION_URL_PARAM;
  const onRestoreRef = useRef(onRestore);
  const initializedRef = useRef(false);
  const lastWrittenRef = useRef<string | null>(null);

  useEffect(() => {
    onRestoreRef.current = onRestore;
  });

  useEffect(() => {
    if (!enabled) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      const restored = readPreviewConfigurationFromSearch(
        window.location.search,
        param,
      );
      if (restored !== null) {
        lastWrittenRef.current = serializePreviewConfiguration(restored);
        onRestoreRef.current(restored);
        return;
      }
    }
    let serialized: string;
    try {
      serialized = serializePreviewConfiguration(configuration);
    } catch {
      return;
    }
    if (serialized === lastWrittenRef.current) return;
    lastWrittenRef.current = serialized;
    const search = writePreviewConfigurationToSearch(
      window.location.search,
      configuration,
      param,
    );
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search}${window.location.hash}`,
    );
  }, [enabled, param, configuration]);

  useEffect(() => {
    if (!enabled) return;
    const handlePopState = () => {
      const restored = readPreviewConfigurationFromSearch(
        window.location.search,
        param,
      );
      if (restored !== null) onRestoreRef.current(restored);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, param]);
}
