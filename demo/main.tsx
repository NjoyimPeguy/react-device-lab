import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  DevicePreviewLab,
  type PreviewTheme,
} from "react-device-lab";
import "react-device-lab/styles.css";

import "./styles.css";

const search = new URLSearchParams(window.location.search);
const theme: PreviewTheme =
  search.get("theme") === "dark" ? "dark" : "light";
const deviceId = search.get("device") ?? "iphone-17-pro";

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <DevicePreviewLab
      badge="Open-source demo"
      defaultDeviceId={deviceId}
      defaultTheme={theme}
      destinations={[
        { id: "overview", label: "Overview", src: "/preview/" },
        {
          id: "components",
          label: "Component gallery",
          src: "/preview/?view=components",
        },
        {
          id: "activity",
          label: "Activity",
          src: "/preview/?view=activity",
        },
      ]}
      src="/preview/"
      syncConfigurationToUrl
    />
  </StrictMode>,
);
