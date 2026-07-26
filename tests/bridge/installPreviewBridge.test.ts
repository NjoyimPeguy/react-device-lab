import { describe, expect, it, vi } from "vitest";

import {
  createPreviewConfigurationMessage,
  createPreviewEnvironment,
  installPreviewBridge,
  type PreviewConfiguration,
} from "../../src/index.js";

const configuration: PreviewConfiguration = {
  version: 1,
  deviceId: "galaxy-s25",
  orientation: "portrait",
  zoom: "fit",
  frameVisible: true,
  environment: createPreviewEnvironment({ locale: "fr" }),
};

describe("installPreviewBridge", () => {
  it("accepts messages only from an allowed origin and the parent source", () => {
    const onConfiguration = vi.fn();
    const parentWindow = { postMessage: vi.fn() } as unknown as Window;
    const otherWindow = { postMessage: vi.fn() } as unknown as Window;
    const cleanup = installPreviewBridge({
      allowedParentOrigins: ["https://host.example.test"],
      onConfiguration,
      parentWindow,
      targetWindow: window,
    });
    const message = createPreviewConfigurationMessage(configuration);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: message,
        origin: "https://attacker.example.test",
        source: parentWindow,
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: message,
        origin: "https://host.example.test",
        source: otherWindow,
      }),
    );
    expect(onConfiguration).not.toHaveBeenCalled();

    window.dispatchEvent(
      new MessageEvent("message", {
        data: message,
        origin: "https://host.example.test",
        source: parentWindow,
      }),
    );
    expect(onConfiguration).toHaveBeenCalledOnce();
    expect(document.documentElement).toHaveAttribute("lang", "fr");

    cleanup();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: message,
        origin: "https://host.example.test",
        source: parentWindow,
      }),
    );
    expect(onConfiguration).toHaveBeenCalledOnce();
  });
});
