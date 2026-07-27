# Device data and provenance

The catalog separates three values that are often incorrectly collapsed:

- `logicalViewport` is the CSS viewport presented to the application.
- `physicalResolution` is the panel's manufacturer-documented pixel grid, when
  a specific panel is represented.
- `devicePixelRatio` is the selected browser profile's ratio. It is metadata,
  not a formula used to manufacture missing physical values.

`getPhysicalResolution` never derives a panel resolution. It returns documented
data or `null`.

## Logical viewport policy

Apple mobile presets use CSS point profiles and retain the matching panel scale.
Android presets use a reproducible, package-selected browser profile. Each
`logicalViewport.androidProfile` records the chosen density in DPI, the default
display-size setting, and that browser chrome is excluded. The density scale
uses Android's documented 160 DPI baseline. A preset's CSS dimensions remain a
testing profile: users, vendors, system bars, and browser UI can change the
available viewport on physical hardware. Desktop presets are named responsive
test profiles; operating-system scaling and browser chrome can produce other
CSS viewport sizes on the same panel.

One documented exception: the iPhone 17e 390 × 844 CSS point profile is
inferred from the identical iPhone 14/16e panel and notch, because Apple's HIG
layout table has no iPhone 17e row yet. The preset's logical source note states
this inference explicitly.

Phones, foldables, and tablets are stored in their natural portrait or unfolded
configuration; laptops and displays are stored in their natural landscape
configuration. One foldable panel is landscape-native: the wide Galaxy Z Fold 8
unfolded display is stored landscape-first (logical 1088 × 821, physical
2448 × 1848), matching Samsung's own landscape-first listing. Orientation
helpers normalize the short and long edges for the requested portrait or
landscape orientation without replacing or mutating the selected preset.

## Physical source policy

Physical resolutions come from official manufacturer specification pages. The
source URL and a concise note live beside every known resolution. The current
catalog primarily references:

- [Apple archived model specifications](https://support.apple.com/docs/iphone)
- [Apple iPhone 17 specifications](https://www.apple.com/iphone-17/specs/)
- [Apple iPhone Air specifications](https://www.apple.com/iphone-air/specs/)
- [Apple iPhone 17 Pro specifications](https://www.apple.com/iphone-17-pro/specs/)
- [Apple iPad (10th generation) specifications](https://support.apple.com/en-us/111840)
- [Apple iPad (A16) specifications](https://www.apple.com/ipad-11/specs/)
- [Apple iPad mini specifications](https://www.apple.com/ipad-mini/specs/)
- [Samsung mobile specifications](https://www.samsung.com/us/smartphones/)
- [Samsung Mobile Press media assets and launch articles](https://www.samsungmobilepress.com/)
- [Google Store device specifications](https://store.google.com/category/phones)
- [Google Pixel phone hardware technical specifications](https://support.google.com/pixelphone/answer/7158570)
- [Archived Google Pixel Tablet specifications](https://web.archive.org/web/2024/https://store.google.com/product/pixel_tablet_specs)
- [Microsoft Surface specifications](https://www.microsoft.com/surface)

Generic laptop, desktop, and ultrawide entries are responsive test profiles, not
claims about a particular manufacturer's hardware. Their physical resolution is
`null`.

## Updating a preset

Keep preset IDs stable. Update a display name only when the represented product
name changes, and never reuse an ID for another panel or fold state.

For each change:

1. Confirm physical pixels on an official manufacturer page.
2. Confirm the logical viewport independently.
3. Record the chosen Android display-size, density-DPI, and browser-chrome
   selection explicitly.
4. Keep cover and unfolded foldable configurations paired.
5. Add or update catalog invariant tests.
6. Run `npm test -- --run tests/catalog` and `npm run neutrality:check`.

Sources should be reviewed at least once per release that changes the catalog.
If a source disappears, prefer a current official archive; do not silently
replace it with a retailer, an inferred value, or a community database. The
Pixel Tablet preset follows this rule today: its source is an archived copy of
Google's delisted official specification page, and the source note says so.
