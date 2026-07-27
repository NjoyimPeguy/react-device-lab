import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  capturePreviewPng,
  PreviewPngExportError,
} from "../../src/index.js";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const SVG_URL_PREFIX = "data:image/svg+xml;charset=utf-8,";

let imageBehavior: "load" | "error";
let imageSources: string[];
let canvases: HTMLCanvasElement[];

class MockImage {
  onload: (() => void) | null = null;

  onerror: (() => void) | null = null;

  set src(value: string) {
    imageSources.push(value);
    queueMicrotask(() => {
      if (imageBehavior === "load") {
        this.onload?.();
      } else {
        this.onerror?.();
      }
    });
  }
}

function mockCanvasToBlob(png: Blob | null): void {
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback: BlobCallback) => {
      callback(png);
    },
  );
}

function mockSuccessfulRasterization(): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (function (this: HTMLCanvasElement, contextId: string) {
      if (contextId !== "2d") return null;
      canvases.push(this);
      return { drawImage: () => undefined };
    }) as typeof HTMLCanvasElement.prototype.getContext,
  );
  mockCanvasToBlob(new Blob([PNG_BYTES], { type: "image/png" }));
}

function stubRect(element: Element, width: number, height: number): void {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    bottom: height,
    height,
    left: 0,
    right: width,
    top: 0,
    toJSON: () => ({}),
    width,
    x: 0,
    y: 0,
  });
}

function buildRoot(): HTMLElement {
  const root = document.createElement("div");
  root.style.backgroundColor = "rgb(10, 20, 30)";
  root.style.width = "300px";
  const child = document.createElement("p");
  child.style.color = "rgb(200, 210, 220)";
  child.textContent = "Preview content";
  root.append(child);
  document.body.append(root);
  return root;
}

function capturedSvg(): string {
  const source = imageSources[0];
  if (!source?.startsWith(SVG_URL_PREFIX)) {
    throw new TypeError("No serialized SVG image was captured.");
  }
  return decodeURIComponent(source.slice(SVG_URL_PREFIX.length));
}

