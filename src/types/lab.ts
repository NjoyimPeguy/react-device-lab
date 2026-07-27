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
import type { PreviewRouteState, PreviewZoom } from "./preview.js";

/** Package theme applied to the complete lab workspace. */
export type PreviewTheme = "light" | "dark";
/** Whether the lab uses a named device or consumer-supplied dimensions. */
export type PreviewViewportMode = "device" | "custom";
/** Whether the lab fills its host or renders as a bounded panel. */
export type PreviewWorkspaceMode = "fullscreen" | "bounded";

/** Consumer-defined URL destination exposed by the lab selector. */
export interface PreviewDestination {
  /** Stable destination identifier. */
  readonly id: string;
  /** Human-readable selector label. */
  readonly label: string;
  /** Application URL loaded when the destination is selected. */
  readonly src: string;
}

/** Props for the searchable, grouped {@link DeviceSelector}. */
export interface DeviceSelectorProps {
  /** Device catalog; defaults to {@link DEVICE_PRESETS}. */
  readonly devices?: readonly DevicePreset[];
  /** Id of the selected device. */
  readonly value: string;
  /** Called with the newly selected preset. */
  readonly onChange: (device: DevicePreset) => void;
  /** Accessible label for the search field; defaults to `"Search devices"`. */
  readonly searchLabel?: string;
  /** Accessible label for the grouped device list; defaults to `"Device"`. */
  readonly selectLabel?: string;
  /** Whether search and selection controls are disabled; defaults to `false`. */
  readonly disabled?: boolean;
  /** Optional class added to the selector root. */
  readonly className?: string;
}

/**
 * Per-action key overrides for the preview keyboard shortcuts.
 *
 * Each property names a plain (modifier-free) key compared against
 * `KeyboardEvent.key`; single-letter values match either letter case. An
 * omitted action keeps its default key and `null` removes that binding.
 */
export interface PreviewShortcuts {
  /** Rotate the viewport orientation; defaults to `"r"`. */
  readonly rotate?: string | null;
  /** Select the previous device in catalog order; defaults to `"["`. */
  readonly previousDevice?: string | null;
  /** Select the next device in catalog order; defaults to `"]"`. */
  readonly nextDevice?: string | null;
  /** Increase the visual scale one step; defaults to `"+"`. */
  readonly zoomIn?: string | null;
  /** Decrease the visual scale one step; defaults to `"-"`. */
  readonly zoomOut?: string | null;
  /** Reset the visual scale to Fit; defaults to `"0"`. */
  readonly zoomReset?: string | null;
  /** Toggle device-frame visibility; defaults to `"f"`. */
  readonly toggleFrame?: string | null;
}

/** Controlled props for the standalone lab configuration panel. */
export interface PreviewConfigurationPanelProps {
  /** Complete catalog shown by the device selector. */
  readonly devices: readonly DevicePreset[];
  /** Currently selected device. */
  readonly device: DevicePreset;
  /** Called when the selected device changes. */
  readonly onDeviceChange: (device: DevicePreset) => void;
  /** Current viewport rotation. */
  readonly orientation: DeviceOrientation;
  /** Called when the requested rotation changes. */
  readonly onOrientationChange: (orientation: DeviceOrientation) => void;
  /** Current visual presentation scale. */
  readonly zoom: PreviewZoom;
  /** Called when the requested visual scale changes. */
  readonly onZoomChange: (zoom: PreviewZoom) => void;
  /** Whether the device frame is currently visible. */
  readonly frameVisible: boolean;
  /** Called when frame visibility changes. */
  readonly onFrameVisibleChange: (visible: boolean) => void;
  /** Current package workspace theme. */
  readonly theme: PreviewTheme;
  /** Called when the package theme changes. */
  readonly onThemeChange: (theme: PreviewTheme) => void;
  /** Whether the safe-area overlay is currently shown. */
  readonly showSafeArea: boolean;
  /** Called when safe-area overlay visibility changes. */
  readonly onShowSafeAreaChange: (visible: boolean) => void;
  /** Whether the pixel rulers and measurement crosshair are currently shown. */
  readonly showRulers: boolean;
  /** Called when ruler visibility changes. */
  readonly onShowRulersChange: (visible: boolean) => void;
  /** Complete preview environment edited by the scenario controls. */
  readonly environment: PreviewEnvironment;
  /** Called with a complete environment after a scenario control changes. */
  readonly onEnvironmentChange: (environment: PreviewEnvironment) => void;
  /** Current named-device or custom-size mode. */
  readonly viewportMode: PreviewViewportMode;
  /** Called when the viewport mode changes. */
  readonly onViewportModeChange: (mode: PreviewViewportMode) => void;
  /**
   * Current custom logical dimensions in CSS pixels. The panel accepts edits
   * from 100–10000 on each axis.
   */
  readonly customViewport: ViewportDimensions;
  /** Called after a valid custom-dimension edit. */
  readonly onCustomViewportChange: (viewport: ViewportDimensions) => void;
  /** Optional consumer-defined URL destinations. */
  readonly destinations?: readonly PreviewDestination[];
  /** Id of the selected destination. */
  readonly destinationId?: string;
  /** Called when the selected destination changes. */
  readonly onDestinationChange?: (destination: PreviewDestination) => void;
  /**
   * Rendered stage element scanned for the composed preview export root,
   * supplied automatically by {@link DevicePreviewLab}. The "Export PNG"
   * action downloads a WYSIWYG snapshot of the current orientation, frame
   * visibility, zoom, rulers, and safe-area overlays. Cross-origin iframe
   * pixels are unreachable by design and render as a neutral placeholder
   * block. Standalone panels omit this prop to hide the action.
   */
  readonly previewRoot?: HTMLElement | null;
  /** Optional class added to the panel root. */
  readonly className?: string;
}

