# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-07-27

### Added

- Platform-split device grouping in the selector.
- Fourteen device presets — iPhone 17e, Pixel 10a, Pixel 10 Pro Fold, Galaxy
  A56/A57, Galaxy Z Flip8/Z Fold8/Z Fold8 Ultra, and Galaxy Tab S11 — plus an
  ultrawide-qhd desktop profile.
- Opt-in shareable configuration URLs via query-parameter synchronization.
- Keyboard shortcuts for rotate, device cycling, zoom, and frame toggle.
- Rulers and a measurement overlay on the preview stage.
- WYSIWYG PNG export of the composed preview.
- Canonical `showFrame`/`defaultShowFrame` frame-visibility props.

### Changed

- Frame geometry recalibrated for all presets against official proportions.
- Device-data provenance URLs refreshed against live official sources.
- Behavior-affecting logical viewport corrections for galaxy-s9-plus and
  galaxy-a55 density profiles; physical panels unchanged.
- Visual baselines are now generated in the pinned CI Playwright container via
  the dispatchable Update visual baselines workflow; local `test:browser` runs
  on other hosts may differ and are not release evidence.

### Deprecated

- `frameVisible`/`defaultFrameVisible` aliases in favor of `showFrame` and
  `defaultShowFrame`.

## [1.0.0] - 2026-07-26

### Added

- Exact iframe and portal preview engine with secure route/configuration bridge.
- Seventy-one named device profiles with independent physical and logical data.
- Repository-authored phone, foldable, tablet, laptop, monitor, and ultrawide
  skins.
- Responsive lab workspace, custom viewport controls, themes, safe-area and
  environment scenarios, accessible navigation, and visual regression suite.
- TypeDoc reference site generated from validated TSDoc comments and the
  existing public guides.
- Generic demo, public documentation, agent harness, and packed-consumer
  verification.

[Unreleased]: https://github.com/NjoyimPeguy/react-device-lab/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/NjoyimPeguy/react-device-lab/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/NjoyimPeguy/react-device-lab/releases/tag/v1.0.0
