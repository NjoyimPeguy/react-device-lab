const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const CROSS_ORIGIN_WARNING =
  "[react-device-lab] capturePreviewPng: a cross-origin iframe cannot be " +
  "serialized, so the export renders a neutral placeholder in its place.";
const PLACEHOLDER_KIND = "cross-origin-iframe";
const PLACEHOLDER_TEXT =
  "Cross-origin content is not included in PNG exports.";

/** Machine-readable failure reasons reported by {@link PreviewPngExportError}. */
export type PreviewPngExportErrorCode =
  | "blob-unavailable"
  | "canvas-unavailable"
  | "empty-root"
  | "image-decode-failed"
  | "rasterization-failed"
  | "unsupported-environment";

/**
 * Typed rejection produced by {@link capturePreviewPng}.
 *
 * The `code` property distinguishes host failures (no canvas, undecodable
 * serialized image, missing PNG encoder) from caller mistakes (a root without
 * a rendered box) so interfaces can surface actionable inline feedback.
 */
export class PreviewPngExportError extends Error {
  /** Machine-readable failure reason. */
  readonly code: PreviewPngExportErrorCode;

  /**
   * Creates a typed PNG-export failure.
   *
   * @param code - Machine-readable failure reason.
   * @param message - Human-readable failure description.
   * @param options - Optional underlying host error kept as `cause`.
   */
  constructor(
    code: PreviewPngExportErrorCode,
    message: string,
    options?: { readonly cause?: unknown },
  ) {
    super(message);
    this.name = "PreviewPngExportError";
    this.code = code;
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

/** Optional behavior for {@link capturePreviewPng}. */
export interface PreviewPngExportOptions {
  /**
   * Suggested download file name. When present, the promise resolves with a
   * `File` (a `Blob` subtype) carrying this name so download and upload flows
   * keep it; a missing `.png` suffix is appended. The function never triggers
   * a download itself.
   */
  readonly fileName?: string;
}

interface SerializationState {
  warnedCrossOrigin: boolean;
}

function copyComputedStyles(
  source: Element,
  target: Element,
  view: Window,
): void {
  const computed = view.getComputedStyle(source);
  const style = (target as HTMLElement).style;
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    if (!property) continue;
    style.setProperty(
      property,
      computed.getPropertyValue(property),
      computed.getPropertyPriority(property),
    );
  }
}

function copyAttributes(source: Element, target: Element): void {
  for (const attribute of Array.from(source.attributes)) {
    if (attribute.name === "style" || attribute.name === "srcdoc") continue;
    target.setAttribute(attribute.name, attribute.value);
  }
}

function createCrossOriginPlaceholder(
  iframe: HTMLIFrameElement,
  view: Window,
  hostDocument: Document,
  state: SerializationState,
): Element {
  if (!state.warnedCrossOrigin) {
    state.warnedCrossOrigin = true;
    console.warn(CROSS_ORIGIN_WARNING);
  }
  const placeholder = hostDocument.createElement("div");
  placeholder.setAttribute("data-rdl-export-placeholder", PLACEHOLDER_KIND);
  copyComputedStyles(iframe, placeholder, view);
  const style = placeholder.style;
  style.setProperty("align-items", "center");
  style.setProperty("background", "#202124");
  style.setProperty("box-sizing", "border-box");
  style.setProperty("color", "#e8eaed");
  style.setProperty("display", "flex");
  style.setProperty(
    "font",
    "500 12px/1.5 ui-sans-serif, system-ui, sans-serif",
  );
  style.setProperty("justify-content", "center");
  style.setProperty("padding", "12px");
  style.setProperty("text-align", "center");
  placeholder.textContent = PLACEHOLDER_TEXT;
  return placeholder;
}

function serializeIframe(
  iframe: HTMLIFrameElement,
  view: Window,
  hostDocument: Document,
  state: SerializationState,
): Element {
  let targetDocument: Document | null;
  try {
    targetDocument = iframe.contentDocument;
  } catch {
    targetDocument = null;
  }
  const targetBody = targetDocument?.body ?? null;
  if (!targetDocument || !targetBody) {
    return createCrossOriginPlaceholder(iframe, view, hostDocument, state);
  }

  const innerView = targetDocument.defaultView ?? view;
  const wrapper = hostDocument.createElement("div");
  copyComputedStyles(iframe, wrapper, view);
  const frameRoot = targetDocument.documentElement;
  if (frameRoot) {
    const frameBackground =
      innerView.getComputedStyle(frameRoot).backgroundColor;
    if (
      frameBackground &&
      frameBackground !== "transparent" &&
      frameBackground !== "rgba(0, 0, 0, 0)"
    ) {
      wrapper.style.setProperty("background", frameBackground);
    }
  }
  wrapper.style.setProperty("overflow", "hidden");
  const bodyClone = serializeElement(
    targetBody,
    innerView,
    hostDocument,
    state,
    "div",
  );
  if (bodyClone) wrapper.append(bodyClone);
  return wrapper;
}

function serializeElement(
  element: Element,
  view: Window,
  hostDocument: Document,
  state: SerializationState,
  asTag?: string,
): Element | null {
  const namespace = element.namespaceURI ?? XHTML_NAMESPACE;
  const tag = element.localName;
  if (
    namespace === XHTML_NAMESPACE &&
    (tag === "script" || tag === "style" || tag === "link" || tag === "noscript")
  ) {
    return null;
  }
  if (namespace === XHTML_NAMESPACE && tag === "iframe") {
    return serializeIframe(
      element as HTMLIFrameElement,
      view,
      hostDocument,
      state,
    );
  }
  const clone = hostDocument.createElementNS(namespace, asTag ?? tag);
  copyAttributes(element, clone);
  copyComputedStyles(element, clone, view);
  for (const child of Array.from(element.childNodes)) {
    const serialized = serializeNode(child, view, hostDocument, state);
    if (serialized) clone.append(serialized);
  }
  return clone;
}

function serializeNode(
  node: Node,
  view: Window,
  hostDocument: Document,
  state: SerializationState,
): Node | null {
  if (node.nodeType === 3) {
    return hostDocument.createTextNode(node.textContent ?? "");
  }
  if (node.nodeType !== 1) return null;
  return serializeElement(node as Element, view, hostDocument, state);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new PreviewPngExportError(
          "image-decode-failed",
          "The serialized preview image could not be decoded.",
        ),
      );
    image.src = url;
  });
}

