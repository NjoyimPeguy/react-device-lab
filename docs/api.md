# Public API

The package exposes only the root module, the stylesheet, and package metadata.
Do not import `dist/*` or repository source paths.

This guide explains how the exports fit together. For declaration-level
signatures, defaults, units, errors, and property semantics, build the searchable
TypeDoc reference site with `npm run docs:build` and open `site/index.html`.

```ts
import {
  DeviceFrame,
  DevicePreview,
  DevicePreviewLab,
  DeviceSelector,
  PreviewConfigurationPanel,
  DEVICE_PRESETS,
} from "react-device-lab";
```

## Quick start

URL mode previews a running application inside an exact named-device viewport:

```tsx
import { DevicePreviewLab } from "react-device-lab";
import "react-device-lab/styles.css";

export function App() {
  return <DevicePreviewLab src="http://localhost:3000" />;
}
```

Portal mode renders your own React tree inside the isolated preview document
instead of loading a URL:

```tsx
import { DevicePreviewLab } from "react-device-lab";
import "react-device-lab/styles.css";

export function App() {
  return (
    <DevicePreviewLab portalStyles="body { font-family: system-ui; }">
      <CheckoutPage />
    </DevicePreviewLab>
  );
}
```

Every stateful option supports controlled and uncontrolled use; uncontrolled
defaults carry the `default*` prefix, so the snippets above need nothing else.

## Components

- `DevicePreviewLab` composes the complete responsive workspace. It accepts
  either an application `src` or React `children`.
- `DevicePreview` provides the exact viewport, route toolbar, scaling, iframe or
  portal, frame, environment, reload, and new-tab behavior.
- `DeviceFrame` renders an authored skin around arbitrary React content.
- `DeviceSelector` exposes the searchable and grouped catalog control.
- `PreviewConfigurationPanel` is the controlled configuration surface.
- `IframePortal`, `PreviewEnvironmentProvider`, and `VirtualKeyboard` support
  lower-level composition.

## Catalog and helpers

- `DEVICE_PRESETS`
- `searchDevicePresets`
- `groupDevicePresets`
- `getViewportDimensions`
- `getPhysicalResolution`
- `getViewportWidthClass`
- `getDeviceFrameDimensions`
- `computeFitScale` and `resolvePreviewScale`

The catalog is immutable. Helpers never modify a preset.

## Custom device

A custom preset must state logical viewport, physical panel data, selected
pixel ratio, input behavior, authored frame features, and provenance
independently.

```ts
import type { DevicePreset } from "react-device-lab";

export const kioskProfile: DevicePreset = {
  id: "example-kiosk",
  name: "Example kiosk",
  platform: "web",
  category: "desktop",
  family: "Custom displays",
  logicalViewport: {
    width: 1280,
    height: 800,
    profile: "Project-selected CSS viewport",
    source: {
      kind: "profile",
      url: "https://example.test/display-profile",
      note: "Maintained by the consuming project.",
    },
    androidProfile: null,
  },
  physicalResolution: null,
  devicePixelRatio: 1,
  input: {
    touch: true,
    pointer: "coarse",
    hover: false,
  },
  frame: {
    style: "monitor",
    cutout: "none",
    cornerProfile: "squared",
    controls: [],
  },
  fold: null,
};
```

Pass custom profiles through `devices={[...DEVICE_PRESETS, kioskProfile]}`.
Keep IDs stable and leave unknown physical values as `null`; do not infer panel
pixels from CSS dimensions.

## Custom frame

`DeviceFrame` intentionally accepts the package’s authored frame styles rather
than arbitrary artwork. For a completely custom silhouette, turn its frame off
and wrap the exact viewport in consumer CSS:

```tsx
import { DeviceFrame, type DevicePreset } from "react-device-lab";

export function CustomShell({
  device,
  children,
}: {
  device: DevicePreset;
  children: React.ReactNode;
}) {
  return (
    <div className="my-authored-shell">
      <DeviceFrame device={device} frameVisible={false}>
        {children}
      </DeviceFrame>
    </div>
  );
}
```

The wrapper owns decoration only. It must not resize the `DeviceFrame` viewport
if accurate media-query behavior matters.

## State types

The root exports device, orientation, zoom, route, frame, destination, theme,
environment, accessibility, safe-area, permission, fold, bridge, and component
prop types. `DevicePreviewLab` supports controlled and uncontrolled device,
orientation, zoom, frame, theme, safe-area visibility, ruler visibility,
viewport mode, custom dimensions, environment, and destination state. The
embedded application owns its live route; observe it with `onRouteChange`.

