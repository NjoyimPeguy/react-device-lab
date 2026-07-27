import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DEVICE_PRESETS } from "../catalog/devicePresets.js";
import {
  createPreviewConfigurationMessage,
  parsePreviewBridgeMessage,
} from "../bridge/protocol.js";
import { applyPreviewEnvironment } from "../environment/applyPreviewEnvironment.js";
import { createPreviewEnvironment } from "../environment/configuration.js";
import { PreviewEnvironmentProvider } from "../environment/PreviewEnvironmentContext.js";
import { getDeviceFrameDimensions } from "../frames/frameGeometry.js";
import { useElementSize } from "../hooks/useElementSize.js";
import {
  createPreviewRouteState,
  formatPreviewRoute,
} from "../preview/routes.js";
import {
  computeFitScale,
  resolvePreviewScale,
} from "../preview/scaling.js";
import type { DevicePreset, ViewportDimensions } from "../types/device.js";
import type {
  DevicePreviewProps,
  PreviewConfiguration,
  PreviewRouteSource,
  PreviewRouteState,
} from "../types/preview.js";
import { DeviceFrame } from "./DeviceFrame.js";
import { IframePortal } from "./IframePortal.js";
import { VirtualKeyboard } from "./VirtualKeyboard.js";

const DEFAULT_DEVICE = DEVICE_PRESETS[0] as DevicePreset;
const PORTAL_ROUTE = createPreviewRouteState("about:srcdoc", "portal");

function resolveDevice(props: DevicePreviewProps): DevicePreset {
  if (props.device) return props.device;
  const devices = props.devices ?? DEVICE_PRESETS;
  if (props.defaultDeviceId) {
    const selected = devices.find(
      (device) => device.id === props.defaultDeviceId,
    );
    if (selected) return selected;
  }
  return devices[0] ?? DEFAULT_DEVICE;
}

