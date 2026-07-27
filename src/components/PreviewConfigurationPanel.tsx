import { useId, useState } from "react";
import {
  getPhysicalResolution,
  getViewportDimensions,
  getViewportWidthClass,
} from "../catalog/dimensions.js";
import { createPreviewEnvironment } from "../environment/configuration.js";
import {
  capturePreviewPng,
  PreviewPngExportError,
} from "../preview/exportImage.js";
import { resolvePreviewScale } from "../preview/scaling.js";
import type { ViewportDimensions } from "../types/device.js";
import type {
  PreviewEnvironment,
  PreviewPermissionState,
} from "../types/environment.js";
import type { PreviewConfigurationPanelProps } from "../types/lab.js";
import type { PreviewZoom } from "../types/preview.js";
import { DeviceSelector } from "./DeviceSelector.js";

const ZOOM_OPTIONS: readonly {
  readonly label: string;
  readonly value: PreviewZoom;
}[] = [
  { label: "Fit", value: "fit" },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
];

function pixels(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

function dimensionsLabel(dimensions: ViewportDimensions): string {
  return `${pixels(dimensions.width)} × ${pixels(dimensions.height)}`;
}

function nextEnvironment(
  environment: PreviewEnvironment,
  overrides: Parameters<typeof createPreviewEnvironment>[0],
): PreviewEnvironment {
  return createPreviewEnvironment({
    ...environment,
    ...overrides,
  });
}

function checked(event: React.ChangeEvent<HTMLInputElement>): boolean {
  return event.currentTarget.checked;
}

/**
 * Renders controlled device, viewport, appearance, and environment controls.
 *
 * Use this component when composing a custom workspace. For a complete
 * batteries-included workspace, use {@link DevicePreviewLab}.
 *
 * @param props - Current configuration values and change callbacks.
 * @returns The configuration controls. The composing workspace owns scrolling.
 *
 * @example
 * ```tsx
 * function StandalonePanel() {
 *   const [device, setDevice] = useState(DEVICE_PRESETS[0]);
 *   const [orientation, setOrientation] =
 *     useState<DeviceOrientation>("portrait");
 *   const [zoom, setZoom] = useState<PreviewZoom>("fit");
 *   const [frameVisible, setFrameVisible] = useState(true);
 *   const [theme, setTheme] = useState<PreviewTheme>("light");
 *   const [showSafeArea, setShowSafeArea] = useState(false);
 *   const [showRulers, setShowRulers] = useState(false);
 *   const [environment, setEnvironment] = useState(() =>
 *     createPreviewEnvironment(),
 *   );
 *   const [viewportMode, setViewportMode] =
 *     useState<PreviewViewportMode>("device");
 *   const [customViewport, setCustomViewport] = useState({
 *     width: 412,
 *     height: 915,
 *   });
 *
 *   return (
 *     <PreviewConfigurationPanel
 *       customViewport={customViewport}
 *       device={device}
 *       devices={DEVICE_PRESETS}
 *       environment={environment}
 *       frameVisible={frameVisible}
 *       onCustomViewportChange={setCustomViewport}
 *       onDeviceChange={setDevice}
 *       onEnvironmentChange={setEnvironment}
 *       onFrameVisibleChange={setFrameVisible}
 *       onOrientationChange={setOrientation}
 *       onShowRulersChange={setShowRulers}
 *       onShowSafeAreaChange={setShowSafeArea}
 *       onThemeChange={setTheme}
 *       onViewportModeChange={setViewportMode}
 *       onZoomChange={setZoom}
 *       orientation={orientation}
 *       showRulers={showRulers}
 *       showSafeArea={showSafeArea}
 *       theme={theme}
 *       viewportMode={viewportMode}
 *       zoom={zoom}
 *     />
 *   );
 * }
 * ```
 */
export function PreviewConfigurationPanel({
  devices,
  device,
  onDeviceChange,
  orientation,
  onOrientationChange,
  zoom,
  onZoomChange,
  frameVisible,
  onFrameVisibleChange,
  theme,
  onThemeChange,
  showSafeArea,
  onShowSafeAreaChange,
  showRulers,
  onShowRulersChange,
  environment,
  onEnvironmentChange,
  viewportMode,
  onViewportModeChange,
  customViewport,
  onCustomViewportChange,
  destinations,
  destinationId,
  onDestinationChange,
  previewRoot,
  className,
}: PreviewConfigurationPanelProps) {
  const customWidthId = useId();
  const customHeightId = useId();
  const destinationControlId = useId();
  const viewportModeName = useId();
  const viewportSummaryId = useId();
  const controlsId = useId();
  const appearanceId = useId();
  const exportId = useId();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportTarget =
    previewRoot?.querySelector<HTMLElement>("[data-rdl-export-root]") ?? null;
  const customLogical =
    orientation === "portrait"
      ? {
          width: Math.min(customViewport.width, customViewport.height),
          height: Math.max(customViewport.width, customViewport.height),
        }
      : {
          width: Math.max(customViewport.width, customViewport.height),
          height: Math.min(customViewport.width, customViewport.height),
        };
  const logical =
    viewportMode === "custom"
      ? customLogical
      : getViewportDimensions(device, orientation);
  const physical = getPhysicalResolution(device, orientation);
  const widthClass = getViewportWidthClass(logical.width);
  const classes = ["rdl-config", className].filter(Boolean).join(" ");

  const setCustomDimension = (
    dimension: keyof ViewportDimensions,
    rawValue: string,
  ) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 100 || value > 10000) return;
    onCustomViewportChange({ ...customViewport, [dimension]: value });
  };

  const setPermission = (
    name: string,
    state: PreviewPermissionState,
  ) => {
    onEnvironmentChange(
      nextEnvironment(environment, {
        permissions: { ...environment.permissions, [name]: state },
      }),
    );
  };

  const exportPreview = async () => {
    if (!exportTarget || exporting) return;
    setExporting(true);
    setExportError(null);
    const fileName = `device-preview-${device.id}-${orientation}.png`;
    try {
      const blob = await capturePreviewPng(exportTarget, { fileName });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = "noopener";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(
        error instanceof PreviewPngExportError
          ? error.message
          : "PNG export failed unexpectedly.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={classes}>
      <div className="rdl-config__heading">
        <div>
          <p>Workspace controls</p>
          <h2>Preview setup</h2>
        </div>
        <span>{devices.length} devices</span>
      </div>

      {destinations && destinations.length > 0 ? (
        <div className="rdl-field">
          <label htmlFor={destinationControlId}>Destination</label>
          <select
            id={destinationControlId}
            onChange={(event) => {
              const destination = destinations.find(
                (candidate) => candidate.id === event.currentTarget.value,
              );
              if (destination) onDestinationChange?.(destination);
            }}
            value={destinationId ?? destinations[0]?.id}
          >
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <fieldset className="rdl-segmented rdl-segmented--mode">
        <legend>Viewport source</legend>
        <label>
          <input
            checked={viewportMode === "device"}
            name={viewportModeName}
            onChange={() => onViewportModeChange("device")}
            type="radio"
          />
          <span>Named device</span>
        </label>
        <label>
          <input
            checked={viewportMode === "custom"}
            name={viewportModeName}
            onChange={() => onViewportModeChange("custom")}
            type="radio"
          />
          <span>Custom viewport</span>
        </label>
      </fieldset>

      {viewportMode === "device" ? (
        <DeviceSelector
          devices={devices}
          onChange={onDeviceChange}
          value={device.id}
        />
      ) : (
        <div className="rdl-custom-viewport">
          <div className="rdl-field">
            <label htmlFor={customWidthId}>Custom viewport width</label>
            <span>
              <input
                id={customWidthId}
                inputMode="numeric"
                max={10000}
                min={100}
                onChange={(event) =>
                  setCustomDimension("width", event.currentTarget.value)
                }
                type="number"
                value={customViewport.width}
              />
              px
            </span>
          </div>
          <div className="rdl-field">
            <label htmlFor={customHeightId}>Custom viewport height</label>
            <span>
              <input
                id={customHeightId}
                inputMode="numeric"
                max={10000}
                min={100}
                onChange={(event) =>
                  setCustomDimension("height", event.currentTarget.value)
                }
                type="number"
                value={customViewport.height}
              />
              px
            </span>
          </div>
        </div>
      )}

      <section aria-labelledby={viewportSummaryId} className="rdl-metadata">
        <div className="rdl-metadata__title">
          <h3 id={viewportSummaryId}>
            {viewportMode === "custom" ? "Custom viewport" : device.name}
          </h3>
          <span>{widthClass} layout</span>
        </div>
        <dl>
          <div>
            <dt>Logical screen</dt>
            <dd>{dimensionsLabel(logical)} CSS px</dd>
          </div>
          <div>
            <dt>Physical</dt>
            <dd>
              {viewportMode === "custom"
                ? "Not applicable"
                : physical
                  ? `${dimensionsLabel(physical)} px`
                  : "Profile only"}
            </dd>
          </div>
          <div>
            <dt>Pixel ratio</dt>
            <dd>{viewportMode === "custom" ? "1×" : `${device.devicePixelRatio}×`}</dd>
          </div>
          <div>
            <dt>Orientation</dt>
            <dd>{orientation}</dd>
          </div>
        </dl>
      </section>

      <section className="rdl-config__section" aria-labelledby={controlsId}>
        <h3 id={controlsId}>Display controls</h3>
        <button
          aria-label="Rotate viewport"
          className="rdl-button"
          onClick={() =>
            onOrientationChange(
              orientation === "portrait" ? "landscape" : "portrait",
            )
          }
          type="button"
        >
          Rotate viewport
        </button>
        <div aria-label="Display scale" className="rdl-zoom" role="group">
          {ZOOM_OPTIONS.map((option) => (
            <button
              aria-pressed={zoom === option.value}
              key={option.label}
              onClick={() => onZoomChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="rdl-field">
          Custom zoom
          <span className="rdl-field__unit">
            <input
              max={200}
              min={10}
              onChange={(event) => {
                const percent = Number(event.currentTarget.value);
                if (Number.isFinite(percent)) {
                  onZoomChange(resolvePreviewScale(percent / 100, 1));
                }
              }}
              step={1}
              type="number"
              value={zoom === "fit" ? 100 : Math.round(zoom * 100)}
            />
            %
          </span>
        </label>
      </section>

      <section className="rdl-config__section" aria-labelledby={appearanceId}>
        <h3 id={appearanceId}>Appearance</h3>
        <label className="rdl-switch">
          <input
            checked={frameVisible}
            onChange={(event) => onFrameVisibleChange(checked(event))}
            type="checkbox"
          />
          <span>Show device frame</span>
        </label>
        <label className="rdl-switch">
          <input
            checked={showSafeArea}
            onChange={(event) => onShowSafeAreaChange(checked(event))}
            type="checkbox"
          />
          <span>Show safe areas</span>
        </label>
        <label className="rdl-switch">
          <input
            checked={showRulers}
            onChange={(event) => onShowRulersChange(checked(event))}
            type="checkbox"
          />
          <span>Show rulers</span>
        </label>
        <label className="rdl-field">
          Package theme
          <select
            onChange={(event) =>
              onThemeChange(event.currentTarget.value as "light" | "dark")
            }
            value={theme}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>

      {previewRoot !== undefined ? (
        <section className="rdl-config__section" aria-labelledby={exportId}>
          <h3 id={exportId}>Export</h3>
          <button
            aria-busy={exporting}
            className="rdl-button"
            disabled={exportTarget === null || exporting}
            onClick={() => void exportPreview()}
            title={
              exportTarget === null
                ? "PNG export needs a rendered preview stage."
                : "Download a PNG snapshot of the current preview."
            }
            type="button"
          >
            {exporting ? "Exporting…" : "Export PNG"}
          </button>
          {exportError ? (
            <p className="rdl-config__export-error" role="alert">
              {exportError}
            </p>
          ) : null}
        </section>
      ) : null}

      <details className="rdl-scenarios">
        <summary>Environment scenarios</summary>
        <p>
          Application-level preview signals. Native browser and operating-system
          APIs are unchanged.
        </p>
        <label className="rdl-field">
          Target color scheme
          <select
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  colorScheme: event.currentTarget.value as "light" | "dark",
                }),
              )
            }
            value={environment.colorScheme}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="rdl-field">
          Contrast preference
          <select
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  contrast: event.currentTarget.value as
                    | "no-preference"
                    | "more"
                    | "less",
                }),
              )
            }
            value={environment.contrast}
          >
            <option value="no-preference">No preference</option>
            <option value="more">More contrast</option>
            <option value="less">Less contrast</option>
          </select>
        </label>
        <fieldset className="rdl-scenario-grid">
          <legend>Safe-area insets</legend>
          {(["top", "right", "bottom", "left"] as const).map((edge) => (
            <label className="rdl-field" key={edge}>
              {edge[0]?.toLocaleUpperCase("en")}
              {edge.slice(1)}
              <span className="rdl-field__unit">
                <input
                  aria-label={`Safe area ${edge}`}
                  max={4096}
                  min={0}
                  onChange={(event) =>
                    onEnvironmentChange(
                      nextEnvironment(environment, {
                        safeArea: {
                          ...environment.safeArea,
                          [edge]: Number(event.currentTarget.value),
                        },
                      }),
                    )
                  }
                  type="number"
                  value={environment.safeArea[edge]}
                />
                px
              </span>
            </label>
          ))}
        </fieldset>
        <label className="rdl-switch">
          <input
            checked={environment.virtualKeyboard.visible}
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  virtualKeyboard: {
                    ...environment.virtualKeyboard,
                    visible: checked(event),
                  },
                }),
              )
            }
            type="checkbox"
          />
          <span>Show virtual keyboard</span>
        </label>
        <label className="rdl-field">
          Keyboard height
          <span className="rdl-field__unit">
            <input
              max={4096}
              min={0}
              onChange={(event) =>
                onEnvironmentChange(
                  nextEnvironment(environment, {
                    virtualKeyboard: {
                      ...environment.virtualKeyboard,
                      height: Number(event.currentTarget.value),
                    },
                  }),
                )
              }
              type="number"
              value={environment.virtualKeyboard.height}
            />
            px
          </span>
        </label>
        <label className="rdl-field">
          Locale
          <input
            onChange={(event) => {
              const locale = event.currentTarget.value;
              if (!/^[A-Za-z0-9-]{1,35}$/u.test(locale)) return;
              onEnvironmentChange(
                nextEnvironment(environment, { locale }),
              );
            }}
            type="text"
            value={environment.locale}
          />
        </label>
        <label className="rdl-field">
          Direction
          <select
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  direction: event.currentTarget.value as "ltr" | "rtl",
                }),
              )
            }
            value={environment.direction}
          >
            <option value="ltr">Left to right</option>
            <option value="rtl">Right to left</option>
          </select>
        </label>
        <label className="rdl-field">
          Text scale
          <input
            max={3}
            min={0.5}
            onChange={(event) => {
              const textScale = Number(event.currentTarget.value);
              if (
                !Number.isFinite(textScale) ||
                textScale < 0.5 ||
                textScale > 3
              ) {
                return;
              }
              onEnvironmentChange(
                nextEnvironment(environment, {
                  textScale,
                }),
              )
            }}
            step={0.1}
            type="number"
            value={environment.textScale}
          />
        </label>
        <label className="rdl-switch">
          <input
            checked={environment.reducedMotion}
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  reducedMotion: checked(event),
                }),
              )
            }
            type="checkbox"
          />
          <span>Reduce motion</span>
        </label>
        <label className="rdl-field">
          Pointer precision
          <select
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  pointer: event.currentTarget.value as "coarse" | "fine",
                }),
              )
            }
            value={environment.pointer}
          >
            <option value="coarse">Coarse touch pointer</option>
            <option value="fine">Fine pointer</option>
          </select>
        </label>
        <label className="rdl-switch">
          <input
            checked={environment.hover}
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, { hover: checked(event) }),
              )
            }
            type="checkbox"
          />
          <span>Hover available</span>
        </label>
        <label className="rdl-switch">
          <input
            checked={environment.accessibility.screenReader}
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  accessibility: {
                    ...environment.accessibility,
                    screenReader: checked(event),
                  },
                }),
              )
            }
            type="checkbox"
          />
          <span>Screen-reader scenario</span>
        </label>
        <label className="rdl-switch">
          <input
            checked={environment.accessibility.boldText}
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  accessibility: {
                    ...environment.accessibility,
                    boldText: checked(event),
                  },
                }),
              )
            }
            type="checkbox"
          />
          <span>Bold-text scenario</span>
        </label>
        <label className="rdl-field">
          Fold posture
          <select
            onChange={(event) =>
              onEnvironmentChange(
                nextEnvironment(environment, {
                  foldPosture: event.currentTarget.value as
                    | "flat"
                    | "half-open"
                    | "folded",
                }),
              )
            }
            value={environment.foldPosture}
          >
            <option value="flat">Flat</option>
            <option value="half-open">Half open</option>
            <option value="folded">Folded</option>
          </select>
        </label>
        {(["camera", "geolocation", "notifications"] as const).map((name) => (
          <label className="rdl-field" key={name}>
            {name[0]?.toLocaleUpperCase("en")}
            {name.slice(1)} permission scenario
            <select
              onChange={(event) =>
                setPermission(
                  name,
                  event.currentTarget.value as PreviewPermissionState,
                )
              }
              value={environment.permissions[name] ?? "prompt"}
            >
              <option value="prompt">Prompt</option>
              <option value="granted">Granted</option>
              <option value="denied">Denied</option>
            </select>
          </label>
        ))}
      </details>

      <p className="rdl-config__fidelity">
        The iframe is an exact CSS viewport. Hardware, operating-system services,
        and native permission behavior require platform testing.
      </p>
    </div>
  );
}
