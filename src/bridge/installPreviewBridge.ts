import { applyPreviewEnvironment } from "../environment/applyPreviewEnvironment.js";
import {
  createPreviewReadyMessage,
  createPreviewRouteMessage,
  parsePreviewBridgeMessage,
  PREVIEW_ROUTE_EVENT,
} from "./protocol.js";
import type { InstallPreviewBridgeOptions } from "../types/bridge.js";

function normalizeAllowedOrigins(origins: readonly string[]): readonly string[] {
  if (origins.length === 0) {
    throw new TypeError("At least one allowed parent origin is required.");
  }
  return Object.freeze(
    origins.map((origin) => {
      if (origin === "*") {
        throw new TypeError("Wildcard parent origins are not supported.");
      }
      let parsed: URL;
      try {
        parsed = new URL(origin);
      } catch (error) {
        throw new TypeError(`Invalid parent origin: ${origin}`, {
          cause: error,
        });
      }
      if (
        (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
        parsed.origin !== origin
      ) {
        throw new TypeError(`Parent allowlist entries must be origins: ${origin}`);
      }
      return parsed.origin;
    }),
  );
}

/**
 * Installs the optional exact-origin bridge inside an embedded application.
 *
 * The bridge reports initial readiness and later SPA routes, accepts
 * configuration messages only from the allowed parent window and origins, and
 * applies environment attributes to the target document.
 *
 * @param options - Exact-origin policy, callbacks, and optional test windows.
 * @returns A cleanup function that removes listeners and restores environment
 * changes. During SSR it is a no-op cleanup function.
 * @throws `TypeError` in a browser (or when `targetWindow` is supplied) when
 * the origin allowlist is empty, contains a wildcard, or contains a URL that
 * is not an exact HTTP(S) origin.
 */
export function installPreviewBridge(
  options: InstallPreviewBridgeOptions,
): () => void {
  const targetWindow =
    options.targetWindow ??
    (typeof window === "undefined" ? undefined : window);
  if (!targetWindow) return () => undefined;

  const parentWindow = options.parentWindow ?? targetWindow.parent;
  const allowedOrigins = normalizeAllowedOrigins(options.allowedParentOrigins);
  let removeEnvironment: (() => void) | undefined;
  const getRoute = options.getRoute ?? (() => targetWindow.location.href);

  const reportRoute = () => {
    let message;
    try {
      message = createPreviewRouteMessage(getRoute());
    } catch {
      return;
    }
    for (const origin of allowedOrigins) {
      parentWindow.postMessage(message, origin);
    }
  };

  const onMessage = (event: MessageEvent) => {
    if (
      event.source !== parentWindow ||
      !allowedOrigins.includes(event.origin)
    ) {
      return;
    }
    const message = parsePreviewBridgeMessage(event.data);
    if (!message || message.type !== "configuration") return;

    removeEnvironment?.();
    removeEnvironment = applyPreviewEnvironment(
      targetWindow.document,
      message.payload.configuration.environment,
    );
    options.onConfiguration?.(message.payload.configuration);
  };

  targetWindow.addEventListener("message", onMessage);
  targetWindow.addEventListener("popstate", reportRoute);
  targetWindow.addEventListener("hashchange", reportRoute);
  targetWindow.document.addEventListener(PREVIEW_ROUTE_EVENT, reportRoute);

  try {
    const ready = createPreviewReadyMessage(getRoute());
    for (const origin of allowedOrigins) {
      parentWindow.postMessage(ready, origin);
    }
  } catch {
    // A non-HTTP target can install the bridge but cannot report a route.
  }

  return () => {
    targetWindow.removeEventListener("message", onMessage);
    targetWindow.removeEventListener("popstate", reportRoute);
    targetWindow.removeEventListener("hashchange", reportRoute);
    targetWindow.document.removeEventListener(PREVIEW_ROUTE_EVENT, reportRoute);
    removeEnvironment?.();
  };
}

/**
 * Immediately reports the current embedded route to one exact parent origin.
 *
 * @param targetOrigin - Exact HTTP or HTTPS parent origin.
 * @param targetWindow - Embedded window; defaults to the current browser
 * window.
 * @throws `TypeError` when a target window is available and `targetOrigin` is
 * not an exact origin, or the current location is not HTTP or HTTPS.
 */
export function notifyPreviewRoute(
  targetOrigin: string,
  targetWindow?: Window,
): void {
  const scope =
    targetWindow ?? (typeof window === "undefined" ? undefined : window);
  if (!scope) return;
  const [origin] = normalizeAllowedOrigins([targetOrigin]);
  if (!origin) return;
  scope.parent.postMessage(
    createPreviewRouteMessage(scope.location.href),
    origin,
  );
}