function getOrigin(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

function canInspectFrame(iframe: HTMLIFrameElement): boolean {
  if (typeof window === "undefined") return false;
  const declaredSource = iframe.getAttribute("src");
  if (!declaredSource) return false;
  const frameOrigin = getOrigin(declaredSource);
  if (frameOrigin !== window.location.origin) return false;
  if (
    iframe.hasAttribute("sandbox") &&
    !iframe.sandbox.contains("allow-same-origin")
  ) {
    return false;
  }
  return true;
}

function isDomElement(target: EventTarget | null): target is Element {
  return (
    target !== null &&
    "nodeType" in target &&
    target.nodeType === 1 &&
    "closest" in target &&
    typeof target.closest === "function"
  );
}

function routeFromLocation(
  iframe: HTMLIFrameElement,
  source: PreviewRouteSource,
  inspectionAllowed: boolean,
): PreviewRouteState | null {
  if (!inspectionAllowed) return null;
  try {
    const href = iframe.contentWindow?.location.href;
    if (!href || href === "about:blank" || href === "about:srcdoc") {
      return null;
    }
    return createPreviewRouteState(href, source);
  } catch {
    return null;
  }
}

function equalRoute(
  left: PreviewRouteState,
  right: PreviewRouteState,
): boolean {
  return left.href === right.href && left.source === right.source;
}

function initialRoute(props: DevicePreviewProps): PreviewRouteState {
  return "src" in props && props.src !== undefined
    ? createPreviewRouteState(props.src, "initial")
    : createPreviewRouteState("about:srcdoc", "portal");
}

/**
 * Renders one application inside an exact named-device or portal iframe
 * viewport.
 *
 * Zoom transforms only the outer presentation. The iframe's logical width,
 * height, media queries, and `window.innerWidth` remain authoritative.
 * Explicit numeric zoom is clamped before both presentation and bridge
 * configuration are applied.
 * Same-origin routes are observed directly; cross-origin routes require the
 * optional exact-origin bridge.
 *
 * @param props - Mutually exclusive URL or React-portal preview props.
 * @returns A framed and visually scaled application viewport.
 *
 * @example
 * ```tsx
 * <DevicePreview
 *   defaultDeviceId="iphone-17-pro"
 *   src="http://localhost:3000"
 * />
 * ```
 */
export function DevicePreview(props: DevicePreviewProps) {
  const device = resolveDevice(props);
  const orientation = props.orientation ?? "portrait";
  const zoom = props.zoom ?? "fit";
  const frameVisible = props.frameVisible ?? true;
  const fitPadding = props.fitPadding ?? 24;
  const isSource = "src" in props && props.src !== undefined;
  const sourceUrl = isSource ? props.src : undefined;
  const bridgeOrigins = props.bridgeOrigins;
  const onRouteChange = props.onRouteChange;
  const frameDimensions = getDeviceFrameDimensions(
    device,
    orientation,
    frameVisible,
  );
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const measuredBounds = useElementSize(stage);
  const bounds = props.fitBounds ?? measuredBounds;
  const fitScale =
    bounds.width > 0 && bounds.height > 0
      ? computeFitScale({
          availableWidth: bounds.width,
          availableHeight: bounds.height,
          contentWidth: frameDimensions.width,
          contentHeight: frameDimensions.height,
          padding: fitPadding,
        })
      : 1;
  const scale = resolvePreviewScale(zoom, fitScale);
  const environment = useMemo(
    () =>
      createPreviewEnvironment({
        pointer: device.input.pointer,
        hover: device.input.hover,
        ...props.environment,
      }),
    [
      device.input.hover,
      device.input.pointer,
      props.environment,
    ],
  );
  const [route, setRoute] = useState(() => initialRoute(props));
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const [portalKey, setPortalKey] = useState(0);
  const [sourceReload, setSourceReload] = useState<{
    readonly generation: number;
    readonly href: string;
    readonly sourceUrl: string;
  } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadedSourceFrame = useRef<HTMLIFrameElement | null>(null);
  const inspectionSuspended = useRef(false);
  const expectedNavigationOrigin = useRef<string | null>(null);
  const currentBridgeOrigin = useRef<string | null>(null);
  const removeTargetEnvironment = useRef<(() => void) | undefined>(undefined);
  const removeBeforeUnload = useRef<(() => void) | undefined>(undefined);
  const title = props.title ?? `${device.name} application preview`;
  const classes = ["rdl-preview", props.className].filter(Boolean).join(" ");

  const configuration = useMemo<PreviewConfiguration>(
    () => ({
      version: 1,
      deviceId: device.id,
      orientation,
      zoom: zoom === "fit" ? zoom : scale,
      frameVisible,
      environment,
    }),
    [device.id, environment, frameVisible, orientation, scale, zoom],
  );

  const updateRoute = useCallback((nextRoute: PreviewRouteState) => {
    setRoute((currentRoute) =>
      equalRoute(currentRoute, nextRoute) ? currentRoute : nextRoute,
    );
  }, []);

  const postConfiguration = useCallback(
    (target: HTMLIFrameElement, targetOrigin?: string) => {
      const origin =
        targetOrigin ??
        currentBridgeOrigin.current ??
        (sourceUrl !== undefined ? getOrigin(sourceUrl) : null);
      if (!origin || !target.contentWindow) return;
      const sameOrigin =
        typeof window !== "undefined" && origin === window.location.origin;
      if (!sameOrigin && !bridgeOrigins?.includes(origin)) return;
      target.contentWindow.postMessage(
        createPreviewConfigurationMessage(configuration),
        origin,
      );
    },
    [bridgeOrigins, configuration, sourceUrl],
  );

  const captureIframe = useCallback(
    (nextIframe: HTMLIFrameElement | null) => {
      if (nextIframe && nextIframe !== iframeRef.current) {
        inspectionSuspended.current = !canInspectFrame(nextIframe);
        loadedSourceFrame.current = null;
        currentBridgeOrigin.current = null;
        if (sourceUrl !== undefined) {
          updateRoute(createPreviewRouteState(sourceUrl, "initial"));
        }
      }
      iframeRef.current = nextIframe;
      setIframe(nextIframe);
    },
    [sourceUrl, updateRoute],
  );

  const synchronizeSourceFrame = useCallback(
    (loadedIframe: HTMLIFrameElement) => {
      captureIframe(loadedIframe);
      if (sourceUrl !== undefined) {
        updateRoute(createPreviewRouteState(sourceUrl, "initial"));
      }
      loadedSourceFrame.current = loadedIframe;
      const inspectionAllowed =
        !inspectionSuspended.current && canInspectFrame(loadedIframe);
      const sameOriginRoute = routeFromLocation(
        loadedIframe,
        "same-origin",
        inspectionAllowed,
      );
      if (sameOriginRoute) {
        updateRoute(sameOriginRoute);
      }

      removeTargetEnvironment.current?.();
      removeTargetEnvironment.current = undefined;
      removeBeforeUnload.current?.();
      removeBeforeUnload.current = undefined;
      if (inspectionAllowed) {
        try {
          const targetDocument = loadedIframe.contentDocument;
          const targetWindow = loadedIframe.contentWindow;
          if (targetDocument) {
            const inspectedDocument = targetDocument;
            removeTargetEnvironment.current = applyPreviewEnvironment(
              inspectedDocument,
              environment,
            );
            if (targetWindow) {
              const rememberNavigationOrigin = (href: string) => {
                expectedNavigationOrigin.current = getOrigin(href);
                const expected = expectedNavigationOrigin.current;
                targetWindow.setTimeout(() => {
                  if (expectedNavigationOrigin.current === expected) {
                    expectedNavigationOrigin.current = null;
                  }
                }, 1000);
              };
              const onClick = (event: MouseEvent) => {
                if (event.defaultPrevented || !isDomElement(event.target)) {
                  return;
                }
                const anchor = event.target.closest("a[href]");
                if (
                  !anchor ||
                  anchor.getAttribute("download") !== null
                ) {
                  return;
                }
                const target = anchor.getAttribute("target") ?? "";
                const href = anchor.getAttribute("href");
                if ((target !== "" && target !== "_self") || !href) return;
                rememberNavigationOrigin(
                  new URL(href, inspectedDocument.baseURI).href,
                );
              };
              const onSubmit = (event: SubmitEvent) => {
                if (
                  event.defaultPrevented ||
                  !isDomElement(event.target) ||
                  event.target.tagName !== "FORM"
                ) {
                  return;
                }
                const form = event.target;
                const target = form.getAttribute("target") ?? "";
                if (target !== "" && target !== "_self") return;
                rememberNavigationOrigin(
                  new URL(
                    form.getAttribute("action") ?? inspectedDocument.baseURI,
                    inspectedDocument.baseURI,
                  ).href,
                );
              };
              const onBeforeUnload = () => {
                inspectionSuspended.current =
                  expectedNavigationOrigin.current !== window.location.origin;
                expectedNavigationOrigin.current = null;
                removeBeforeUnload.current = undefined;
              };
              inspectedDocument.addEventListener("click", onClick);
              inspectedDocument.addEventListener("submit", onSubmit);
              targetWindow.addEventListener("beforeunload", onBeforeUnload);
              removeBeforeUnload.current = () => {
                inspectedDocument.removeEventListener("click", onClick);
                inspectedDocument.removeEventListener("submit", onSubmit);
                targetWindow.removeEventListener(
                  "beforeunload",
                  onBeforeUnload,
                );
              };
            }
          }
        } catch {
          inspectionSuspended.current = true;
        }
      }

      postConfiguration(loadedIframe);
    },
    [
      captureIframe,
      environment,
      postConfiguration,
      sourceUrl,
      updateRoute,
    ],
  );

  useEffect(() => {
    if (
      !isSource ||
      !iframe ||
      iframe !== loadedSourceFrame.current ||
      inspectionSuspended.current ||
      !canInspectFrame(iframe)
    ) {
      return;
    }
    removeTargetEnvironment.current?.();
    removeTargetEnvironment.current = undefined;
    try {
      const targetDocument = iframe.contentDocument;
      if (!targetDocument) return;
      const cleanup = applyPreviewEnvironment(targetDocument, environment);
      removeTargetEnvironment.current = cleanup;
      return () => {
        cleanup();
        if (removeTargetEnvironment.current === cleanup) {
          removeTargetEnvironment.current = undefined;
        }
      };
    } catch {
      // The frame can become opaque while a navigation is in progress.
    }
  }, [environment, iframe, isSource]);

  useEffect(() => {
    return () => {
      removeTargetEnvironment.current?.();
      removeBeforeUnload.current?.();
    };
  }, []);

  useEffect(() => {
    if (!isSource || !iframe) return;
    const interval = window.setInterval(() => {
      const inspectionAllowed =
        !inspectionSuspended.current && canInspectFrame(iframe);
      const synchronizedRoute = routeFromLocation(
        iframe,
        "same-origin",
        inspectionAllowed,
      );
      if (synchronizedRoute) updateRoute(synchronizedRoute);
    }, 200);
    return () => window.clearInterval(interval);
  }, [iframe, isSource, updateRoute]);

  useEffect(() => {
    if (!isSource || !iframe) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const message = parsePreviewBridgeMessage(event.data);
      if (
        !message ||
        (message.type !== "route" && message.type !== "ready")
      ) {
        return;
      }
      const permitted =
        event.origin === window.location.origin ||
        bridgeOrigins?.includes(event.origin) === true;
      if (!permitted) return;

      const nextRoute = createPreviewRouteState(
        message.payload.href,
        "bridge",
      );
      if (getOrigin(nextRoute.href) !== event.origin) return;
      currentBridgeOrigin.current = event.origin;
      updateRoute(nextRoute);
      if (message.type === "ready") {
        postConfiguration(iframe, event.origin);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    iframe,
    isSource,
    postConfiguration,
    bridgeOrigins,
    updateRoute,
  ]);

  useEffect(() => {
    if (isSource && iframe) postConfiguration(iframe);
  }, [configuration, iframe, isSource, postConfiguration]);

  const displayedRoute = isSource ? route : PORTAL_ROUTE;
  const activeSourceReload =
    isSource && sourceReload?.sourceUrl === sourceUrl
      ? sourceReload
      : null;
  const renderedSourceUrl =
    activeSourceReload?.href ?? sourceUrl;
  const routeIsSynchronized =
    !isSource || displayedRoute.source !== "initial";
  const routeLabel = isSource
    ? routeIsSynchronized
      ? "Current embedded route"
      : "Initial embedded route"
    : "Portal content";

  useEffect(() => {
    onRouteChange?.(displayedRoute);
  }, [displayedRoute, onRouteChange]);

  const reload = () => {
    if (isSource && sourceUrl !== undefined) {
      setSourceReload((current) => ({
        generation: (current?.generation ?? 0) + 1,
        href: displayedRoute.href,
        sourceUrl,
      }));
      return;
    }
    setPortalKey((key) => key + 1);
  };

  const openInNewTab = () => {
    if (!isSource || typeof window === "undefined") return;
    window.open(displayedRoute.href, "_blank", "noopener,noreferrer");
  };

  const scaledBounds: ViewportDimensions = {
    width: frameDimensions.width * scale,
    height: frameDimensions.height * scale,
  };

  return (
    <section
      aria-label={`${device.name} preview controls and stage`}
      className={classes}
      data-rdl-preview=""
    >
      <div className="rdl-preview__toolbar">
        <div className="rdl-preview__route-group">
          <output
            aria-label={routeLabel}
            className="rdl-preview__route"
            data-rdl-route-fidelity={displayedRoute.source}
          >
            {formatPreviewRoute(displayedRoute)}
          </output>
          {isSource ? (
            <span className="rdl-preview__fidelity">
              {routeIsSynchronized
                ? "Route synchronized"
                : "Route synchronization pending"}
            </span>
          ) : null}
        </div>
        <div
          aria-label="Preview actions"
          className="rdl-preview__actions"
          role="group"
        >
          <button onClick={reload} type="button">
            Reload preview
          </button>
          {isSource ? (
            <button onClick={openInNewTab} type="button">
              Open preview in new tab
            </button>
          ) : null}
        </div>
      </div>
      <div className="rdl-preview__stage" ref={setStage}>
        <div
          className="rdl-preview__scale-box"
          data-rdl-export-root=""
          style={{
            width: `${scaledBounds.width}px`,
            height: `${scaledBounds.height}px`,
          }}
        >
          <div
            className="rdl-preview__scaled"
            data-rdl-preview-scale={scale}
            style={{
              width: `${frameDimensions.width}px`,
              height: `${frameDimensions.height}px`,
              transform: `scale(${scale})`,
            }}
          >
            <DeviceFrame
              contentLabel={title}
              device={device}
              frameVisible={frameVisible}
              orientation={orientation}
              presentationScale={scale}
              safeAreaInsets={environment.safeArea}
              showRulers={props.showRulers ?? false}
              showSafeArea={props.showSafeArea ?? false}
            >
              {isSource ? (
                <iframe
                  allow={props.allow}
                  className="rdl-preview__iframe"
                  onLoad={(event) =>
                    synchronizeSourceFrame(event.currentTarget)
                  }
                  key={`${sourceUrl}:${activeSourceReload?.generation ?? 0}`}
                  ref={captureIframe}
                  referrerPolicy={props.referrerPolicy}
                  sandbox={props.sandbox}
                  src={renderedSourceUrl}
                  title={title}
                />
              ) : (
                <IframePortal
                  className="rdl-preview__iframe"
                  environment={environment}
                  key={portalKey}
                  onLoad={captureIframe}
                  styles={props.portalStyles ?? ""}
                  title={title}
                >
                  <PreviewEnvironmentProvider value={environment}>
                    {props.children}
                  </PreviewEnvironmentProvider>
                </IframePortal>
              )}
              <VirtualKeyboard state={environment.virtualKeyboard} />
            </DeviceFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