/**
 * Properties shared by URL and React-portal lab modes.
 *
 * Every stateful option supports controlled and uncontrolled use. Supplying
 * both forms uses the controlled value and retains the default only for initial
 * uncontrolled state.
 */
export interface DevicePreviewLabBaseProps {
  /**
   * Device catalog; defaults to {@link DEVICE_PRESETS} and must contain at
   * least one preset.
   *
   * @category Selection
   */
  readonly devices?: readonly DevicePreset[];
  /**
   * Header title; defaults to `"Device Preview Lab"`.
   *
   * @category Content
   */
  readonly title?: ReactNode;
  /**
   * Header description; defaults to
   * `"Exact responsive viewports for web application review"`.
   *
   * @category Content
   */
  readonly description?: ReactNode;
  /**
   * Optional status badge rendered in the header.
   *
   * @category Content
   */
  readonly badge?: ReactNode;
  /**
   * Optional notice rendered below the header and above the workspace.
   *
   * @category Content
   */
  readonly notice?: ReactNode;
  /**
   * Optional class added to the lab root.
   *
   * @category Appearance
   */
  readonly className?: string;
  /**
   * Full-host or bounded presentation; defaults to `"fullscreen"`.
   *
   * @category Appearance
   */
  readonly workspaceMode?: PreviewWorkspaceMode;
  /**
   * Controlled selected device id. Unknown ids fall back to the first catalog
   * preset.
   *
   * @category Selection
   */
  readonly deviceId?: string;
  /**
   * Initial selected id; defaults to the first catalog preset.
   *
   * @category Selection
   */
  readonly defaultDeviceId?: string;
  /**
   * Called when the selected device changes.
   *
   * @category Selection
   */
  readonly onDeviceChange?: (device: DevicePreset) => void;
  /**
   * Controlled viewport rotation.
   *
   * @category Viewport
   */
  readonly orientation?: DeviceOrientation;
  /**
   * Initial viewport rotation; defaults to `"portrait"`.
   *
   * @category Viewport
   */
  readonly defaultOrientation?: DeviceOrientation;
  /**
   * Called when the requested rotation changes.
   *
   * @category Viewport
   */
  readonly onOrientationChange?: (orientation: DeviceOrientation) => void;
  /**
   * Controlled visual scale.
   *
   * @category Viewport
   */
  readonly zoom?: PreviewZoom;
  /**
   * Initial visual scale; defaults to `"fit"`.
   *
   * @category Viewport
   */
  readonly defaultZoom?: PreviewZoom;
  /**
   * Called when the visual scale changes.
   *
   * @category Viewport
   */
  readonly onZoomChange?: (zoom: PreviewZoom) => void;
  /**
   * Controlled device-frame visibility. Canonical form of the deprecated
   * {@link DevicePreviewLabBaseProps.frameVisible | frameVisible} alias; when
   * both are supplied, `showFrame` wins.
   *
   * @category Appearance
   */
  readonly showFrame?: boolean;
  /**
   * Initial device-frame visibility; defaults to `true`. Canonical form of
   * the deprecated
   * {@link DevicePreviewLabBaseProps.defaultFrameVisible | defaultFrameVisible}
   * alias; when both are supplied, `defaultShowFrame` wins.
   *
   * @category Appearance
   */
  readonly defaultShowFrame?: boolean;
  /**
   * Controlled device-frame visibility.
   *
   * @deprecated Use {@link DevicePreviewLabBaseProps.showFrame | showFrame}
   * instead. Both names remain fully supported; the canonical name wins when
   * both are supplied.
   *
   * @category Appearance
   */
  readonly frameVisible?: boolean;
  /**
   * Initial device-frame visibility; defaults to `true`.
   *
   * @deprecated Use
   * {@link DevicePreviewLabBaseProps.defaultShowFrame | defaultShowFrame}
   * instead. Both names remain fully supported; the canonical name wins when
   * both are supplied.
   *
   * @category Appearance
   */
  readonly defaultFrameVisible?: boolean;
  /**
   * Called when device-frame visibility changes, whichever prop name controls
   * it.
   *
   * @category Appearance
   */
  readonly onFrameVisibleChange?: (visible: boolean) => void;
  /**
   * Controlled package theme.
   *
   * @category Appearance
   */
  readonly theme?: PreviewTheme;
  /**
   * Initial package theme; defaults to `"light"`.
   *
   * @category Appearance
   */
  readonly defaultTheme?: PreviewTheme;
  /**
   * Called when the package theme changes.
   *
   * @category Appearance
   */
  readonly onThemeChange?: (theme: PreviewTheme) => void;
  /**
   * Controlled safe-area overlay visibility.
   *
   * @category Overlays
   */
  readonly showSafeArea?: boolean;
  /**
   * Initial safe-area overlay visibility; defaults to `false`.
   *
   * @category Overlays
   */
  readonly defaultShowSafeArea?: boolean;
  /**
   * Called when safe-area overlay visibility changes.
   *
   * @category Overlays
   */
  readonly onShowSafeAreaChange?: (visible: boolean) => void;
  /**
   * Controlled ruler and measurement-overlay visibility. While rulers are
   * visible, the measurement surface captures pointer input over the
   * viewport.
   *
   * @category Overlays
   */
  readonly showRulers?: boolean;
  /**
   * Initial ruler and measurement-overlay visibility; defaults to `false`.
   *
   * @category Overlays
   */
  readonly defaultShowRulers?: boolean;
  /**
   * Called when ruler and measurement-overlay visibility changes.
   *
   * @category Overlays
   */
  readonly onShowRulersChange?: (visible: boolean) => void;
  /**
   * Controlled complete preview environment. When omitted, the lab uses the
   * selected model's suggested environment.
   *
   * @category Environment
   */
  readonly environment?: PreviewEnvironment;
  /**
   * Initial overrides merged with the selected model's pointer, hover,
   * safe-area, virtual-keyboard, and permission suggestions.
   *
   * @category Environment
   */
  readonly defaultEnvironment?: PreviewEnvironmentOverrides;
  /**
   * Called with the complete environment after a scenario change.
   *
   * @category Environment
   */
  readonly onEnvironmentChange?: (environment: PreviewEnvironment) => void;
  /**
   * Controlled named-device or custom-size mode.
   *
   * @category Viewport
   */
  readonly viewportMode?: PreviewViewportMode;
  /**
   * Initial viewport mode; defaults to `"device"`.
   *
   * @category Viewport
   */
  readonly defaultViewportMode?: PreviewViewportMode;
  /**
   * Called when the viewport mode changes.
   *
   * @category Viewport
   */
  readonly onViewportModeChange?: (mode: PreviewViewportMode) => void;
  /**
   * Controlled custom logical dimensions in CSS pixels.
   *
   * @category Viewport
   */
  readonly customViewport?: ViewportDimensions;
  /**
   * Initial custom logical dimensions; defaults to 412 × 915 CSS pixels.
   *
   * @category Viewport
   */
  readonly defaultCustomViewport?: ViewportDimensions;
  /**
   * Called when custom logical dimensions change.
   *
   * @category Viewport
   */
  readonly onCustomViewportChange?: (viewport: ViewportDimensions) => void;
  /**
   * Non-negative finite stage-edge clearance used by Fit scaling; defaults to
   * 24 CSS pixels.
   *
   * @category Advanced
   */
  readonly fitPadding?: number;
  /**
   * Called whenever the package can determine a new embedded route.
   *
   * @category Integration
   */
  readonly onRouteChange?: (route: PreviewRouteState) => void;
  /**
   * Opt-in persistence of the preview configuration in the page URL. `true`
   * stores the device, orientation, zoom, frame visibility, and environment
   * under the {@link PREVIEW_CONFIGURATION_URL_PARAM} query parameter; a
   * string selects a custom parameter name. Updates use
   * `history.replaceState`, so lab changes never add history entries. A valid
   * payload present on load wins over defaults but yields to explicitly
   * controlled props. Defaults to `false`.
   *
   * @category Integration
   */
  readonly syncConfigurationToUrl?: boolean | string;
  /**
   * Keyboard control of the preview; defaults to enabled with the default
   * {@link PreviewShortcuts} keymap. `false` removes every binding; a partial
   * object overrides individual keys and a `null` value removes one binding.
   * Shortcuts use plain keys, never fire while focus is in an input, select,
   * textarea, or contenteditable element, and ignore events whose default was
   * already prevented. Device cycling follows flattened catalog-group order
   * and wraps; zoom steps clamp to 10%–200% and start from 100% when the
   * current scale is Fit.
   *
   * @category Behavior
   */
  readonly keyboardShortcuts?: boolean | PreviewShortcuts;
}

