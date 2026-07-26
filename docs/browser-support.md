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
- same-origin DOM access only where the browser permits it.

Older embedded webviews may require application-level transpilation or CSS
fallbacks. Cross-origin restrictions are browser security behavior, not a
compatibility bug.

Frame screenshots are generated in Linux Chromium for deterministic review.
Small antialiasing and font differences are expected across operating systems;
logical viewport dimensions and DOM geometry are asserted independently from
pixel comparisons.

Open-in-new-tab behavior can be blocked by browser popup policy if it is not
triggered by a user action. The built-in button performs the call directly from
the click and uses `noopener,noreferrer`.
