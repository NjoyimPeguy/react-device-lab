import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DEVICE_PRESETS,
  DevicePreviewLab,
  groupDevicePresets,
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

  it("cycles devices in flattened catalog order and rotates from the keyboard", () => {
    const ordered = groupDevicePresets(DEVICE_PRESETS).flatMap(
      (group) => group.devices,
    );
    const first = DEVICE_PRESETS[0];
    const startIndex = ordered.findIndex((device) => device.id === first?.id);
    const next = ordered[(startIndex + 1) % ordered.length];
    render(<DevicePreviewLab src="https://app.example.test/" />);

    fireEvent.keyDown(window, { key: "]" });
    expect(screen.getByLabelText("Device")).toHaveValue(next?.id ?? "");

    fireEvent.keyDown(window, { key: "[" });
    expect(screen.getByLabelText("Device")).toHaveValue(first?.id ?? "");

    const iframe = screen.getByTitle(
      `${first?.name ?? "Device"} application preview`,
    );
    expect(iframe.closest("[data-rdl-viewport-width]")).toHaveAttribute(
      "data-rdl-viewport-width",
      String(first?.logicalViewport.width),
    );

    fireEvent.keyDown(window, { key: "r" });

    expect(iframe.closest("[data-rdl-viewport-width]")).toHaveAttribute(
      "data-rdl-viewport-width",
      String(first?.logicalViewport.height),
    );
  });

  it("steps zoom within 10%–200%, resets to Fit, and toggles the frame", () => {
    render(<DevicePreviewLab src="https://app.example.test/" />);
    const iframe = screen.getByTitle(
      `${DEVICE_PRESETS[0]?.name ?? "Device"} application preview`,
    );
    const scale = () =>
      iframe.closest("[data-rdl-preview-scale]")?.getAttribute(
        "data-rdl-preview-scale",
      );
    const frameToggle = screen.getByRole("checkbox", {
      name: "Show device frame",
    });

    fireEvent.keyDown(window, { key: "+" });
    expect(scale()).toBe("1.1");

    fireEvent.keyDown(window, { key: "-" });
    fireEvent.keyDown(window, { key: "-" });
    expect(scale()).toBe("0.9");

    for (let index = 0; index < 12; index += 1) {
      fireEvent.keyDown(window, { key: "-" });
    }
    expect(scale()).toBe("0.1");

    for (let index = 0; index < 30; index += 1) {
      fireEvent.keyDown(window, { key: "+" });
    }
    expect(scale()).toBe("2");

    fireEvent.keyDown(window, { key: "0" });
    expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    expect(frameToggle).toBeChecked();
    fireEvent.keyDown(window, { key: "f" });
    expect(frameToggle).not.toBeChecked();
  });

  it("disables every binding with keyboardShortcuts={false}", () => {
    const first = DEVICE_PRESETS[0];
    render(
      <DevicePreviewLab
        keyboardShortcuts={false}
        src="https://app.example.test/"
      />,
    );

    fireEvent.keyDown(window, { key: "]" });
    fireEvent.keyDown(window, { key: "r" });
    fireEvent.keyDown(window, { key: "f" });

    expect(screen.getByLabelText("Device")).toHaveValue(first?.id ?? "");
    expect(
      screen
        .getByTitle(`${first?.name ?? "Device"} application preview`)
        .closest("[data-rdl-viewport-width]"),
    ).toHaveAttribute(
      "data-rdl-viewport-width",
      String(first?.logicalViewport.width),
    );
    expect(
      screen.getByRole("checkbox", { name: "Show device frame" }),
    ).toBeChecked();
  });

  it("overrides and removes individual bindings", () => {
    const ordered = groupDevicePresets(DEVICE_PRESETS).flatMap(
      (group) => group.devices,
    );
    const first = DEVICE_PRESETS[0];
    const startIndex = ordered.findIndex((device) => device.id === first?.id);
    const next = ordered[(startIndex + 1) % ordered.length];
    render(
      <DevicePreviewLab
        keyboardShortcuts={{ nextDevice: "n", toggleFrame: null }}
        src="https://app.example.test/"
      />,
    );

    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByLabelText("Device")).toHaveValue(next?.id ?? "");

    fireEvent.keyDown(window, { key: "]" });
    expect(screen.getByLabelText("Device")).toHaveValue(next?.id ?? "");

    fireEvent.keyDown(window, { key: "f" });
    expect(
      screen.getByRole("checkbox", { name: "Show device frame" }),
    ).toBeChecked();
  });

  it("ignores shortcuts typed into the device search field", async () => {
    const user = userEvent.setup();
    const first = DEVICE_PRESETS[0];
    render(<DevicePreviewLab src="https://app.example.test/" />);

    await user.type(screen.getByLabelText("Search devices"), "r]f+0");

    expect(
      screen
        .getByTitle(`${first?.name ?? "Device"} application preview`)
        .closest("[data-rdl-device-id]"),
    ).toHaveAttribute("data-rdl-device-id", first?.id ?? "");
    expect(
      screen
        .getByTitle(`${first?.name ?? "Device"} application preview`)
        .closest("[data-rdl-viewport-width]"),
    ).toHaveAttribute(
      "data-rdl-viewport-width",
      String(first?.logicalViewport.width),
    );
    expect(
      screen.getByRole("checkbox", { name: "Show device frame" }),
    ).toBeChecked();
    expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