/**
 * URL-mode lab props. Combines {@link DevicePreviewLabBaseProps} with the
 * application `src`, optional destinations, and iframe integration options.
 */
export interface DevicePreviewLabSourceProps
  extends DevicePreviewLabBaseProps {
  /**
   * Fallback or only application URL. A valid selected destination takes
   * precedence when `destinations` are supplied.
   *
   * @category Content
   */
  readonly src: string;
  /**
   * React children are unavailable in URL mode.
   *
   * @category Content
   */
  readonly children?: never;
  /**
   * Portal CSS is unavailable in URL mode.
   *
   * @category Content
   */
  readonly portalStyles?: never;
  /**
   * Optional consumer-defined application destinations.
   *
   * @category Selection
   */
  readonly destinations?: readonly PreviewDestination[];
  /**
   * Controlled selected destination id.
   *
   * @category Selection
   */
  readonly destinationId?: string;
  /**
   * Initial selected destination id; defaults to the first destination.
   *
   * @category Selection
   */
  readonly defaultDestinationId?: string;
  /**
   * Called when the selected destination changes.
   *
   * @category Selection
   */
  readonly onDestinationChange?: (destination: PreviewDestination) => void;
  /**
   * Exact origins accepted by the optional cross-origin bridge.
   *
   * @category Integration
   */
  readonly bridgeOrigins?: readonly string[];
  /**
   * iframe sandbox token list supplied by the consumer.
   *
   * @category Integration
   */
  readonly sandbox?: string;
  /**
   * iframe Permissions Policy allowlist supplied by the consumer.
   *
   * @category Integration
   */
  readonly allow?: string;
  /**
   * Referrer policy applied to the application iframe.
   *
   * @category Integration
   */
  readonly referrerPolicy?: HTMLIFrameElement["referrerPolicy"];
}