Frame visibility uses the canonical `showFrame` / `defaultShowFrame` props.
The original `frameVisible` / `defaultFrameVisible` names keep working as
deprecated aliases, and the canonical name wins when both forms are supplied.
`onFrameVisibleChange` remains the single change callback for both names.

## Rulers and measurement

`DevicePreviewLab` accepts `showRulers` — plus `defaultShowRulers` and
`onShowRulersChange`, following the same controlled/uncontrolled pattern as
`showSafeArea` — and the configuration panel shows a matching toggle. When on,
the preview draws top and left rulers whose origin is the viewport's top-left
corner inside the frame, with labeled major ticks every 50 logical pixels and
minor ticks every 10. Tick labels always read logical device pixels regardless
of zoom, while the strip scales visually with the presentation wrapper. A
pointer crosshair follows the pointer with a logical-coordinate readout and
disappears when the pointer leaves the viewport. While rulers are visible, the
transparent measurement surface captures pointer input over the viewport. The
overlay is `aria-hidden` (the readout is a polite live region) and reserves no
layout space.

`DevicePreview` accepts the same `showRulers` prop, and `DeviceFrame` adds a
`presentationScale` prop so custom compositions can convert pointer positions
when an outer wrapper applies zoom.

```tsx
<DevicePreviewLab src="https://app.example.test/" defaultShowRulers />
```

## Shareable configuration URLs

Pass `syncConfigurationToUrl` to `DevicePreviewLab` so the exact preview state
— device, orientation, zoom, frame visibility, and the full environment
scenario — serializes into the page query string and restores on load. `true`
uses the `rdl` parameter; a string selects a custom parameter name. Updates
use `history.replaceState`, so configuration churn never spams the browser
history. A valid payload present on load wins over `default*` props but loses
to explicitly controlled props. Synchronization is off by default.

```tsx
<DevicePreviewLab src="https://app.example.test/" syncConfigurationToUrl />
```

`readPreviewConfigurationFromSearch` and
`writePreviewConfigurationToSearch` are the standalone helpers behind the
prop. Both are pure and SSR-safe; the reader never throws and returns `null`
for missing or invalid payloads, and the writer preserves unrelated query
parameters. `PREVIEW_CONFIGURATION_URL_PARAM` exposes the default parameter
name.

```ts
import {
  readPreviewConfigurationFromSearch,
  writePreviewConfigurationToSearch,
} from "react-device-lab";

const search = writePreviewConfigurationToSearch(
  window.location.search,
  configuration,
);
const restored = readPreviewConfigurationFromSearch(search);
```

## Keyboard shortcuts

`DevicePreviewLab` enables a plain-key keymap by default: `r` rotates the
viewport, `[` and `]` cycle devices in flattened catalog-group order with
wrap-around, `+` and `-` step the visual scale between 10% and 200% (starting
from 100% when the scale is Fit), `0` resets the scale to Fit, and `f` toggles
the device frame. Bindings never fire while typing in an input, select,
textarea, or contenteditable element, ignore events whose default was already
prevented, and ignore Control, Meta, and Alt so browser and OS combos stay
untouched.

The `keyboardShortcuts` prop controls the keymap: `false` disables every
binding, a partial `PreviewShortcuts` object overrides individual keys, and a
`null` value removes one binding.

```tsx
<DevicePreviewLab
  keyboardShortcuts={{ nextDevice: "n", toggleFrame: null }}
  src="https://app.example.test/"
/>
```

`usePreviewShortcuts` is the standalone hook behind the prop. It attaches one
`keydown` listener while mounted and enabled, stays SSR-safe, and invokes
consumer callbacks for rotate, previous/next device, zoom in/out/reset, and
frame toggle — so portal-mode consumers can bind the same actions to their own
state. See [Accessibility](accessibility.md) for the typing-context guard.

## PNG export

`capturePreviewPng(root, options?)` serializes a rendered preview subtree into
an SVG `foreignObject` with computed styles inlined on every element, then
rasterizes it through an offscreen canvas at the host's `devicePixelRatio`.
The composed preview stage carries a `data-rdl-export-root` marker; pass that
element to snapshot the current orientation, frame visibility, zoom, rulers,
and safe-area overlays exactly as displayed. The promise resolves with the PNG
`Blob` only — no download is triggered — or with a named `File` when
`options.fileName` is supplied.

