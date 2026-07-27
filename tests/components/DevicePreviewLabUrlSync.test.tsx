import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createPreviewEnvironment,
  DEVICE_PRESETS,
  DevicePreviewLab,
  readPreviewConfigurationFromSearch,
  writePreviewConfigurationToSearch,
  type PreviewConfiguration,
} from "../../src/index.js";

const restoredConfiguration: PreviewConfiguration = {
  version: 1,
  deviceId: "pixel-10",
  orientation: "landscape",
  zoom: 0.5,
  frameVisible: false,
  environment: createPreviewEnvironment({ colorScheme: "dark" }),
};

describe("DevicePreviewLab URL synchronization", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("leaves the URL untouched unless synchronization is enabled", async () => {
    const user = userEvent.setup();
    render(<DevicePreviewLab src="https://app.example.test/" />);

    await user.selectOptions(screen.getByLabelText("Device"), "pixel-10");

    expect(window.location.search).toBe("");
  });

  it("persists lab state under the default parameter and keeps unrelated parameters", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?theme=dark");
    render(
      <DevicePreviewLab
        src="https://app.example.test/"
        syncConfigurationToUrl
      />,
    );

    expect(window.location.search).toContain("theme=dark");
    expect(
      readPreviewConfigurationFromSearch(window.location.search),
    ).toMatchObject({
      deviceId: DEVICE_PRESETS[0]?.id,
      orientation: "portrait",
      zoom: "fit",
      frameVisible: true,
    });

    await user.selectOptions(screen.getByLabelText("Device"), "pixel-10");

    await waitFor(() =>
      expect(
        readPreviewConfigurationFromSearch(window.location.search),
      ).toMatchObject({ deviceId: "pixel-10" }),
    );
    expect(window.location.search).toContain("theme=dark");
  });

  it("restores the shared configuration on load", () => {
    window.history.replaceState(
      null,
      "",
      `/${writePreviewConfigurationToSearch("", restoredConfiguration)}`,
    );
    render(
      <DevicePreviewLab
        src="https://app.example.test/"
        syncConfigurationToUrl
      />,
    );

    expect(screen.getByLabelText("Device")).toHaveValue("pixel-10");
    expect(
      screen
        .getByTitle("Pixel 10 application preview")
        .closest("[data-rdl-viewport-width]"),
    ).toHaveAttribute("data-rdl-viewport-width", "808");
    expect(screen.getByRole("button", { name: "50%" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("checkbox", { name: "Show device frame" }),
    ).not.toBeChecked();
    expect(
      readPreviewConfigurationFromSearch(window.location.search),
    ).toMatchObject({
      deviceId: "pixel-10",
      environment: { colorScheme: "dark" },
    });
  });

  it("keeps explicitly controlled props ahead of the URL payload", async () => {
    window.history.replaceState(
      null,
      "",
      `/${writePreviewConfigurationToSearch("", restoredConfiguration)}`,
    );
    render(
      <DevicePreviewLab
        deviceId="iphone-16-pro-max"
        src="https://app.example.test/"
        syncConfigurationToUrl
      />,
    );

    expect(screen.getByLabelText("Device")).toHaveValue("iphone-16-pro-max");
    expect(
      screen
        .getByTitle("iPhone 16 Pro Max application preview")
        .closest("[data-rdl-viewport-width]"),
    ).toHaveAttribute("data-rdl-viewport-width", "956");

    await waitFor(() =>
      expect(
        readPreviewConfigurationFromSearch(window.location.search),
      ).toMatchObject({
        deviceId: "iphone-16-pro-max",
        orientation: "landscape",
      }),
    );
  });

  it("uses a custom parameter name when synchronization is a string", () => {
    render(
      <DevicePreviewLab
        src="https://app.example.test/"
        syncConfigurationToUrl="preview"
      />,
    );

    expect(window.location.search).toContain("preview=");
    expect(window.location.search).not.toContain("rdl=");
    expect(
      readPreviewConfigurationFromSearch(window.location.search, "preview"),
    ).toMatchObject({ deviceId: DEVICE_PRESETS[0]?.id });
  });

  it("ignores an invalid payload and renders the default state", () => {
    window.history.replaceState(null, "", "/?rdl=not-a-configuration");
    render(
      <DevicePreviewLab
        src="https://app.example.test/"
        syncConfigurationToUrl
      />,
    );

    expect(screen.getByLabelText("Device")).toHaveValue(
      DEVICE_PRESETS[0]?.id,
    );
    expect(
      readPreviewConfigurationFromSearch(window.location.search),
    ).toMatchObject({ deviceId: DEVICE_PRESETS[0]?.id });
  });
});
