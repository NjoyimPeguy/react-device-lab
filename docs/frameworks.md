# Framework and SSR integration

Package modules do not evaluate browser globals during import, so they can be
resolved by server-side build tools. Actual iframe and portal work begins after
React mounts in a browser.

## Vite

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DevicePreviewLab } from "react-device-lab";
import "react-device-lab/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DevicePreviewLab src="http://localhost:5174" />
  </StrictMode>,
);
```

During development, start the target application separately and ensure it
permits the Vite host origin to frame it. The repository’s `demo/` is a
multi-page Vite example that imports only public package entry points. See the
[official Vite guide](https://vite.dev/guide/) for project setup.

## Next.js App Router

Import package CSS from the root layout and place the interactive lab in a
Client Component:

```tsx
// app/layout.tsx
import "react-device-lab/styles.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
```

```tsx
// app/device-lab/preview-client.tsx
"use client";

import { DevicePreviewLab } from "react-device-lab";

export function PreviewClient() {
  return <DevicePreviewLab src="http://localhost:3000/example" />;
}
```

```tsx
// app/device-lab/page.tsx
import { PreviewClient } from "./preview-client";

export default function DeviceLabPage() {
  return <PreviewClient />;
}
```

The package import is SSR-safe, but the component is interactive and should be
owned by a Client Component. Whether a Next.js route may frame another route is
controlled by the application’s CSP and response headers. Do not weaken those
headers globally just to enable a preview.

## Other SSR frameworks

- Keep the stylesheet in the framework’s supported global-style entry.
- Render `DevicePreviewLab` only where hydration is expected.
- Do not read target route or environment state during server render.
- Use `workspaceMode="bounded"` when a framework layout, rather than the lab,
  owns viewport height.
- Verify portals and CSS-in-JS libraries: some inject styles into the host head
  and need an iframe-head adapter. Plain `portalStyles` works for static CSS.