async function rasterize(
  markup: string,
  width: number,
  height: number,
  pixelRatio: number,
): Promise<Blob> {
  // Chromium and WebKit taint canvases drawn from blob: URL SVG images that
  // contain a foreignObject; a data: URL stays origin-clean in both engines.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new PreviewPngExportError(
      "canvas-unavailable",
      "The host could not provide a 2D canvas context for PNG rasterization.",
    );
  }
  try {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } catch (error) {
    throw new PreviewPngExportError(
      "rasterization-failed",
      "The serialized preview could not be drawn to the canvas.",
      { cause: error },
    );
  }
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    try {
      canvas.toBlob(resolve, "image/png");
    } catch (error) {
      reject(
        new PreviewPngExportError(
          "rasterization-failed",
          "The host refused to encode the drawn preview.",
          { cause: error },
        ),
      );
    }
  });
  if (!blob) {
    throw new PreviewPngExportError(
      "blob-unavailable",
      "The host canvas produced no PNG data.",
    );
  }
  return blob;
}

function normalizeFileName(fileName: string | undefined): string | null {
  if (fileName === undefined) return null;
  const trimmed = fileName.trim();
  if (!trimmed) return null;
  return /\.png$/iu.test(trimmed) ? trimmed : `${trimmed}.png`;
}

/**
 * Captures a WYSIWYG PNG snapshot of a rendered preview subtree.
 *
 * The subtree is serialized into an SVG `foreignObject` with computed styles
 * inlined on every element, then rasterized through an offscreen canvas at the
 * host's `devicePixelRatio`. Orientation, frame visibility, zoom, rulers, and
 * safe-area overlays appear exactly as displayed because the current DOM box
 * is what gets serialized.
 *
 * Same-origin iframe documents (including portal-mode content, which lives in
 * the same document realm) are serialized recursively. Cross-origin iframe
 * pixels are unreachable by design: the export renders a neutral placeholder
 * block in that region and emits a single console warning per capture. The
 * function never attempts to read a cross-origin frame.
 *
 * The promise resolves with the PNG `Blob` only — no download is triggered.
 * Pass `options.fileName` to receive a named `File` instead.
 *
 * @param root - Rendered element to snapshot, typically the composed preview
 * scale box.
 * @param options - Optional suggested download file name.
 * @returns The PNG snapshot, or a named `File` when `fileName` is supplied.
 * @throws {@link PreviewPngExportError} With `code` `"unsupported-environment"`
 * outside a browser document, `"empty-root"` when the root has no rendered
 * box, `"canvas-unavailable"` when no 2D context exists,
 * `"image-decode-failed"` when the serialized SVG cannot be decoded,
 * `"rasterization-failed"` when the host refuses the draw or encode (for
 * example a tainted canvas), or `"blob-unavailable"` when the encoder yields
 * no data.
 *
 * @example
 * ```ts
 * const blob = await capturePreviewPng(
 *   document.querySelector("[data-rdl-export-root]")!,
 *   { fileName: "checkout-preview" },
 * );
 * ```
 */
export async function capturePreviewPng(
  root: HTMLElement,
  options: PreviewPngExportOptions = {},
): Promise<Blob> {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof XMLSerializer === "undefined"
  ) {
    throw new PreviewPngExportError(
      "unsupported-environment",
      "capturePreviewPng requires a browser document.",
    );
  }
  const bounds = root.getBoundingClientRect();
  if (!(bounds.width > 0) || !(bounds.height > 0)) {
    throw new PreviewPngExportError(
      "empty-root",
      "The preview root has no rendered box to export.",
    );
  }
  const ownerDocument = root.ownerDocument ?? document;
  const view = ownerDocument.defaultView ?? window;
  const state: SerializationState = { warnedCrossOrigin: false };
  const clone = serializeElement(root, view, ownerDocument, state);
  if (!clone) {
    throw new PreviewPngExportError(
      "empty-root",
      "The preview root has no rendered box to export.",
    );
  }
  (clone as HTMLElement).style.setProperty("margin", "0");
  const serialized = new XMLSerializer().serializeToString(clone);
  const markup =
    `<svg xmlns="${SVG_NAMESPACE}" width="${bounds.width}" ` +
    `height="${bounds.height}" viewBox="0 0 ${bounds.width} ` +
    `${bounds.height}"><foreignObject x="0" y="0" width="100%" ` +
    `height="100%">${serialized}</foreignObject></svg>`;
  const pixelRatio =
    Number.isFinite(view.devicePixelRatio) && view.devicePixelRatio > 0
      ? view.devicePixelRatio
      : 1;
  const blob = await rasterize(markup, bounds.width, bounds.height, pixelRatio);
  const fileName = normalizeFileName(options.fileName);
  if (fileName === null) return blob;
  return new File([blob], fileName, { type: blob.type || "image/png" });
}
