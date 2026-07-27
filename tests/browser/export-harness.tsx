import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  capturePreviewPng,
  DevicePreviewLab,
} from "../../src/index.js";
import "../../src/styles/index.css";
import "./lab-harness.css";

declare global {
  interface Window {
    __rdlExportPreview?: () => Promise<Blob>;
  }
}

const search = new URLSearchParams(window.location.search);
const crossOrigin = search.get("origin") === "cross";
const deviceId = search.get("device") ?? "pixel-10";
const src = new URL(
  "/tests/browser/preview-target.html",
  crossOrigin ? "http://127.0.0.1:4174" : window.location.origin,
).href;

window.__rdlExportPreview = () => {
  const root = document.querySelector<HTMLElement>("[data-rdl-export-root]");
  if (!root) {
    return Promise.reject(new TypeError("Missing the composed export root."));
  }
  return capturePreviewPng(root);
};

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <DevicePreviewLab badge="Export harness" defaultDeviceId={deviceId} src={src} />
  </StrictMode>,
);
