import { parsePreviewConfiguration } from "../environment/configuration.js";
import type {
  PreviewBridgeConfigurationMessage,
  PreviewBridgeMessage,
  PreviewBridgeReadyMessage,
  PreviewBridgeRouteMessage,
} from "../types/bridge.js";
import type { PreviewConfiguration } from "../types/preview.js";

/** Namespace required on every preview bridge message. */
export const PREVIEW_BRIDGE_NAMESPACE = "react-device-lab" as const;
/** Current preview bridge protocol version. */
export const PREVIEW_BRIDGE_VERSION = 1 as const;
/**
 * Document event name a cooperating SPA can dispatch after client-side
 * navigation.
 */
export const PREVIEW_ROUTE_EVENT = "react-device-lab:route-change" as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: UnknownRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function normalizeRouteHref(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch (error) {
    throw new TypeError("Preview bridge routes must be absolute URLs.", {
      cause: error,
    });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("Preview bridge routes must use HTTP or HTTPS.");
  }
  return url.href;
}

/**
 * Creates an immutable route message for an absolute HTTP or HTTPS URL.
 *
 * @param href - Absolute route reported by the embedded application.
 * @returns A validated version 1 route message.
 * @throws `TypeError` when `href` is invalid or uses another protocol.
 */
export function createPreviewRouteMessage(
  href: string,
): PreviewBridgeRouteMessage {
  return Object.freeze({
    namespace: PREVIEW_BRIDGE_NAMESPACE,
    version: PREVIEW_BRIDGE_VERSION,
    type: "route",
    payload: Object.freeze({ href: normalizeRouteHref(href) }),
  });
}

/**
 * Creates an immutable bridge-ready message for the embedded application.
 *
 * @param href - Absolute current HTTP or HTTPS route.
 * @returns A validated version 1 readiness message.
 * @throws `TypeError` when `href` is invalid or uses another protocol.
 */
export function createPreviewReadyMessage(
  href: string,
): PreviewBridgeReadyMessage {
  return Object.freeze({
    namespace: PREVIEW_BRIDGE_NAMESPACE,
    version: PREVIEW_BRIDGE_VERSION,
    type: "ready",
    payload: Object.freeze({ href: normalizeRouteHref(href) }),
  });
}

/**
 * Creates an immutable host-to-preview configuration message.
 *
 * @param configuration - Complete version 1 configuration to validate.
 * @returns A message containing a normalized immutable configuration.
 * @throws `TypeError` when the configuration is invalid.
 */
export function createPreviewConfigurationMessage(
  configuration: PreviewConfiguration,
): PreviewBridgeConfigurationMessage {
  return Object.freeze({
    namespace: PREVIEW_BRIDGE_NAMESPACE,
    version: PREVIEW_BRIDGE_VERSION,
    type: "configuration",
    payload: Object.freeze({
      configuration: parsePreviewConfiguration(configuration),
    }),
  });
}

/**
 * Parses untrusted `postMessage` data without throwing.
 *
 * @param value - Arbitrary value received from a window message.
 * @returns A normalized message when the namespace, version, shape, and payload
 * are valid; otherwise `null`.
 */
export function parsePreviewBridgeMessage(
  value: unknown,
): PreviewBridgeMessage | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["namespace", "version", "type", "payload"]) ||
    value["namespace"] !== PREVIEW_BRIDGE_NAMESPACE ||
    value["version"] !== PREVIEW_BRIDGE_VERSION ||
    !isRecord(value["payload"])
  ) {
    return null;
  }

  if (value["type"] === "route" || value["type"] === "ready") {
    if (
      !hasExactKeys(value["payload"], ["href"]) ||
      typeof value["payload"]["href"] !== "string"
    ) {
      return null;
    }
    try {
      return value["type"] === "route"
        ? createPreviewRouteMessage(value["payload"]["href"])
        : createPreviewReadyMessage(value["payload"]["href"]);
    } catch {
      return null;
    }
  }

  if (
    value["type"] === "configuration" &&
    hasExactKeys(value["payload"], ["configuration"])
  ) {
    try {
      return createPreviewConfigurationMessage(
        parsePreviewConfiguration(value["payload"]["configuration"]),
      );
    } catch {
      return null;
    }
  }

  return null;
}
