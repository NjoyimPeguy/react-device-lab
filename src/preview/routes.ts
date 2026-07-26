import type {
  PreviewRouteSource,
  PreviewRouteState,
} from "../types/preview.js";

const RELATIVE_ROUTE_BASE = "https://react-device-lab.invalid/";

/**
 * Parses an absolute or relative route into immutable display state.
 *
 * @param href - Absolute URL or route relative to `base`.
 * @param source - Mechanism that supplied the route.
 * @param base - Optional absolute base URL for a relative route.
 * @returns Normalized route state.
 * @throws `TypeError` when the route is invalid or uses an unsupported
 * protocol.
 */
export function createPreviewRouteState(
  href: string,
  source: PreviewRouteSource,
  base?: string,
): PreviewRouteState {
  let url: URL;
  try {
    url = new URL(href, base ?? RELATIVE_ROUTE_BASE);
  } catch (error) {
    throw new TypeError("Preview route is not a valid URL.", { cause: error });
  }
  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:" &&
    url.href !== "about:srcdoc" &&
    url.href !== "about:blank"
  ) {
    throw new TypeError("Preview routes must use HTTP or HTTPS.");
  }
  return Object.freeze({
    href:
      !base && url.origin === new URL(RELATIVE_ROUTE_BASE).origin
        ? `${url.pathname}${url.search}${url.hash}`
        : url.href,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    source,
  });
}

/**
 * Formats route state for the lab toolbar.
 *
 * @param route - Normalized preview route state.
 * @returns `pathname + search + hash`, or a portal-content label.
 */
export function formatPreviewRoute(route: PreviewRouteState): string {
  if (route.source === "portal") return "Portal content";
  return `${route.pathname}${route.search}${route.hash}` || "/";
}
