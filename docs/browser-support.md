# Browser support

The browser-rendered release gate covers the Chromium and WebKit versions
installed by the locked Playwright release. Current Firefox is a compatibility
target, but it is not yet part of the automated release matrix and should be
treated as best-effort until that coverage is added. Older major versions and
embedded webviews are not guaranteed.

The package relies on:

- ES2022 modules and syntax;
- React 18.2+ or React 19;
- iframe `postMessage`, `ResizeObserver`, CSS custom properties, grid, flexbox,
  `color-mix()`, `dvh`, and `:focus-visible`;
- SVG `foreignObject` rasterization through an offscreen 2D canvas for PNG
  export. The serialized SVG loads from a `data:` URL because Chromium and
  WebKit taint canvases drawn from `blob:` URL SVG images that contain a
  `foreignObject`;
- same-origin DOM access only where the browser permits it.

Older embedded webviews may require application-level transpilation or CSS
fallbacks. Cross-origin restrictions are browser security behavior, not a
compatibility bug.

PNG export follows the same rule. Same-origin iframe documents are serialized
recursively into the snapshot, while cross-origin iframe regions render as a
neutral placeholder block with a single console warning per capture. Hosts
that refuse the draw or the encode surface a typed `PreviewPngExportError`
instead of a silent failure.

Release screenshot baselines are generated and compared in the exact, pinned
Playwright Noble container declared by the CI and release workflows. This keeps
the browser build, fonts, and rasterization environment aligned. Host-generated
screenshots remain useful for local review, but small antialiasing and font
differences are expected across operating systems. Logical viewport dimensions
and DOM geometry are asserted independently from pixel comparisons.

Open-in-new-tab behavior can be blocked by browser popup policy if it is not
triggered by a user action. The built-in button performs the call directly from
the click and uses `noopener,noreferrer`.
