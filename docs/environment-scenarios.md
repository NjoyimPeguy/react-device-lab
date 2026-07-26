# Environment scenarios and native boundaries

React Device Lab can exercise application responses to selected environment
conditions without claiming to replace the operating system.

## What the package can provide

For same-origin targets, portal content, and cooperating bridge targets, a
`PreviewEnvironment` can provide:

- safe-area inset values and an optional visible overlay;
- a visible virtual-keyboard occlusion layer and height;
- locale and text direction;
- text scale, contrast preference, reduced-motion, and color-scheme values;
- coarse/fine pointer and hover scenarios;
- folded, half-open, and flat posture values;
- screen-reader and bold-text scenario flags;
- prompt, granted, or denied application-level permission states.

Integrated documents receive product-neutral `data-rdl-*` attributes,
`--rdl-*` CSS custom properties, and a
`react-device-lab:environment` `CustomEvent`. A cross-origin target receives
the same configuration only after installing the bridge.

```css
.page {
  padding:
    var(--rdl-safe-area-inset-top, 0)
    var(--rdl-safe-area-inset-right, 0)
    var(--rdl-safe-area-inset-bottom, 0)
    var(--rdl-safe-area-inset-left, 0);
}

html[data-rdl-virtual-keyboard="true"] .composer {
  margin-bottom: var(--rdl-virtual-keyboard-height, 0);
}
```

These values are useful for deterministic component states and layout
occlusion testing. The package also hides scrollbar chrome in integrated touch
profiles while leaving scrolling enabled; fine-pointer desktop profiles retain
system scrollbars.

## What a browser preview cannot provide

A host package cannot change the iframe’s browser engine, operating system,
native safe-area environment variables, actual input method editor, permission
store, hardware sensors, camera stream, GPS, battery, radio stack, user agent,
native accessibility tree, system bars, or compositor. It cannot force a
cross-origin document to accept injected values.

Permission scenarios are application-level test data; they do not replace
`navigator.permissions` or generate real browser prompts. The virtual keyboard
is a deterministic overlay; it does not reproduce IME composition,
autocorrection, hardware-keyboard attachment, or operating-system resize modes.
A safe-area overlay checks content clearance but does not prove a native
platform’s insets.

Use real browsers, real devices, and platform tools for those behaviors. This
division is similar to responsive design mode: high value for web layout and
state coverage, no claim of native emulation.

## Consumer integration

Portal content can read scenarios with `usePreviewEnvironment()`. Iframe targets
can read the applied attributes, properties, or event:

```ts
document.addEventListener("react-device-lab:environment", (event) => {
  const environment = (event as CustomEvent).detail;
  console.info(environment.foldPosture);
});
```

Treat all preview configuration as untrusted input when it crosses an iframe
boundary. The bridge validates structure and origins, but the target remains
responsible for how it uses scenario data.
