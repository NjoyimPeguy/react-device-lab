# Iframe modes, fidelity, and the optional bridge

React Device Lab previews responsive web applications. It is not an iOS,
Android, browser-engine, or hardware emulator. The iframe supplies a real CSS
viewport; the package can visualize selected environment scenarios around and
inside that viewport, but it cannot recreate an operating system.

## Same-origin source mode

For a same-origin `src`, the host can read the iframe location, follow
client-side `history` and hash navigation, apply preview environment attributes
and CSS custom properties, and hide scrollbar chrome for touch profiles without
disabling scrolling. The displayed route is marked as synchronized after the
first successful inspection.

Link and form navigations to another same-origin document remain inspectable.
An unannounced programmatic document navigation can make the frame opaque. The
host then stops inspection rather than attempting access that the browser may
forbid. Install the bridge when route continuity across arbitrary document or
origin transitions is required.

## Cross-origin source mode

A cross-origin `src` still renders. Without cooperation from the target, the
host cannot read its current location, inject styles, or apply environment
signals. In that state, the toolbar labels the value as the initial route and
shows that synchronization is pending. It must not be interpreted as a live
route.

The optional bridge enables route and configuration messages. Both sides use
exact origin allow-lists; wildcard target origins are rejected. The host also
checks the sending window, message schema, protocol version, event origin, and
reported URL origin before accepting a route. A target must apply an appropriate
`frame-ancestors` policy and should accept only parents it actually trusts.

```ts
import { installPreviewBridge } from "react-device-lab";

const uninstall = installPreviewBridge({
  allowedParentOrigins: ["https://preview.example.test"],
});
```

The bridge carries preview configuration and route state. It does not grant DOM
access, bypass iframe sandboxing, or weaken the browser same-origin policy.

## Consumer-rendered portal mode

`IframePortal` and the `DevicePreview` children form render React nodes into an
iframe document. CSS media and container queries therefore see the iframe's
logical viewport, not a resized host `div`. `usePreviewEnvironment()` also
receives the selected preview scenario.

React event handlers and component closures still execute in the host
JavaScript realm. Reading the global `window` from portal content returns the
host window, not the iframe window. Libraries that inject CSS into the host
document may need an iframe-head or style-container adapter; use `portalStyles`
for straightforward authored CSS. Portal mode must not be used to claim a
different JavaScript runtime, user agent, browser engine, or native device.

## Environment visualization

Safe-area insets, virtual-keyboard occlusion, permissions, locale, direction,
text scale, contrast, motion, pointer, hover, color scheme, accessibility flags,
and fold posture are serialized scenario data. Integrated targets receive
product-neutral data attributes, CSS custom properties, and a configuration
event. The package does not replace `navigator.permissions`, synthesize native
keyboards, alter hardware sensors, reproduce system bars, or make CSS `env()`
values behave like a physical operating system. Validate native behavior with
real devices and the relevant platform tools.
