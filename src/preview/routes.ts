import type {
  PreviewRouteSource,
  PreviewRouteState,
} from "../types/preview.js";

const RELATIVE_ROUTE_BASE = "https://react-device-lab.invalid/";

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

export function formatPreviewRoute(route: PreviewRouteState): string {
  if (route.source === "portal") return "Portal content";
  return `${route.pathname}${route.search}${route.hash}` || "/";
}