describe("capturePreviewPng", () => {
  beforeEach(() => {
    imageBehavior = "load";
    imageSources = [];
    canvases = [];
    vi.stubGlobal("Image", MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("serializes the subtree into an SVG foreignObject and rasterizes at the device pixel ratio", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    vi.stubGlobal("devicePixelRatio", 2);
    mockSuccessfulRasterization();

    const blob = await capturePreviewPng(root);

    expect(blob.type).toBe("image/png");
    expect(canvases).toHaveLength(1);
    expect(canvases[0]?.width).toBe(600);
    expect(canvases[0]?.height).toBe(400);

    const svg = capturedSvg();
    expect(svg).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"',
    );
    expect(svg).toContain("<foreignObject");
    expect(svg).toContain("Preview content");
    expect(svg).toContain("background-color: rgb(10, 20, 30)");
    expect(svg).toContain("color: rgb(200, 210, 220)");
  });

  it("rounds fractional boxes when computing canvas pixels", async () => {
    const root = buildRoot();
    stubRect(root, 305.5, 199.6);
    vi.stubGlobal("devicePixelRatio", 2);
    mockSuccessfulRasterization();

    await capturePreviewPng(root);

    expect(canvases[0]?.width).toBe(611);
    expect(canvases[0]?.height).toBe(399);
    const svg = capturedSvg();
    expect(svg).toContain('width="305.5" height="199.6"');
  });

  it("embeds same-origin iframe documents recursively", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    const iframe = document.createElement("iframe");
    root.append(iframe);
    const targetDocument = iframe.contentDocument;
    if (!targetDocument) throw new TypeError("Expected a jsdom frame document.");
    targetDocument.body.innerHTML =
      '<main class="application"><h1>Embedded application</h1></main>';
    mockSuccessfulRasterization();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await capturePreviewPng(root);

    const svg = capturedSvg();
    expect(svg).toContain("Embedded application");
    expect(svg).not.toContain("data-rdl-export-placeholder");
    expect(warn).not.toHaveBeenCalled();
  });

  it("renders a neutral placeholder for cross-origin iframes and warns once per capture", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    for (let index = 0; index < 2; index += 1) {
      const iframe = document.createElement("iframe");
      Object.defineProperty(iframe, "contentDocument", {
        configurable: true,
        get() {
          throw new DOMException(
            "Blocked a frame with origin from accessing a cross-origin frame.",
            "SecurityError",
          );
        },
      });
      root.append(iframe);
    }
    mockSuccessfulRasterization();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await capturePreviewPng(root);

    const svg = capturedSvg();
    expect(
      svg.match(/data-rdl-export-placeholder="cross-origin-iframe"/g),
    ).toHaveLength(2);
    expect(svg).toContain(
      "Cross-origin content is not included in PNG exports.",
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("cross-origin");
  });

  it("resolves a named File when a download name is suggested", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    mockSuccessfulRasterization();

    const named = await capturePreviewPng(root, { fileName: "stage" });
    expect(named).toBeInstanceOf(File);
    expect((named as File).name).toBe("stage.png");
    expect(named.type).toBe("image/png");

    const suffixed = await capturePreviewPng(root, { fileName: "shot.png" });
    expect((suffixed as File).name).toBe("shot.png");

    const unnamed = await capturePreviewPng(root);
    expect(unnamed).not.toBeInstanceOf(File);
  });

  it("rejects with a typed error when the root has no rendered box", async () => {
    const root = buildRoot();
    stubRect(root, 0, 0);
    mockSuccessfulRasterization();

    const failure = await capturePreviewPng(root).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(PreviewPngExportError);
    expect((failure as PreviewPngExportError).code).toBe("empty-root");
  });

  it("rejects with a typed error when the host canvas is unavailable", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (() => null) as typeof HTMLCanvasElement.prototype.getContext,
    );
    mockCanvasToBlob(new Blob([PNG_BYTES], { type: "image/png" }));

    const failure = await capturePreviewPng(root).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(PreviewPngExportError);
    expect((failure as PreviewPngExportError).code).toBe("canvas-unavailable");
  });

  it("rejects with a typed error when the serialized image fails to decode", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    imageBehavior = "error";
    mockSuccessfulRasterization();

    const failure = await capturePreviewPng(root).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(PreviewPngExportError);
    expect((failure as PreviewPngExportError).code).toBe(
      "image-decode-failed",
    );
  });

  it("rejects with a typed error when the canvas yields no PNG data", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (function (this: HTMLCanvasElement, contextId: string) {
        if (contextId !== "2d") return null;
        return { drawImage: () => undefined };
      }) as typeof HTMLCanvasElement.prototype.getContext,
    );
    mockCanvasToBlob(null);

    const failure = await capturePreviewPng(root).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(PreviewPngExportError);
    expect((failure as PreviewPngExportError).code).toBe("blob-unavailable");
  });

  it("rejects with a typed error when the host refuses the draw", async () => {
    const root = buildRoot();
    stubRect(root, 300, 200);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (function (this: HTMLCanvasElement, contextId: string) {
        if (contextId !== "2d") return null;
        return {
          drawImage: () => {
            throw new DOMException(
              "The canvas has been tainted by cross-origin data.",
              "SecurityError",
            );
          },
        };
      }) as typeof HTMLCanvasElement.prototype.getContext,
    );
    mockCanvasToBlob(new Blob([PNG_BYTES], { type: "image/png" }));

    const failure = await capturePreviewPng(root).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(PreviewPngExportError);
    expect((failure as PreviewPngExportError).code).toBe(
      "rasterization-failed",
    );
  });

  it("rejects with a typed error outside a browser document", async () => {
    const root = buildRoot();
    vi.stubGlobal("window", undefined);

    const failure = await capturePreviewPng(root).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(PreviewPngExportError);
    expect((failure as PreviewPngExportError).code).toBe(
      "unsupported-environment",
    );
  });
});
