# React Device Lab agent guide

## Project

`react-device-lab` is a public, product-neutral React package for previewing web
applications inside exact named-device viewports. It is a responsive application
preview tool, not an operating-system or hardware emulator.

## Repository layout

- `src/types/` — stable public TypeScript contracts.
- `src/catalog/` — immutable presets and pure catalog/dimension helpers.
- `src/frames/` — repository-authored device-frame primitives.
- `src/components/` — public React components.
- `src/bridge/` — optional, exact-origin iframe bridge.
- `src/hooks/` — browser lifecycle hooks; never access globals at import time.
- `src/styles/` — exported package CSS using `--rdl-*` custom properties.
- `demo/` — generic application consuming public exports only.
- `tests/` — unit, component, accessibility, browser, package, and consumer tests.
- `scripts/` — deterministic build, package, screenshot, and validation tools.
- `docs/` — public guides and device-data provenance.

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run docs:build
npm run test:browser
npm run test:a11y
npm run pack:check
npm run neutrality:check
npm run verify
```

Run the focused test during development and `npm run verify` before calling the
branch complete. Browser tests require Playwright Chromium and WebKit.

## Engineering rules

- Write tests before implementation for behavior or logic.
- Keep React and React DOM as peer dependencies.
- Keep modules ESM, tree-shakeable, and SSR-safe. Never evaluate `window`,
  `document`, `location`, or `navigator` during module import.
- The iframe owns logical viewport width and height. Apply zoom only to an outer
  presentation wrapper.
- Never inspect cross-origin iframe DOM. Validate message namespace, version,
  origin, and source window before accepting bridge input.
- Keep logical viewport, physical resolution, and pixel ratio as separate facts.
- Use official manufacturer sources for physical display specifications. Document
  Android logical dimensions as selected profiles when scaling can vary.
- Author frames with local React, CSS, or simple SVG geometry. Do not copy device
  artwork, marketing images, or restricted design resources.
- Use semantic HTML, visible focus, native keyboard behavior, and accessible
  names. Axe checks are release gates.
- Product-specific routes, names, tokens, messages, screenshots, fixtures,
  environment variables, and metadata do not belong in this repository.
- Document every public export with TSDoc. Public interfaces and props must
  explain behavior, units, defaults, and constraints that types alone do not
  communicate. `npm run docs:build` treats missing documentation and broken
  links as errors.
- Keep `.augments/`, dependency directories, build output, browser reports, and
  package tarballs uncommitted.
- Do not publish, push, tag, create releases, or open/merge pull requests without
  explicit user authorization.

## Public API

Export public values and types only through `src/index.ts`. Do not expose internal
source paths. The supported package entry points are the package root,
`react-device-lab/styles.css`, and `react-device-lab/package.json`.

## Device catalog workflow

Use `$maintain-device-catalog` whenever preset facts change. Stable ids are
permanent. Unknown facts remain explicit rather than inferred.

## Completion

Completion requires the built npm tarball to install through public exports in a
clean React consumer and in the downstream adapter. Review the packed file list,
both repository diffs, browser geometry around 1440 × 900, and the neutrality
scan before reporting success.
