import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  DevicePreviewLab,
  type PreviewTheme,
} from "../../src/index.js";
import "../../src/styles/index.css";
import "./lab-harness.css";

const search = new URLSearchParams(window.location.search);
const theme: PreviewTheme =
  search.get("theme") === "dark" ? "dark" : "light";
const deviceId = search.get("device") ?? "pixel-10";

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <DevicePreviewLab
      badge="Local preview"
      defaultDeviceId={deviceId}
      defaultTheme={theme}
      destinations={[
        {
          id: "overview",
          label: "Overview",
          src: "/tests/browser/preview-target.html",
        },
        {
          id: "tasks",
          label: "Tasks",
          src: "/tests/browser/preview-target.html?screen=tasks",
        },
      ]}
      src="/tests/browser/preview-target.html"
    />
  </StrictMode>,
);
