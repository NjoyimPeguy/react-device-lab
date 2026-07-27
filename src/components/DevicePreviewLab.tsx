import { useEffect, useMemo, useRef } from "react";

import { DEVICE_PRESETS } from "../catalog/devicePresets.js";
import { getViewportWidthClass } from "../catalog/dimensions.js";
import { groupDevicePresets } from "../catalog/group.js";
import { createPreviewEnvironment } from "../environment/configuration.js";
import { useControllableState } from "../hooks/useControllableState.js";
import { usePreviewShortcuts } from "../hooks/usePreviewShortcuts.js";
import { useUrlConfiguration } from "../hooks/useUrlConfiguration.js";
import { resolvePreviewScale } from "../preview/scaling.js";
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
import type { PreviewConfiguration, PreviewZoom } from "../types/preview.js";
import { DevicePreview } from "./DevicePreview.js";
import { PreviewConfigurationPanel } from "./PreviewConfigurationPanel.js";

const CUSTOM_SOURCE = Object.freeze({
  kind: "profile" as const,
  url: "https://github.com/NjoyimPeguy/react-device-lab#custom-viewports",
  note: "Consumer-defined CSS viewport profile.",
});

const ZOOM_KEYBOARD_STEP = 0.1;

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
  const [showRulers, setShowRulers] = useControllableState({
    value: props.showRulers,
    defaultValue: props.defaultShowRulers ?? false,
    onChange: props.onShowRulersChange,
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
  const urlConfiguration = useMemo<PreviewConfiguration>(
    () => ({
      version: 1,
      deviceId: selectedDevice.id,
      orientation,
      zoom,
      frameVisible,
      environment,
    }),
    [selectedDevice.id, orientation, zoom, frameVisible, environment],
  );
  useUrlConfiguration(
    props.syncConfigurationToUrl,
    urlConfiguration,
    (restored) => {
      const restoredDevice =
        props.deviceId === undefined
          ? devices.find((device) => device.id === restored.deviceId)
          : undefined;
      if (restoredDevice !== undefined) {
        setDeviceId(restoredDevice.id);
        props.onDeviceChange?.(restoredDevice);
      }
      if (props.orientation === undefined) {
        setOrientation(restored.orientation);
      }
      if (props.zoom === undefined) setZoom(restored.zoom);
      if (props.frameVisible === undefined) {
        setFrameVisible(restored.frameVisible);
      }
      if (props.environment === undefined) {
        setEnvironment(restored.environment);
      }
      // Keep the automatic environment profile aligned with the restored
      // device and orientation so the restored environment is not replaced.
      const nextDevice = restoredDevice ?? selectedDevice;
      automaticEnvironmentProfile.current = `${nextDevice.id}:${
        props.orientation ?? restored.orientation
      }`;
      automaticSafeArea.current = null;
    },
  );
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

  const shortcutDevices = useMemo(
    () => groupDevicePresets(devices).flatMap((group) => group.devices),
    [devices],
  );

  const cycleShortcutDevice = (direction: 1 | -1) => {
    if (shortcutDevices.length < 2) return;
    const currentIndex = shortcutDevices.findIndex(
      (device) => device.id === deviceId,
    );
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + shortcutDevices.length) %
          shortcutDevices.length;
    const next = shortcutDevices[nextIndex];
    if (next !== undefined && next.id !== deviceId) {
      handleDeviceChange(next);
    }
  };

  const stepZoom = (direction: 1 | -1) => {
    const current = zoom === "fit" ? 1 : zoom;
    setZoom(
      resolvePreviewScale(
        Math.round((current + direction * ZOOM_KEYBOARD_STEP) * 100) / 100,
        1,
      ),
    );
  };

  usePreviewShortcuts({
    ...(typeof props.keyboardShortcuts === "object"
      ? { bindings: props.keyboardShortcuts }
      : {}),
    callbacks: {
      onRotate: () =>
        setOrientation(orientation === "portrait" ? "landscape" : "portrait"),
      onPreviousDevice: () => cycleShortcutDevice(-1),
      onNextDevice: () => cycleShortcutDevice(1),
      onZoomIn: () => stepZoom(1),
      onZoomOut: () => stepZoom(-1),
      onZoomReset: () => setZoom("fit"),
      onToggleFrame: () => setFrameVisible(!frameVisible),
    },
    enabled: props.keyboardShortcuts !== false,
  });

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
      onShowRulersChange={setShowRulers}
      onThemeChange={setTheme}
      onViewportModeChange={setViewportMode}
      onZoomChange={setZoom}
      orientation={orientation}
      showRulers={showRulers}
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
              showRulers={showRulers}
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
              showRulers={showRulers}
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
