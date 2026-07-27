import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEVICE_PRESETS,
  createPreviewEnvironment,
  PreviewConfigurationPanel,
  type DevicePreset,
} from "../../src/index.js";
import {
  capturePreviewPng,
  PreviewPngExportError,
} from "../../src/preview/exportImage.js";

vi.mock("../../src/preview/exportImage.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/preview/exportImage.js")>();
  return { ...actual, capturePreviewPng: vi.fn() };
});

const mockedCapture = vi.mocked(capturePreviewPng);

let createObjectURL: ReturnType<typeof vi.fn>;
let anchorClick: ReturnType<typeof vi.spyOn>;

function preset(id: string): DevicePreset {
  const device = DEVICE_PRESETS.find((candidate) => candidate.id === id);
  if (!device) throw new TypeError(`Missing preset: ${id}`);
  return device;
}

function buildStage(): { stage: HTMLElement; exportRoot: HTMLElement } {
  const stage = document.createElement("section");
  const exportRoot = document.createElement("div");
  exportRoot.setAttribute("data-rdl-export-root", "");
  stage.append(exportRoot);
  document.body.append(stage);
  return { exportRoot, stage };
}

function renderPanel(previewRoot?: HTMLElement | null): void {
  render(
    <PreviewConfigurationPanel
      customViewport={{ width: 412, height: 915 }}
      device={preset("pixel-10")}
      devices={DEVICE_PRESETS}
      environment={createPreviewEnvironment()}
      frameVisible
      onCustomViewportChange={() => undefined}
      onDeviceChange={() => undefined}
      onEnvironmentChange={() => undefined}
      onFrameVisibleChange={() => undefined}
      onOrientationChange={() => undefined}
      onShowRulersChange={() => undefined}
      onShowSafeAreaChange={() => undefined}
      onThemeChange={() => undefined}
      onViewportModeChange={() => undefined}
      onZoomChange={() => undefined}
      orientation="portrait"
      {...(previewRoot !== undefined ? { previewRoot } : {})}
      showRulers={false}
      showSafeArea={false}
      theme="light"
      viewportMode="device"
      zoom="fit"
    />,
  );
}

describe("PreviewConfigurationPanel PNG export", () => {
  beforeEach(() => {
    mockedCapture.mockReset();
    createObjectURL = vi.fn(() => "blob:rdl-panel-test");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
  });

  it("hides the export action without a preview root", () => {
    renderPanel();
    expect(
      screen.queryByRole("button", { name: "Export PNG" }),
    ).not.toBeInTheDocument();
  });

  it("disables the action with a tooltip when no export root is rendered", () => {
    const stage = document.createElement("section");
    document.body.append(stage);
    renderPanel(stage);

    const button = screen.getByRole("button", { name: "Export PNG" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "PNG export needs a rendered preview stage.",
    );
    expect(mockedCapture).not.toHaveBeenCalled();
  });

  it("captures the composed export root and downloads the Blob", async () => {
    const user = userEvent.setup();
    const { stage, exportRoot } = buildStage();
    const png = new File([new Uint8Array([0x89, 0x50])], "device-preview.png", {
      type: "image/png",
    });
    mockedCapture.mockResolvedValue(png);
    renderPanel(stage);

    const button = screen.getByRole("button", { name: "Export PNG" });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute(
      "title",
      "Download a PNG snapshot of the current preview.",
    );
    await user.click(button);

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledWith(png);
    });
    expect(mockedCapture).toHaveBeenCalledWith(exportRoot, {
      fileName: "device-preview-pixel-10-portrait.png",
    });
    expect(anchorClick).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Export PNG" }),
      ).toBeEnabled();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("surfaces a typed export failure as inline text", async () => {
    const user = userEvent.setup();
    const { stage } = buildStage();
    mockedCapture.mockRejectedValue(
      new PreviewPngExportError(
        "canvas-unavailable",
        "The host could not provide a 2D canvas context for PNG rasterization.",
      ),
    );
    renderPanel(stage);

    await user.click(screen.getByRole("button", { name: "Export PNG" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "The host could not provide a 2D canvas context for PNG rasterization.",
    );
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Export PNG" }),
    ).toBeEnabled();
  });

  it("surfaces unexpected failures with a generic message", async () => {
    const user = userEvent.setup();
    const { stage } = buildStage();
    mockedCapture.mockRejectedValue(new TypeError("boom"));
    renderPanel(stage);

    await user.click(screen.getByRole("button", { name: "Export PNG" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("PNG export failed unexpectedly.");
  });
});
