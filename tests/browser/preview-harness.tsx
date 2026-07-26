import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  DEVICE_PRESETS,
  DevicePreview,
  type DevicePreset,
} from "../../src/index.js";
import "../../src/styles/index.css";
import "./preview-harness.css";

const search = new URLSearchParams(window.location.search);
const mode = search.get("mode") ?? "source";
const crossOrigin = search.get("origin") === "cross";
const bridgeEnabled = search.get("bridge") === "true";
const requestedDevice = search.get("device") ?? "iphone-16-pro-max";
const requestedZoom = search.get("zoom");
const device =
  DEVICE_PRESETS.find(({ id }) => id === requestedDevice) ??
  DEVICE_PRESETS[0] ??
  (() => {
    throw new TypeError("The preview harness requires a device preset.");
  })();
const orientation =
  device.category === "laptop" ||
  device.category === "desktop" ||
  device.category === "ultrawide"
    ? "landscape"
    : "portrait";
const zoom =
  requestedZoom === null || requestedZoom === "fit"
    ? "fit"
    : Number(requestedZoom);

function getTargetUrl(): string {
  const target = new URL(
    "/tests/browser/preview-target.html",
    crossOrigin ? "http://127.0.0.1:4174" : window.location.origin,
  );
  if (bridgeEnabled) {
    target.searchParams.set("bridge", "true");
    target.searchParams.set("parent", window.location.origin);
  }
  return target.href;
}

function PortalApplication({ selectedDevice }: { selectedDevice: DevicePreset }) {
  return (
    <main className="portal-application">
      <h1>Portal application</h1>
      <p>Rendered for {selectedDevice.name}</p>
      <output aria-label="Portal host realm width">
        Host realm: {window.innerWidth}
      </output>
    </main>
  );
}

function PreviewHarness() {
  const shared = {
    device,
    fitBounds: { width: 1280, height: 760 },
    frameVisible: true,
    orientation,
    showSafeArea: true,
    zoom,
  } as const;

  return (
    <main className="preview-harness">
      <h1 className="preview-harness__title">Preview engine harness</h1>
      {mode === "portal" ? (
        <DevicePreview
          {...shared}
          portalStyles={`
            body { background: #eef2ff; }
            .portal-application::after { content: "compact"; }
            @media (min-width: 600px) {
              .portal-application::after { content: "wide"; }
            }
          `}
        >
          <PortalApplication selectedDevice={device} />
        </DevicePreview>
      ) : (
        <DevicePreview
          {...shared}
          {...(crossOrigin && bridgeEnabled
            ? { bridgeOrigins: ["http://127.0.0.1:4174"] }
            : {})}
          environment={{
            safeArea: { top: 36, right: 0, bottom: 24, left: 0 },
          }}
          src={getTargetUrl()}
        />
      )}
    </main>
  );
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <PreviewHarness />
  </StrictMode>,
);
