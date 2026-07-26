import { describe, expect, it } from "vitest";

import {
  PREVIEW_BRIDGE_NAMESPACE,
  PREVIEW_BRIDGE_VERSION,
  createPreviewConfigurationMessage,
  createPreviewEnvironment,
  createPreviewRouteMessage,
  parsePreviewBridgeMessage,
  type PreviewConfiguration,
} from "../../src/index.js";

const configuration: PreviewConfiguration = {
  version: 1,
  deviceId: "pixel-10",
  orientation: "landscape",
  zoom: 0.75,
  frameVisible: false,
  environment: createPreviewEnvironment(),
};

describe("preview bridge messages", () => {
  it("creates versioned route and configuration messages", () => {
    expect(createPreviewRouteMessage("https://app.example.test/tasks?mine=1#top")).toEqual({
      namespace: PREVIEW_BRIDGE_NAMESPACE,
      version: PREVIEW_BRIDGE_VERSION,
      type: "route",
      payload: { href: "https://app.example.test/tasks?mine=1#top" },
    });
    expect(createPreviewConfigurationMessage(configuration)).toEqual({
      namespace: PREVIEW_BRIDGE_NAMESPACE,
      version: PREVIEW_BRIDGE_VERSION,
      type: "configuration",
      payload: { configuration },
    });
  });

  it("parses exact protocol messages and rejects malformed data", () => {
    const route = createPreviewRouteMessage("https://app.example.test/tasks");
    expect(parsePreviewBridgeMessage(route)).toEqual(route);

    for (const value of [
      null,
      {},
      { ...route, namespace: "another-tool" },
      { ...route, version: 2 },
      { ...route, type: "execute" },
      { ...route, payload: { href: "javascript:alert(1)" } },
      { ...route, extra: true },
    ]) {
      expect(parsePreviewBridgeMessage(value)).toBeNull();
    }
  });
});
