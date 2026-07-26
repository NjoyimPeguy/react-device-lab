# Theming

Import `react-device-lab/styles.css` once. Set `theme="light"` or `theme="dark"`
on `DevicePreviewLab`; lower-level compositions can set `data-rdl-theme` on an
ancestor.

Override variables on a scoped wrapper so unrelated application UI is not
affected:

```css
.preview-host {
  --rdl-accent: #6d4aff;
  --rdl-accent-contrast: #ffffff;
  --rdl-canvas: #f7f5fb;
  --rdl-surface: #ffffff;
  --rdl-surface-raised: #faf9fd;
  --rdl-border: #ddd8e8;
  --rdl-text: #211d2b;
  --rdl-text-muted: #6f687d;
  --rdl-focus: #5635e7;
  --rdl-danger: #bd3348;
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

`fullscreen` uses `100dvh` and suppresses document-level workspace overflow.
`bounded` fills its containing block and requires the parent to provide a useful
height.
