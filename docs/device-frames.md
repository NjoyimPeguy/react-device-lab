# Device frames and visual fidelity

The package ships independent CSS and React representations of device
silhouettes. It does not bundle manufacturer artwork, image masks, design
resources, screenshots, or traced vectors.

Frame geometry is calibrated from public physical dimensions, panel aspect
ratios, manufacturer specification pages, and visual inspection of publicly
available product images. Those images are reference evidence only. The
implementation is authored as gradients, borders, radii, shadows, and small DOM
primitives in this repository.

The result is intended to make responsive reviews recognizable and consistent.
It is not manufacturer-approved industrial-design documentation, and it should
not be used for mechanical measurements, case design, or marketing renders.

## Model-aware geometry

Every preset resolves to an authored geometry profile. The profile controls:

- bezel insets and screen clipping;
- outer and inner corner radii;
- cutout dimensions and placement;
- side, action, volume, power, and camera-control buttons;
- fold direction and crease placement;
- laptop base and camera-notch treatment;
- monitor chin, camera, stand, and ultrawide proportions.

Materially different devices receive explicit overrides. Examples include thin
phone edges, squared flagship corners, compact notches, clamshell cover-camera
pairs, unfolded hinges, tablet notches, and laptop bases. Orientation rotates
mobile and tablet bezel geometry while retaining the selected preset.

`getDeviceFrameDimensions` returns the total authored silhouette size used by
Fit mode. Hiding the frame returns the unchanged logical viewport dimensions.
The frame never changes the target application's media-query width or height.

## Visual regression policy

The browser suite stores generic Chromium baselines for representative
traditional-notch, island, punch-hole, clamshell cover, unfolded foldable,
tablet-notch, laptop, monitor, and ultrawide profiles. The neutral sample
application is repository-authored and contains no third-party screenshots.

When frame geometry changes:

1. confirm the relevant manufacturer dimensions and current product imagery;
2. update feature-level component assertions;
3. regenerate only the affected baseline;
4. inspect the full-resolution image, including cutout clearance and controls;
5. record any deliberate approximation in the change description.

Visual baselines are review evidence, not a source from which geometry should be
reverse-engineered.
