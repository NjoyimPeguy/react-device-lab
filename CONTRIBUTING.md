# Contributing

Thank you for improving React Device Lab.

## Development

Use Node 22.14.0+ and npm 11.5.1+. Fork the repository, create a focused branch,
and install the exact lockfile:

```bash
npm ci
npx playwright install chromium webkit
```

During development, run the smallest relevant test first. Before requesting
review:

```bash
npm run neutrality:check
npm run lint
npm run typecheck
npm test
npm run build
npm run demo:build
npm run docs:check
npm run test:browser
npm run test:a11y
npm run pack:check
git diff --check
```

## Change expectations

- Add a failing regression before behavioral implementation.
- Keep imports SSR-safe and preserve exact iframe viewport dimensions.
- Add public exports only through `src/index.ts`.
- Keep React and React DOM as peers; justify any runtime dependency.
- Use semantic HTML, visible focus, and browser-rendered accessibility tests.
- Preserve unrelated work and keep generated dependency/build directories out
  of commits.

## Device data

Read [device-data.md](docs/device-data.md) and use the repository’s
`maintain-device-catalog` skill before editing presets. Physical resolution
requires an official manufacturer source. Android logical viewports require an
explicit selected density/default-display-size profile. Keep stable IDs and add
catalog invariants.

## Device skins and screenshots

Do not contribute manufacturer artwork, traced vectors, marketing images,
restricted design resources, or third-party screenshots. Build geometry with
repository-authored React and CSS. Add feature assertions and update only the
affected Chromium visual baselines after full-resolution inspection. See
[device-frames.md](docs/device-frames.md).

## Documentation and commits

Document public behavior and limitations with the change. Use focused commits
with an imperative summary. By contributing, you agree that your contribution
is licensed under the repository’s [MIT license](LICENSE).

For security-sensitive findings, follow [SECURITY.md](SECURITY.md) instead of
opening a public issue.
