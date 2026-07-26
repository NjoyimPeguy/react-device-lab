import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DevicePreviewLab } from "react-device-lab";
import "react-device-lab/styles.css";

import "./styles.css";

function App() {
  return (
    <DevicePreviewLab
      defaultDeviceId="iphone-16-pro-max"
      defaultZoom="fit"
      description="Installed tarball integration"
      src="/target.html"
      title="Packed consumer proof"
    />
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
