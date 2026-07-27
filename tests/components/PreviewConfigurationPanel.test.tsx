import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DEVICE_PRESETS,
  PreviewConfigurationPanel,
  createPreviewEnvironment,
  type DevicePreset,
  type PreviewEnvironment,
} from "../../src/index.js";

function preset(id: string): DevicePreset {
  const device = DEVICE_PRESETS.find((candidate) => candidate.id === id);
  if (!device) throw new TypeError(`Missing preset: ${id}`);
  return device;
}

describe("PreviewConfigurationPanel", () => {
  it("exposes orientation, zoom, frame, safe-area, and theme controls", async () => {
    const user = userEvent.setup();
    const onOrientationChange = vi.fn();
    const onZoomChange = vi.fn();
    const onFrameVisibleChange = vi.fn();
    const onShowSafeAreaChange = vi.fn();
    const onShowRulersChange = vi.fn();
    const onThemeChange = vi.fn();

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
        onFrameVisibleChange={onFrameVisibleChange}
        onOrientationChange={onOrientationChange}
        onShowRulersChange={onShowRulersChange}
        onShowSafeAreaChange={onShowSafeAreaChange}
        onThemeChange={onThemeChange}
        onViewportModeChange={() => undefined}
        onZoomChange={onZoomChange}
        orientation="portrait"
        showRulers={false}
        showSafeArea={false}
        theme="light"
        viewportMode="device"
        zoom="fit"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rotate viewport" }));
    await user.click(screen.getByRole("button", { name: "75%" }));
    await user.click(screen.getByLabelText("Show device frame"));
    await user.click(screen.getByLabelText("Show safe areas"));
    await user.click(screen.getByLabelText("Show rulers"));
    await user.selectOptions(screen.getByLabelText("Package theme"), "dark");

    expect(onOrientationChange).toHaveBeenCalledWith("landscape");
    expect(onZoomChange).toHaveBeenCalledWith(0.75);
    expect(onFrameVisibleChange).toHaveBeenCalledWith(false);
    expect(onShowSafeAreaChange).toHaveBeenCalledWith(true);
    expect(onShowRulersChange).toHaveBeenCalledWith(true);
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("supports freeform viewports and integrated environment scenarios", async () => {
    const user = userEvent.setup();
    const onViewportModeChange = vi.fn();
    const onCustomViewportChange = vi.fn();
    const environments: PreviewEnvironment[] = [];
    const onEnvironmentChange = (environment: PreviewEnvironment) => {
      environments.push(environment);
    };

    render(
      <PreviewConfigurationPanel
        customViewport={{ width: 412, height: 915 }}
        device={preset("pixel-10")}
        devices={DEVICE_PRESETS}
        environment={createPreviewEnvironment({
          permissions: { camera: "prompt" },
        })}
        frameVisible
        onCustomViewportChange={onCustomViewportChange}
        onDeviceChange={() => undefined}
        onEnvironmentChange={onEnvironmentChange}
        onFrameVisibleChange={() => undefined}
        onOrientationChange={() => undefined}
        onShowRulersChange={() => undefined}
        onShowSafeAreaChange={() => undefined}
        onThemeChange={() => undefined}
        onViewportModeChange={onViewportModeChange}
        onZoomChange={() => undefined}
        orientation="portrait"
        showRulers={false}
        showSafeArea={false}
        theme="light"
        viewportMode="custom"
        zoom="fit"
      />,
    );

    await user.click(screen.getByLabelText("Named device"));
    expect(onViewportModeChange).toHaveBeenCalledWith("device");

    const width = screen.getByLabelText("Custom viewport width");
    fireEvent.change(width, { target: { value: "640" } });
    expect(onCustomViewportChange).toHaveBeenLastCalledWith({
      width: 640,
      height: 915,
    });

    await user.click(screen.getByText("Environment scenarios"));
    await user.click(screen.getByLabelText("Show virtual keyboard"));
    expect(
      environments.some(
        (environment) => environment.virtualKeyboard.visible,
      ),
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Safe area top"), {
      target: { value: "48" },
    });
    await user.click(screen.getByLabelText("Screen-reader scenario"));
    await user.selectOptions(
      screen.getByLabelText("Contrast preference"),
      "more",
    );
    await user.selectOptions(
      screen.getByLabelText("Camera permission scenario"),
      "denied",
    );
    expect(
      environments.some(
        (environment) => environment.safeArea.top === 48,
      ),
    ).toBe(true);
    expect(
      environments.some(
        (environment) => environment.accessibility.screenReader,
      ),
    ).toBe(true);
    expect(
      environments.some(
        (environment) => environment.contrast === "more",
      ),
    ).toBe(true);
    expect(
      environments.some(
        (environment) => environment.permissions["camera"] === "denied",
      ),
    ).toBe(true);
  });

  it("ignores transient invalid locale and text-scale input without throwing", async () => {
    const user = userEvent.setup();
    const onEnvironmentChange = vi.fn();
    render(
      <PreviewConfigurationPanel
        customViewport={{ width: 412, height: 915 }}
        device={preset("pixel-10")}
        devices={DEVICE_PRESETS}
        environment={createPreviewEnvironment()}
        frameVisible
        onCustomViewportChange={() => undefined}
        onDeviceChange={() => undefined}
        onEnvironmentChange={onEnvironmentChange}
        onFrameVisibleChange={() => undefined}
        onOrientationChange={() => undefined}
        onShowRulersChange={() => undefined}
        onShowSafeAreaChange={() => undefined}
        onThemeChange={() => undefined}
        onViewportModeChange={() => undefined}
        onZoomChange={() => undefined}
        orientation="portrait"
        showRulers={false}
        showSafeArea={false}
        theme="light"
        viewportMode="device"
        zoom="fit"
      />,
    );

    await user.click(screen.getByText("Environment scenarios"));
    expect(() =>
      fireEvent.change(screen.getByLabelText("Locale"), {
        target: { value: "" },
      }),
    ).not.toThrow();
    expect(() =>
      fireEvent.change(screen.getByLabelText("Locale"), {
        target: { value: "en_US" },
      }),
    ).not.toThrow();
    expect(() =>
      fireEvent.change(screen.getByLabelText("Text scale"), {
        target: { value: "" },
      }),
    ).not.toThrow();
    expect(() =>
      fireEvent.change(screen.getByLabelText("Text scale"), {
        target: { value: "4" },
      }),
    ).not.toThrow();

    expect(onEnvironmentChange).not.toHaveBeenCalled();
  });
});
