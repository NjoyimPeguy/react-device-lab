import { useEffect, useMemo, useRef } from "react";

import { DEVICE_PRESETS } from "../catalog/devicePresets.js";
import { getViewportWidthClass } from "../catalog/dimensions.js";
import { createPreviewEnvironment } from "../environment/configuration.js";
import { useControllableState } from "../hooks/useControllableState.js";
import type {
  DeviceCategory,
  DeviceOrientation,
  DevicePreset,
  ViewportDimensions,
} from "../types/device.js";
import type { PreviewEnvironment } from "../types/environment.js";
import type {
  DevicePreviewLabProps,
  PreviewTheme,
  PreviewViewportMode,
} from "../types/lab.js";
import type { PreviewZoom } from "../types/preview.js";
import { DevicePreview } from "./DevicePreview.js";
import { PreviewConfigurationPanel } from "./PreviewConfigurationPanel.js";

const CUSTOM_SOURCE = Object.freeze({
  kind: "profile" as const,
  url: "https://github.com/NjoyimPeguy/react-device-lab#custom-viewports",
  note: "Consumer-defined CSS viewport profile.",
});

function customCategory(width: number): DeviceCategory {
  const widthClass = getViewportWidthClass(width);
  if (widthClass === "compact") return "phone";
  if (widthClass === "medium") return "tablet";
  return "desktop";
}

function createCustomPreset(
  viewport: ViewportDimensions,
): DevicePreset {
  const category = customCategory(viewport.width);
  const touch = category !== "desktop";
  const frameStyle =
    category === "phone"
      ? "phone-punch-hole"
      : category === "tablet"
        ? "tablet"
        : "monitor";

  return {
    id: "custom-viewport",
    name: "Custom viewport",
    platform: "web",
    category,
    family: "Custom viewport",
    logicalViewport: {
      ...viewport,
      profile: "Consumer-defined CSS viewport",
      source: CUSTOM_SOURCE,
      androidProfile: null,
    },
    physicalResolution: null,
    devicePixelRatio: 1,
    input: {
      touch,
      pointer: touch ? "coarse" : "fine",
      hover: !touch,
    },
    frame: {
      style: frameStyle,
      cutout: "none",
      cornerProfile: category === "desktop" ? "squared" : "rounded",
      controls: [],
    },
    fold: null,
  };
}

function suggestedEnvironment(
  device: DevicePreset,
  orientation: DeviceOrientation,
): PreviewEnvironment {
  const top =
    device.frame.cutout === "dynamic-island"
      ? 59
      : device.frame.cutout === "traditional-notch"
        ? 47
        : device.frame.cutout === "punch-hole"
          ? 28
          : device.frame.cutout === "tablet-notch" ||
              device.frame.cutout === "laptop-notch"
            ? 24
            : 0;
  const bottom =
    device.platform === "ios" &&
    (device.category === "phone" || device.category === "foldable")
      ? 34
      : device.input.touch
        ? 24
        : 0;
  const safeArea =
    orientation === "landscape" &&
    (device.category === "phone" || device.category === "foldable")
      ? { top: 0, right: top, bottom, left: top }
      : { top, right: 0, bottom, left: 0 };
  return createPreviewEnvironment({
    pointer: device.input.pointer,
    hover: device.input.hover,
    permissions: {
      camera: "prompt",
      geolocation: "prompt",
      notifications: "prompt",
    },
    safeArea,
    virtualKeyboard: {
      visible: false,
      height: device.input.touch ? 300 : 0,
    },
  });
}

function sameSafeArea(
  left: PreviewEnvironment["safeArea"],
  right: PreviewEnvironment["safeArea"],
): boolean {
  return (
    left.top === right.top &&
    left.right === right.right &&
    left.bottom === right.bottom &&
    left.left === right.left
  );
}

function findDevice(
  devices: readonly DevicePreset[],
  id: string,
): DevicePreset {
  return (
    devices.find((device) => device.id === id) ??
    devices[0] ??
    (() => {
      throw new TypeError("DevicePreviewLab requires at least one device.");
    })()
  );
}

/**
 * Renders the complete responsive device-preview workspace.
 *
 * At desktop widths the preview stage and fixed configuration panel share one
 * row and scroll independently. Narrow hosts use a stacked layout. Stateful
 * options support both controlled and uncontrolled React patterns.
 *
 * @param props - Mutually exclusive URL or React-portal lab props.
 * @returns The themed lab header, route tools, preview stage, and configuration
 * panel.
 *
 * @example
 * ```tsx
 * <DevicePreviewLab
 *   defaultDeviceId="pixel-10"
 *   defaultTheme="dark"
 *   src="http://localhost:3000"
 * />
 * ```
 */
