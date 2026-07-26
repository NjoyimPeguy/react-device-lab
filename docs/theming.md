# Theming

Import `react-device-lab/styles.css` once. Set `theme="light"` or `theme="dark"`
on `DevicePreviewLab`; lower-level compositions can set `data-rdl-theme` on an
ancestor.

Override variables on a scoped wrapper so unrelated application UI is not
affected:

```css
.preview-host {
  --rdl-accent: #6d4aff;
  --rdl-accent-text: #5635e7;
  --rdl-accent-contrast: #ffffff;
  --rdl-canvas: #f7f5fb;
  --rdl-stage: #f1eef8;
  --rdl-surface: #ffffff;
  --rdl-surface-raised: #faf9fd;
  --rdl-border: #ddd8e8;
  --rdl-text: #211d2b;
  --rdl-text-muted: #6f687d;
  --rdl-focus: #5635e7;
  --rdl-danger: #bd3348;
  --rdl-frame-outline: rgb(33 29 43 / 20%);
  --rdl-frame-shadow-color: rgb(33 29 43 / 32%);
  --rdl-radius-sm: 0.5rem;
  --rdl-radius-md: 0.75rem;
  --rdl-radius-lg: 1rem;
  --rdl-font-family: ui-sans-serif, system-ui, sans-serif;
}
```

```tsx
<div className="preview-host">
  <DevicePreviewLab src="http://localhost:3000" workspaceMode="bounded" />
</div>
```

Keep focus contrast and target sizes intact when customizing. Package variables
style the workspace and authored shell; they do not inject a product theme into
a cross-origin target. Use the environment color-scheme scenario or the target’s
own theme API for application content.

Use `--rdl-accent` for filled controls and strong decorative marks. Set
`--rdl-accent-text` separately for small text on package surfaces; it must retain
at least 4.5:1 contrast in both themes. `--rdl-text-muted` is also used for small
metadata, so test it against both `--rdl-surface` and
`--rdl-surface-raised`.

`--rdl-stage`, `--rdl-frame-outline`, and `--rdl-frame-shadow-color` work
together to preserve the device silhouette. Keep the stage visibly separate
from both the frame edge and configuration surface in each theme. A dark theme
normally needs a lighter stage and outline than its surrounding canvas; this is
the luminance counterpart of a dark frame on the light default stage.

`fullscreen` uses `100dvh` and suppresses document-level workspace overflow.
`bounded` fills its containing block and requires the parent to provide a useful
height.