/**
 * React portal-mode lab props. Combines {@link DevicePreviewLabBaseProps}
 * with React `children` mounted inside an isolated iframe document.
 */
export interface DevicePreviewLabPortalProps
  extends DevicePreviewLabBaseProps {
  /**
   * URL loading is unavailable in portal mode.
   *
   * @category Content
   */
  readonly src?: never;
  /**
   * React content mounted inside an isolated iframe document.
   *
   * @category Content
   */
  readonly children: ReactNode;
  /**
   * CSS text injected into the portal iframe document.
   *
   * @category Content
   */
  readonly portalStyles?: string;
  /**
   * URL destinations are unavailable in portal mode.
   *
   * @category Selection
   */
  readonly destinations?: never;
  /**
   * Destination selection is unavailable in portal mode.
   *
   * @category Selection
   */
  readonly destinationId?: never;
  /**
   * Uncontrolled destination selection is unavailable in portal mode.
   *
   * @category Selection
   */
  readonly defaultDestinationId?: never;
  /**
   * Destination callbacks are unavailable in portal mode.
   *
   * @category Selection
   */
  readonly onDestinationChange?: never;
  /**
   * Cross-origin bridge origins are unavailable in portal mode.
   *
   * @category Integration
   */
  readonly bridgeOrigins?: never;
  /**
   * URL iframe sandbox options are unavailable in portal mode.
   *
   * @category Integration
   */
  readonly sandbox?: never;
  /**
   * URL iframe Permissions Policy options are unavailable in portal mode.
   *
   * @category Integration
   */
  readonly allow?: never;
  /**
   * URL iframe referrer policy is unavailable in portal mode.
   *
   * @category Integration
   */
  readonly referrerPolicy?: never;
}

/**
 * Mutually exclusive props for the complete URL-mode
 * ({@link DevicePreviewLabSourceProps}) or React-portal
 * ({@link DevicePreviewLabPortalProps}) preview workspace. Shared options
 * live in {@link DevicePreviewLabBaseProps}.
 */
export type DevicePreviewLabProps =
  | DevicePreviewLabSourceProps
  | DevicePreviewLabPortalProps;