export function DevicePreviewLab(props: DevicePreviewLabProps) {
  const devices = props.devices ?? DEVICE_PRESETS;
  const initialDevice = findDevice(
    devices,
    props.deviceId ?? props.defaultDeviceId ?? devices[0]?.id ?? "",
  );
  const [deviceId, setDeviceId] = useControllableState<string>({
    value: props.deviceId,
    defaultValue: initialDevice.id,
    onChange: undefined,
  });
  const selectedDevice = findDevice(devices, deviceId);
  const [orientation, setOrientation] = useControllableState({
    value: props.orientation,
    defaultValue: props.defaultOrientation ?? "portrait",
    onChange: props.onOrientationChange,
  });
  const [zoom, setZoom] = useControllableState<PreviewZoom>({
    value: props.zoom,
    defaultValue: props.defaultZoom ?? "fit",
    onChange: props.onZoomChange,
  });
  const [frameVisible, setFrameVisible] = useControllableState({
    value: props.frameVisible,
    defaultValue: props.defaultFrameVisible ?? true,
    onChange: props.onFrameVisibleChange,
  });
  const [theme, setTheme] = useControllableState<PreviewTheme>({
    value: props.theme,
    defaultValue: props.defaultTheme ?? "light",
    onChange: props.onThemeChange,
  });
  const [showSafeArea, setShowSafeArea] = useControllableState({
    value: props.showSafeArea,
    defaultValue: props.defaultShowSafeArea ?? false,
    onChange: props.onShowSafeAreaChange,
  });
  const [viewportMode, setViewportMode] =
    useControllableState<PreviewViewportMode>({
      value: props.viewportMode,
      defaultValue: props.defaultViewportMode ?? "device",
      onChange: props.onViewportModeChange,
    });
  const [customViewport, setCustomViewport] = useControllableState({
    value: props.customViewport,
    defaultValue: props.defaultCustomViewport ?? {
      width: 412,
      height: 915,
    },
    onChange: props.onCustomViewportChange,
  });
  const [environment, setEnvironment] =
    useControllableState<PreviewEnvironment>({
      value: props.environment,
      defaultValue: (() => {
        const suggested = suggestedEnvironment(initialDevice, orientation);
        return createPreviewEnvironment({
          ...suggested,
          ...props.defaultEnvironment,
          safeArea: {
            ...suggested.safeArea,
            ...props.defaultEnvironment?.safeArea,
          },
          virtualKeyboard: {
            ...suggested.virtualKeyboard,
            ...props.defaultEnvironment?.virtualKeyboard,
          },
          accessibility: {
            ...suggested.accessibility,
            ...props.defaultEnvironment?.accessibility,
          },
          permissions: {
            ...suggested.permissions,
            ...props.defaultEnvironment?.permissions,
          },
        });
      })(),
      onChange: props.onEnvironmentChange,
    });
  const automaticEnvironmentProfile = useRef(
    `${initialDevice.id}:${orientation}`,
  );
  const automaticSafeArea = useRef<
    PreviewEnvironment["safeArea"] | null
  >(
    props.defaultEnvironment?.safeArea === undefined
      ? suggestedEnvironment(initialDevice, orientation).safeArea
      : null,
  );
  useEffect(() => {
    const profile = `${selectedDevice.id}:${orientation}`;
    if (
      props.environment !== undefined ||
      automaticEnvironmentProfile.current === profile
    ) {
      return;
    }
    automaticEnvironmentProfile.current = profile;
    const suggested = suggestedEnvironment(selectedDevice, orientation);
    const useSuggestedSafeArea =
      automaticSafeArea.current !== null &&
      sameSafeArea(environment.safeArea, automaticSafeArea.current);
    automaticSafeArea.current = useSuggestedSafeArea
      ? suggested.safeArea
      : null;
    setEnvironment(
      createPreviewEnvironment({
        ...environment,
        pointer: selectedDevice.input.pointer,
        hover: selectedDevice.input.hover,
        safeArea: useSuggestedSafeArea
          ? suggested.safeArea
          : environment.safeArea,
        virtualKeyboard: {
          ...environment.virtualKeyboard,
          height: suggested.virtualKeyboard.height,
        },
      }),
    );
  }, [
    environment,
    orientation,
    props.environment,
    selectedDevice,
    setEnvironment,
  ]);
  const destinations =
    "src" in props ? (props.destinations ?? []) : [];
  const initialDestinationId =
    ("src" in props ? props.defaultDestinationId : undefined) ??
    destinations[0]?.id ??
    "";
  const controlledDestinationId =
    "src" in props ? props.destinationId : undefined;
  const [destinationId, setDestinationId] = useControllableState({
    value: controlledDestinationId,
    defaultValue: initialDestinationId,
    onChange: undefined,
  });
  const selectedDestination = destinations.find(
    (destination) => destination.id === destinationId,
  );
  const effectiveDestination = selectedDestination ?? destinations[0];
  const customDevice = useMemo(
    () => createCustomPreset(customViewport),
    [customViewport],
  );
  const activeDevice =
    viewportMode === "custom" ? customDevice : selectedDevice;
  const classes = ["rdl-lab", props.className].filter(Boolean).join(" ");

  const handleDeviceChange = (device: DevicePreset) => {
    setDeviceId(device.id);
    props.onDeviceChange?.(device);
  };

  const panel = (
    <PreviewConfigurationPanel
      {...(destinations.length > 0
        ? {
            destinations,
            destinationId:
              effectiveDestination?.id ?? "",
            onDestinationChange: (destination) => {
              setDestinationId(destination.id);
              if ("src" in props) props.onDestinationChange?.(destination);
            },
          }
        : {})}
      customViewport={customViewport}
      device={selectedDevice}
      devices={devices}
      environment={environment}
      frameVisible={frameVisible}
      onCustomViewportChange={setCustomViewport}
      onDeviceChange={handleDeviceChange}
      onEnvironmentChange={setEnvironment}
      onFrameVisibleChange={setFrameVisible}
      onOrientationChange={setOrientation}
      onShowSafeAreaChange={setShowSafeArea}
      onThemeChange={setTheme}
      onViewportModeChange={setViewportMode}
      onZoomChange={setZoom}
      orientation={orientation}
      showSafeArea={showSafeArea}
      theme={theme}
      viewportMode={viewportMode}
      zoom={zoom}
    />
  );

  return (
    <main
      aria-label="Device preview lab"
      className={classes}
      data-rdl-theme={theme}
      data-rdl-workspace-mode={props.workspaceMode ?? "fullscreen"}
    >
      <header className="rdl-lab__header">
        <div className="rdl-lab__identity">
          <span aria-hidden="true" className="rdl-lab__mark">
            ↗
          </span>
          <div>
            <h1>{props.title ?? "Device Preview Lab"}</h1>
            <p>
              {props.description ??
                "Exact responsive viewports for web application review"}
            </p>
          </div>
        </div>
        {props.badge ? (
          <div className="rdl-lab__badge">{props.badge}</div>
        ) : null}
      </header>
      {props.notice ? (
        <div className="rdl-lab__notice">{props.notice}</div>
      ) : null}
      <div className="rdl-lab__workspace">
        <section aria-label="Preview stage" className="rdl-lab__stage">
          {"src" in props && props.src !== undefined ? (
            <DevicePreview
              {...(props.allow !== undefined ? { allow: props.allow } : {})}
              {...(props.bridgeOrigins !== undefined
                ? { bridgeOrigins: props.bridgeOrigins }
                : {})}
              {...(props.referrerPolicy !== undefined
                ? { referrerPolicy: props.referrerPolicy }
                : {})}
              {...(props.sandbox !== undefined
                ? { sandbox: props.sandbox }
                : {})}
              className="rdl-lab__preview"
              device={activeDevice}
              environment={environment}
              fitPadding={props.fitPadding ?? 24}
              frameVisible={frameVisible}
              {...(props.onRouteChange !== undefined
                ? { onRouteChange: props.onRouteChange }
                : {})}
              orientation={orientation}
              showSafeArea={showSafeArea}
              src={effectiveDestination?.src ?? props.src}
              zoom={zoom}
            />
          ) : (
            <DevicePreview
              className="rdl-lab__preview"
              device={activeDevice}
              environment={environment}
              fitPadding={props.fitPadding ?? 24}
              frameVisible={frameVisible}
              {...(props.onRouteChange !== undefined
                ? { onRouteChange: props.onRouteChange }
                : {})}
              orientation={orientation}
              portalStyles={props.portalStyles ?? ""}
              showSafeArea={showSafeArea}
              zoom={zoom}
            >
              {props.children}
            </DevicePreview>
          )}
        </section>
        <aside
          aria-label="Preview configuration"
          className="rdl-lab__panel"
        >
          {panel}
        </aside>
      </div>
    </main>
  );
}
