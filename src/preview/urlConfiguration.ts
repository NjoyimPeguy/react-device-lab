import {
  parsePreviewConfiguration,
  serializePreviewConfiguration,
} from "../environment/configuration.js";
import type { PreviewConfiguration } from "../types/preview.js";

/**
 * Default query parameter carrying a serialized {@link PreviewConfiguration}.
 *
 * The payload under this parameter is
 * `encodeURIComponent(serializePreviewConfiguration(configuration))`.
 */
export const PREVIEW_CONFIGURATION_URL_PARAM = "rdl";

/**
 * Reads and validates a preview configuration from a URL query string.
 *
 * The reader is pure and safe at storage boundaries: it returns `null` for a
 * missing parameter, malformed percent-encoding, invalid JSON, or a payload
 * that fails version 1 validation, and never throws.
 *
 * @param search - Query string, with or without the leading `?`.
 * @param param - Parameter carrying the payload; defaults to
 * {@link PREVIEW_CONFIGURATION_URL_PARAM}.
 * @returns The normalized immutable configuration, or `null`.
 */
export function readPreviewConfigurationFromSearch(
  search: string,
  param: string = PREVIEW_CONFIGURATION_URL_PARAM,
): PreviewConfiguration | null {
  try {
    const payload = new URLSearchParams(search).get(param);
    if (payload === null) return null;
    return parsePreviewConfiguration(payload);
  } catch {
    return null;
  }
}

/**
 * Serializes a preview configuration into a URL query string.
 *
 * Unrelated parameters keep their original order; the configuration parameter
 * replaces any existing value and is appended last. The result always begins
 * with `?`, matching the `location.search` format.
 *
 * @param search - Current query string, with or without the leading `?`.
 * @param configuration - Configuration to validate and serialize.
 * @param param - Parameter carrying the payload; defaults to
 * {@link PREVIEW_CONFIGURATION_URL_PARAM}.
 * @returns A query string preserving unrelated parameters.
 * @throws `TypeError` when the configuration is invalid.
 */
export function writePreviewConfigurationToSearch(
  search: string,
  configuration: PreviewConfiguration,
  param: string = PREVIEW_CONFIGURATION_URL_PARAM,
): string {
  const payload = `${encodeURIComponent(param)}=${encodeURIComponent(
    serializePreviewConfiguration(configuration),
  )}`;
  const preserved = new URLSearchParams(search);
  preserved.delete(param);
  const rest = preserved.toString();
  return rest === "" ? `?${payload}` : `?${rest}&${payload}`;
}
