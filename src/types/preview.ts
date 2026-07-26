import type { ReactNode } from "react";

import type {
  DeviceOrientation,
  DevicePreset,
  ViewportDimensions,
} from "./device.js";
import type {
  PreviewEnvironment,
  PreviewEnvironmentOverrides,
} from "./environment.js";

/**
 * Visual preview scale.
 *
 * `"fit"` derives any positive scale needed by the available stage. The
 * low-level resolver caps it at 200%, while {@link DevicePreview} uses a 100%
 * Fit cap by default. A finite number is an explicit multiplier, where `1` is
 * 100%, and is clamped to 10%–200%. Scaling never changes iframe viewport
 * dimensions.
 */
export type PreviewZoom = "fit" | number;

/** Mechanism that most recently supplied the current embedded route. */
export type PreviewRouteSource =
  | "initial"
  | "same-origin"
  | "bridge"
  | "portal";

/** Parsed route displayed by preview navigation controls. */
export interface PreviewRouteState {
  /** Absolute URL, or a normalized relative route when parsed without a base. */
  readonly href: string;
  /** URL pathname beginning with `/`. */
  readonly pathname: string;
  /** Query string including `?`, or an empty string. */
  readonly search: string;
  /** Fragment including `#`, or an empty string. */
  readonly hash: string;
  /** Mechanism that supplied this route state. */
  readonly source: PreviewRouteSource;
}

/** Versioned configuration exchanged through the iframe bridge. */
export interface PreviewConfiguration {
  /** Serialized configuration format version. */
  readonly version: 1;
  /**
   * Stable selected preset id: lowercase ASCII alphanumerics separated by
   * single hyphens.
   */
  readonly deviceId: string;
  /** Selected viewport rotation. */
  readonly orientation: DeviceOrientation;
  /** `"fit"` or a serialized numeric scale from 0.1–2. */
  readonly zoom: PreviewZoom;
  /** Whether the repository-authored device skin is visible. */
  readonly frameVisible: boolean;
  /** Complete preview environment supplied to cooperating content. */
  readonly environment: PreviewEnvironment;
}

/** Inputs used to fit an outer presentation inside available stage bounds. */
export interface ComputeFitScaleOptions {
  /** Positive finite available stage width in CSS pixels. */
  readonly availableWidth: number;
  /** Positive finite available stage height in CSS pixels. */
  readonly availableHeight: number;
  /** Positive finite unscaled outer content width in CSS pixels. */
  readonly contentWidth: number;
  /** Positive finite unscaled outer content height in CSS pixels. */
  readonly contentHeight: number;
  /** Non-negative finite clearance from every stage edge; defaults to `0`. */
  readonly padding?: number;
  /** Positive finite upper bound for the returned scale; defaults to `1`. */
  readonly maximumScale?: number;
}

/** Props for rendering React content in a viewport-accurate iframe portal. */
export interface IframePortalProps {
  /** React content mounted into the iframe document. */
  readonly children: ReactNode;
  /** Accessible name assigned to the iframe. */
  readonly title: string;
  /** Optional class added to the iframe element. */
  readonly className?: string;
  /** CSS text injected into the isolated iframe document. */
  readonly styles?: string;
  /**
   * Environment attributes and CSS properties applied to the iframe document.
   * Wrap children in {@link PreviewEnvironmentProvider} when they also need
   * React-context access.
   */
  readonly environment?: PreviewEnvironment;
  /** Called when the iframe document is available and portal setup begins. */
  readonly onLoad?: (iframe: HTMLIFrameElement) => void;
}

/**
 * Properties shared by URL and React-portal preview modes.
 *
 * @inline
 */
interface DevicePreviewBaseProps {
  /** Selected device. Overrides lookup through `devices` and `defaultDeviceId`. */
  readonly device?: DevicePreset;
  /** Catalog used for selection; defaults to {@link DEVICE_PRESETS}. */
  readonly devices?: readonly DevicePreset[];
  /**
   * Initially selected preset id when `device` is absent. An unknown or
   * omitted id falls back to the first supplied or built-in preset.
   */
  readonly defaultDeviceId?: string;
  /** Device rotation; defaults to portrait. */
  readonly orientation?: DeviceOrientation;
  /** Visual scale; defaults to `"fit"`. */
  readonly zoom?: PreviewZoom;
  /** Whether the repository-authored frame is visible; defaults to `true`. */
  readonly frameVisible?: boolean;
  /**
   * Accessible iframe and content-region name; defaults to
   * `"<device name> application preview"`.
   */
  readonly title?: string;
  /** Optional class added to the preview root. */
  readonly className?: string;
  /** Whether to draw a visual safe-area overlay; defaults to `false`. */
  readonly showSafeArea?: boolean;
  /**
   * Environment values merged with neutral defaults and the device's pointer
   * and hover profile.
   */
  readonly environment?: PreviewEnvironmentOverrides;
  /**
   * Non-negative finite clearance used while computing Fit scale; defaults to
   * 24 CSS pixels.
   */
  readonly fitPadding?: number;
  /** Explicit Fit bounds when automatic element measurement is inappropriate. */
  readonly fitBounds?: ViewportDimensions;
  /** Exact origins accepted by the optional cross-origin bridge. */
  readonly bridgeOrigins?: readonly string[];
  /** iframe sandbox token list supplied by the consumer. */
  readonly sandbox?: string;
  /** iframe Permissions Policy allowlist supplied by the consumer. */
  readonly allow?: string;
  /** Referrer policy applied to a URL-mode iframe. */
  readonly referrerPolicy?: HTMLIFrameElement["referrerPolicy"];
  /** Called whenever the package can determine a new embedded route. */
  readonly onRouteChange?: (route: PreviewRouteState) => void;
}

/**
 * URL-mode preview props.
 *
 * @inline
 */
interface DevicePreviewSourceProps extends DevicePreviewBaseProps {
  /** Application URL loaded into the exact-size iframe viewport. */
  readonly src: string;
  /** React children are unavailable in URL mode. */
  readonly children?: never;
  /** Portal CSS is unavailable in URL mode. */
  readonly portalStyles?: never;
}

/**
 * React portal-mode preview props.
 *
 * @inline
 */
interface DevicePreviewPortalProps extends DevicePreviewBaseProps {
  /** URL loading is unavailable in portal mode. */
  readonly src?: never;
  /** React content mounted inside an isolated iframe document. */
  readonly children: ReactNode;
  /** CSS text injected into the portal iframe document. */
  readonly portalStyles?: string;
}

/**
 * Mutually exclusive props for URL mode or consumer-rendered React portal mode.
 *
 * Both modes use an actual iframe viewport, so media queries and
 * `window.innerWidth` reflect the selected logical dimensions.
 */
export type DevicePreviewProps =
  | DevicePreviewSourceProps
  | DevicePreviewPortalProps;
