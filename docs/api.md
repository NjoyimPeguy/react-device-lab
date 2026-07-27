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
orientation, zoom, frame, theme, safe-area visibility, viewport mode, custom
dimensions, environment, and destination state. The embedded application owns
its live route; observe it with `onRouteChange`.

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
