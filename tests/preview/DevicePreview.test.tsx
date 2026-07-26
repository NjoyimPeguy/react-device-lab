import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DEVICE_PRESETS,
  DevicePreview,
  createPreviewEnvironment,
  createPreviewReadyMessage,
  parsePreviewBridgeMessage,
  usePreviewEnvironment,
  type DevicePreset,
} from "../../src/index.js";

function findPreset(name: string): DevicePreset {
  const device = DEVICE_PRESETS.find((candidate) => candidate.name === name);
  expect(device, name).toBeDefined();
  return device as DevicePreset;
}

function getPreviewIframe(title: string): HTMLIFrameElement {
  const element = screen.getByTitle(title);
  if (!(element instanceof HTMLIFrameElement)) {
    throw new TypeError(`Expected "${title}" to identify an iframe.`);
  }
  return element;
}

function EnvironmentProbe() {
  const environment = usePreviewEnvironment();
  return (
    <output aria-label="Portal environment">
      {environment.colorScheme}:{environment.safeArea.top}
    </output>
  );
}

describe("DevicePreview", () => {
  it("renders a source iframe at exact logical dimensions", () => {
    const device = findPreset("iPhone 16 Pro Max");
    render(
      <DevicePreview
        device={device}
        fitBounds={{ width: 1200, height: 1200 }}
        src="https://app.example.test/tasks"
        zoom={0.5}
      />,
    );

    const iframe = screen.getByTitle("iPhone 16 Pro Max application preview");
    const viewport = iframe.closest("[data-rdl-viewport-width]");
    const scaled = iframe.closest("[data-rdl-preview-scale]");

    expect(iframe).toHaveAttribute("src", "https://app.example.test/tasks");
    expect(viewport).toHaveStyle({ width: "440px", height: "956px" });
    expect(scaled).toHaveStyle({ transform: "scale(0.5)" });
    expect(screen.getByText("/tasks")).toBeVisible();
  });

  it("accepts the documented devices collection form", () => {
    render(
      <DevicePreview
        defaultDeviceId="pixel-10"
        devices={DEVICE_PRESETS}
        src="https://app.example.test/"
      />,
    );

    expect(
      screen
        .getByTitle("Pixel 10 application preview")
        .closest("[data-rdl-device-frame]"),
    ).toHaveAttribute("data-rdl-device-id", "pixel-10");
  });

  it("resolves a default device id from the built-in catalog", () => {
    render(
      <DevicePreview
        defaultDeviceId="pixel-10"
        src="https://app.example.test/"
      />,
    );

    expect(
      screen
        .getByTitle("Pixel 10 application preview")
        .closest("[data-rdl-device-frame]"),
    ).toHaveAttribute("data-rdl-device-id", "pixel-10");
  });

  it("posts the clamped explicit zoom used by the preview", () => {
    render(
      <DevicePreview
        device={findPreset("Pixel 10")}
        src={window.location.href}
        zoom={9}
      />,
    );
    const iframe = getPreviewIframe("Pixel 10 application preview");
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");

    expect(() => fireEvent.load(iframe)).not.toThrow();

    const configuration = postMessage.mock.calls
      .map(([message]) => parsePreviewBridgeMessage(message))
      .find((message) => message?.type === "configuration");
    expect(configuration?.type).toBe("configuration");
    if (configuration?.type !== "configuration") {
      throw new TypeError("Expected a configuration bridge message.");
    }
    expect(configuration.payload.configuration.zoom).toBe(2);
  });

  it("keeps reload and new-tab actions on the current route", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(
      <DevicePreview
        device={findPreset("Galaxy S25")}
        src="https://app.example.test/current?tab=one#item"
      />,
    );
    const iframe = getPreviewIframe(
      "Galaxy S25 application preview",
    );

    await user.click(screen.getByRole("button", { name: "Reload preview" }));
    const reloadedIframe = getPreviewIframe(
      "Galaxy S25 application preview",
    );
    expect(reloadedIframe).not.toBe(iframe);
    expect(reloadedIframe).toHaveAttribute(
      "src",
      "https://app.example.test/current?tab=one#item",
    );

    await user.click(
      screen.getByRole("button", { name: "Open preview in new tab" }),
    );
    expect(open).toHaveBeenCalledWith(
      "https://app.example.test/current?tab=one#item",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("renders consumer React content through an iframe portal", () => {
    render(
      <DevicePreview device={findPreset("iPad mini (A17 Pro)")}>
        <main>Portal application</main>
      </DevicePreview>,
    );

    const iframe = getPreviewIframe(
      "iPad mini (A17 Pro) application preview",
    );
    fireEvent.load(iframe);

    expect(
      iframe.contentDocument?.body.textContent,
    ).toContain("Portal application");
    expect(screen.getByText("Portal content")).toBeVisible();
  });

  it("provides the configured environment to portal React content", () => {
    render(
      <DevicePreview
        device={findPreset("iPad mini (A17 Pro)")}
        environment={{ colorScheme: "dark", safeArea: { top: 24 } }}
      >
        <EnvironmentProbe />
      </DevicePreview>,
    );
    const iframe = getPreviewIframe(
      "iPad mini (A17 Pro) application preview",
    );
    fireEvent.load(iframe);

    expect(iframe.contentDocument?.body.textContent).toContain("dark:24");
  });

  it("labels an unsynchronized source route as initial, not current", () => {
    render(
      <DevicePreview
        device={findPreset("Pixel 10")}
        src="https://cross-origin.example.test/tasks"
      />,
    );

    expect(
      screen.getByRole("status", { name: "Initial embedded route" }),
    ).toHaveTextContent("/tasks");
    expect(screen.getByText("Route synchronization pending")).toBeVisible();
  });

  it("updates route presentation across mounted source and portal modes", () => {
    const device = findPreset("Pixel 10");
    const { rerender } = render(
      <DevicePreview
        device={device}
        src="https://app.example.test/first"
      />,
    );

    expect(screen.getByText("/first")).toBeVisible();
    rerender(
      <DevicePreview device={device}>
        <main>Portal mode</main>
      </DevicePreview>,
    );
    expect(screen.getByText("Portal content")).toBeVisible();

    rerender(
      <DevicePreview
        device={device}
        src="https://app.example.test/second"
      />,
    );
    expect(screen.getByText("/second")).toBeVisible();
  });

  it("sends later configuration to the current validated bridge origin", () => {
    const device = findPreset("Pixel 10");
    const { rerender } = render(
      <DevicePreview
        bridgeOrigins={[
          "https://one.example.test",
          "https://two.example.test",
        ]}
        device={device}
        environment={{ colorScheme: "light" }}
        src="https://one.example.test/start"
      />,
    );
    const iframe = getPreviewIframe("Pixel 10 application preview");
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");

    window.dispatchEvent(
      new MessageEvent("message", {
        data: createPreviewReadyMessage(
          "https://two.example.test/continued",
        ),
        origin: "https://two.example.test",
        source: iframe.contentWindow,
      }),
    );
    postMessage.mockClear();

    rerender(
      <DevicePreview
        bridgeOrigins={[
          "https://one.example.test",
          "https://two.example.test",
        ]}
        device={device}
        environment={createPreviewEnvironment({
          colorScheme: "dark",
        })}
        src="https://one.example.test/start"
      />,
    );

    const lastCall: unknown = postMessage.mock.calls.at(-1);
    if (!Array.isArray(lastCall)) {
      throw new TypeError("Expected a configuration bridge call.");
    }
    const message: unknown = lastCall[0];
    const targetOrigin: unknown = lastCall[1];
    const parsed = parsePreviewBridgeMessage(message);

    expect(targetOrigin).toBe("https://two.example.test");
    expect(parsed?.type).toBe("configuration");
    if (parsed?.type !== "configuration") {
      throw new TypeError("Expected a configuration bridge message.");
    }
    expect(parsed.payload.configuration.environment.colorScheme).toBe("dark");
  });
});
