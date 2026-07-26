import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DEVICE_PRESETS,
  DevicePreviewLab,
} from "../../src/index.js";

describe("DevicePreviewLab", () => {
  it("renders a zero-configuration named-device workspace", () => {
    render(<DevicePreviewLab src="https://app.example.test/" />);

    expect(
      screen.getByRole("main", { name: "Device preview lab" }),
    ).toBeVisible();
    expect(
      screen.getByRole("complementary", { name: "Preview configuration" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Device")).toHaveValue(
      DEVICE_PRESETS[0]?.id,
    );
    expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("supports controlled device and orientation state", async () => {
    const user = userEvent.setup();
    const onDeviceChange = vi.fn();
    const onOrientationChange = vi.fn();
    render(
      <DevicePreviewLab
        deviceId="iphone-16-pro-max"
        onDeviceChange={onDeviceChange}
        onOrientationChange={onOrientationChange}
        orientation="portrait"
        src="https://app.example.test/"
      />,
    );

    await user.selectOptions(screen.getByLabelText("Device"), "pixel-10");
    await user.click(screen.getByRole("button", { name: "Rotate viewport" }));

    expect(onDeviceChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pixel-10" }),
    );
    expect(onOrientationChange).toHaveBeenCalledWith("landscape");
    expect(
      screen
        .getByTitle("iPhone 16 Pro Max application preview")
        .closest("[data-rdl-viewport-width]"),
    ).toHaveAttribute("data-rdl-viewport-width", "440");
  });

  it("does not mutate an uncontrolled environment for a rejected controlled device change", async () => {
    const user = userEvent.setup();
    const onEnvironmentChange = vi.fn();
    render(
      <DevicePreviewLab
        deviceId="iphone-16-pro-max"
        onDeviceChange={() => undefined}
        onEnvironmentChange={onEnvironmentChange}
        src="https://app.example.test/"
      />,
    );

    await user.selectOptions(screen.getByLabelText("Device"), "pixel-10");

    expect(onEnvironmentChange).not.toHaveBeenCalled();
    expect(
      screen
        .getByTitle("iPhone 16 Pro Max application preview")
        .closest("[data-rdl-device-id]"),
    ).toHaveAttribute("data-rdl-device-id", "iphone-16-pro-max");
  });

  it("updates automatic environment defaults after a controlled device change is committed", async () => {
    const onEnvironmentChange = vi.fn();
    const { rerender } = render(
      <DevicePreviewLab
        deviceId="iphone-16-pro-max"
        onEnvironmentChange={onEnvironmentChange}
        src="https://app.example.test/"
      />,
    );

    rerender(
      <DevicePreviewLab
        deviceId="pixel-10"
        onEnvironmentChange={onEnvironmentChange}
        src="https://app.example.test/"
      />,
    );

    await waitFor(() =>
      expect(onEnvironmentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          pointer: "coarse",
          safeArea: { top: 28, right: 0, bottom: 24, left: 0 },
        }),
      ),
    );
  });

  it("forwards synchronized route state through the lab API", async () => {
    const onRouteChange = vi.fn();
    render(
      <DevicePreviewLab
        onRouteChange={onRouteChange}
        src="https://app.example.test/tasks?filter=open#today"
      />,
    );

    await waitFor(() =>
      expect(onRouteChange).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://app.example.test/tasks?filter=open#today",
          pathname: "/tasks",
          source: "initial",
        }),
      ),
    );
  });

  it("uses one effective destination for the selector and iframe", () => {
    render(
      <DevicePreviewLab
        destinationId="missing"
        destinations={[
          {
            id: "overview",
            label: "Overview",
            src: "https://app.example.test/overview",
          },
          {
            id: "tasks",
            label: "Tasks",
            src: "https://app.example.test/tasks",
          },
        ]}
        src="https://fallback.example.test/"
      />,
    );

    expect(screen.getByLabelText("Destination")).toHaveValue("overview");
    expect(
      screen.getByTitle(
        `${DEVICE_PRESETS[0]?.name ?? "Device"} application preview`,
      ),
    ).toHaveAttribute("src", "https://app.example.test/overview");
  });

  it.each([
    [599, "compact"],
    [600, "medium"],
    [840, "expanded"],
  ] as const)(
    "exercises a %s px custom %s application layout",
    async (width, widthClass) => {
      const user = userEvent.setup();
      render(
        <DevicePreviewLab
          defaultCustomViewport={{ width, height: 900 }}
          defaultViewportMode="custom"
          src="https://app.example.test/"
        />,
      );

      expect(screen.getByText(widthClass, { exact: false })).toBeVisible();
      const iframe = screen.getByTitle("Custom viewport application preview");
      expect(
        iframe.closest("[data-rdl-viewport-width]"),
      ).toHaveAttribute("data-rdl-viewport-width", String(width));

      await user.click(screen.getByRole("button", { name: "50%" }));
      expect(
        iframe.closest("[data-rdl-viewport-width]"),
      ).toHaveAttribute("data-rdl-viewport-width", String(width));
      expect(iframe.closest("[data-rdl-preview-scale]")).toHaveAttribute(
        "data-rdl-preview-scale",
        "0.5",
      );
    },
  );

  it("rotates a custom viewport without rewriting its stored dimensions", async () => {
    const user = userEvent.setup();
    render(
      <DevicePreviewLab
        defaultCustomViewport={{ width: 500, height: 900 }}
        defaultViewportMode="custom"
        src="https://app.example.test/"
      />,
    );

    const iframe = screen.getByTitle("Custom viewport application preview");
    expect(iframe.closest("[data-rdl-viewport-width]")).toHaveAttribute(
      "data-rdl-viewport-width",
      "500",
    );

    await user.click(screen.getByRole("button", { name: "Rotate viewport" }));

    expect(iframe.closest("[data-rdl-viewport-width]")).toHaveAttribute(
      "data-rdl-viewport-width",
      "900",
    );
    expect(screen.getByLabelText("Custom viewport width")).toHaveValue(500);
    expect(screen.getByLabelText("Custom viewport height")).toHaveValue(900);
  });

  it("moves automatic phone safe-area clearance to both sides in landscape", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DevicePreviewLab
        defaultDeviceId="iphone-17-pro"
        defaultShowSafeArea
        src="https://app.example.test/"
      />,
    );
    const safeArea = container.querySelector("[data-rdl-safe-area]");
    expect(safeArea).toBeInstanceOf(HTMLElement);
    expect(safeArea).toHaveStyle({
      "--rdl-safe-top": "59px",
      "--rdl-safe-right": "0px",
      "--rdl-safe-bottom": "34px",
      "--rdl-safe-left": "0px",
    });

    await user.click(screen.getByRole("button", { name: "Rotate viewport" }));

    await waitFor(() =>
      expect(safeArea).toHaveStyle({
        "--rdl-safe-top": "0px",
        "--rdl-safe-right": "59px",
        "--rdl-safe-bottom": "34px",
        "--rdl-safe-left": "59px",
      }),
    );
  });

  it("preserves consumer-defined safe-area values when orientation changes", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DevicePreviewLab
        defaultDeviceId="iphone-17-pro"
        defaultEnvironment={{
          safeArea: { top: 12, right: 3, bottom: 7, left: 5 },
        }}
        defaultShowSafeArea
        src="https://app.example.test/"
      />,
    );
    const safeArea = container.querySelector("[data-rdl-safe-area]");
    expect(safeArea).toBeInstanceOf(HTMLElement);

    await user.click(screen.getByRole("button", { name: "Rotate viewport" }));

    await waitFor(() =>
      expect(safeArea).toHaveStyle({
        "--rdl-safe-top": "12px",
        "--rdl-safe-right": "3px",
        "--rdl-safe-bottom": "7px",
        "--rdl-safe-left": "5px",
      }),
    );
  });
});
