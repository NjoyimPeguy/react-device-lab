# Accessibility

The complete lab uses one named `main` landmark, a named preview region, and a
named complementary configuration panel. Controls use native buttons, inputs,
selects, radio groups, fieldsets, labels, and visible `:focus-visible`
treatment.

## Keyboard behavior

- Tab reaches every interactive control in document order.
- Native select typing and arrow-key behavior choose devices and destinations.
- Enter or Space operates buttons and checkboxes.
- Viewport-source radios use native arrow-key group behavior.
- The preview stage and configuration panel scroll independently.

The package does not trap focus. An embedded iframe is its own focus context, so
keyboard testing must include entering and leaving the target document.

## Accessible consumer content

Device frames are decorative and hidden from accessibility APIs. `contentLabel`
or the generated device title names the viewport. Consumers remain responsible
for the semantics and contrast of their embedded application, custom title,
badge, notice, and frame wrappers.

Safe-area, permission, screen-reader, and bold-text scenarios are test signals;
they do not replace assistive technology. Run real screen-reader tests in the
target application and verify keyboard behavior in every supported browser.

The repository runs axe against light, dark, desktop, and narrow workspaces and
keeps browser-rendered keyboard/focus regressions. Axe passing is a useful
baseline, not proof that an experience is accessible.