Same-origin iframe documents, including portal-mode content, are serialized
recursively. Cross-origin iframe pixels are unreachable by design: the export
renders a neutral placeholder block in that region and emits a single console
warning per capture. The function never attempts to read a cross-origin frame.
The same self-containment rule limits same-origin content: browsers fetch no
external subresources for an SVG loaded as an image, so `<img>` sources, CSS
`background-image` URLs, and webfonts export as blank regions or fallback
fonts.
Failures reject with a typed `PreviewPngExportError` whose `code`
distinguishes an empty root, an unavailable canvas, an undecodable serialized
image, and a refused draw or encode.

`DevicePreviewLab` wires the capture into an "Export PNG" action in the
configuration panel. The action downloads
`device-preview-<device>-<orientation>.png`, is disabled with a tooltip until
the preview stage is rendered, and surfaces typed failures as inline text.
Standalone panels receive the same action through the `previewRoot` prop.

```ts
import { capturePreviewPng } from "react-device-lab";

const root = document.querySelector("[data-rdl-export-root]");
if (root instanceof HTMLElement) {
  const blob = await capturePreviewPng(root, { fileName: "checkout-preview" });
}
```

## Recipes

Complete patterns built from the exports above.

### Controlled state

Pair each value prop with its `on*Change` callback. The lab never mutates
controlled values, so a rejected change simply does not render.

```tsx
function ControlledPreview() {
  const [deviceId, setDeviceId] = useState("iphone-17-pro");
  const [showFrame, setShowFrame] = useState(true);

  return (
    <DevicePreviewLab
      deviceId={deviceId}
      onDeviceChange={(device) => setDeviceId(device.id)}
      onFrameVisibleChange={setShowFrame}
      showFrame={showFrame}
      src="http://localhost:3000"
    />
  );
}
```

### Custom device list

Append project-defined presets — such as the `kioskProfile` from
[Custom device](#custom-device) — without losing the built-in catalog.

```tsx
<DevicePreviewLab
  defaultDeviceId="example-kiosk"
  devices={[...DEVICE_PRESETS, kioskProfile]}
  src="http://localhost:3000"
/>
```

### Shareable configuration URL

Persist device, orientation, zoom, frame visibility, and environment in the
query string so a link restores the exact preview.

```tsx
<DevicePreviewLab src="http://localhost:3000" syncConfigurationToUrl />
```

See [Shareable configuration URLs](#shareable-configuration-urls) for custom
parameter names and the standalone reader and writer helpers.

### Environment scenario

Start from a scenario — dark color scheme with the virtual keyboard open —
while the device keeps suggesting everything else.

```tsx
<DevicePreviewLab
  defaultEnvironment={{
    colorScheme: "dark",
    virtualKeyboard: { visible: true, height: 300 },
  }}
  src="http://localhost:3000"
/>
```

### Keyboard shortcuts and rulers

Keep the default plain-key keymap, remap device cycling, and open with the
measurement rulers visible.

```tsx
<DevicePreviewLab
  defaultShowRulers
  keyboardShortcuts={{ nextDevice: "n", previousDevice: "p" }}
  src="http://localhost:3000"
/>
```

### Custom viewport

Preview exact consumer dimensions instead of a named device.

```tsx
<DevicePreviewLab
  defaultCustomViewport={{ width: 500, height: 900 }}
  defaultViewportMode="custom"
  src="http://localhost:3000"
/>
```

### PNG export callback

The configuration panel's built-in "Export PNG" action covers the common
case. Call `capturePreviewPng` directly when the host application owns the
export UI.

```tsx
async function handleExportClick() {
  const root = document.querySelector<HTMLElement>("[data-rdl-export-root]");
  if (!root) return;
  const blob = await capturePreviewPng(root, { fileName: "device-preview" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}
```

## Bridge and environment utilities

- `installPreviewBridge` and `notifyPreviewRoute`
- guarded message creators and `parsePreviewBridgeMessage`
- `createPreviewEnvironment`
- `serializePreviewConfiguration` and `parsePreviewConfiguration`
- `readPreviewConfigurationFromSearch` and `writePreviewConfigurationToSearch`
- `applyPreviewEnvironment`
- `createPreviewRouteState` and `formatPreviewRoute`

See [iframe modes and the bridge](iframe-and-bridge.md) before integrating these
utilities across a trust boundary.
