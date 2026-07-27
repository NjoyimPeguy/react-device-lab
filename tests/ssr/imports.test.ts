// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("SSR-safe public imports", () => {
  it("evaluates every preview and bridge export without browser globals", async () => {
    const api = await import("../../src/index.js");

    expect(api.DevicePreview).toBeTypeOf("function");
    expect(api.IframePortal).toBeTypeOf("function");
    expect(api.installPreviewBridge).toBeTypeOf("function");
    expect(api.usePreviewShortcuts).toBeTypeOf("function");
    expect(api.computeFitScale).toBeTypeOf("function");
    expect(api.readPreviewConfigurationFromSearch).toBeTypeOf("function");
    expect(api.writePreviewConfigurationToSearch).toBeTypeOf("function");
    expect(api.PREVIEW_CONFIGURATION_URL_PARAM).toBe("rdl");
    expect(api.DEFAULT_PREVIEW_ENVIRONMENT).toBeDefined();
  });
});
