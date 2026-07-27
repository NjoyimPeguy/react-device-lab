import { describe, expect, it } from "vitest";

import {
  createPreviewEnvironment,
  PREVIEW_CONFIGURATION_URL_PARAM,
  readPreviewConfigurationFromSearch,
  serializePreviewConfiguration,
  writePreviewConfigurationToSearch,
  type PreviewConfiguration,
} from "../../src/index.js";

const configuration: PreviewConfiguration = {
  version: 1,
  deviceId: "iphone-17-pro",
  orientation: "landscape",
  zoom: 0.75,
  frameVisible: false,
  environment: createPreviewEnvironment({
    colorScheme: "dark",
    direction: "rtl",
    locale: "ar",
    permissions: { camera: "denied" },
    safeArea: { top: 0, right: 59, bottom: 34, left: 59 },
    virtualKeyboard: { visible: true, height: 292 },
  }),
};

describe("URL preview configuration", () => {
  it("exposes the default query parameter name", () => {
    expect(PREVIEW_CONFIGURATION_URL_PARAM).toBe("rdl");
  });

  it("writes the serialized payload under the default parameter", () => {
    const payload = encodeURIComponent(
      serializePreviewConfiguration(configuration),
    );

    expect(writePreviewConfigurationToSearch("", configuration)).toBe(
      `?rdl=${payload}`,
    );
    expect(writePreviewConfigurationToSearch("?rdl=stale", configuration)).toBe(
      `?rdl=${payload}`,
    );
  });

  it("preserves unrelated query parameters and their order", () => {
    const search = writePreviewConfigurationToSearch(
      "?theme=dark&view=components",
      configuration,
    );

    expect(search.startsWith("?theme=dark&view=components&rdl=")).toBe(true);
    expect(readPreviewConfigurationFromSearch(search)).toEqual(configuration);
  });

  it("round-trips a configuration through the query string", () => {
    expect(
      readPreviewConfigurationFromSearch(
        writePreviewConfigurationToSearch("", configuration),
      ),
    ).toEqual(configuration);
    expect(
      readPreviewConfigurationFromSearch(
        writePreviewConfigurationToSearch("?theme=dark", configuration),
      ),
    ).toEqual(configuration);
  });

  it("honors a custom parameter name on write and read", () => {
    const search = writePreviewConfigurationToSearch(
      "?theme=dark",
      configuration,
      "preview",
    );

    expect(search.startsWith("?theme=dark&preview=")).toBe(true);
    expect(search).not.toContain("rdl=");
    expect(readPreviewConfigurationFromSearch(search, "preview")).toEqual(
      configuration,
    );
    expect(readPreviewConfigurationFromSearch(search)).toBeNull();
  });

  it("accepts a search string with or without the leading question mark", () => {
    const search = writePreviewConfigurationToSearch("", configuration);

    expect(readPreviewConfigurationFromSearch(search.slice(1))).toEqual(
      configuration,
    );
  });

  it.each([
    "",
    "?",
    "?theme=dark",
    "?rdl=",
    "?rdl=not-json",
    "?rdl=%7B%22version%22%3A2%7D",
    '?rdl={"version":1}',
    "?rdl=%E0%A4%A",
    "?rdl=%25%32%35",
  ])("returns null instead of throwing for: %s", (search) => {
    expect(readPreviewConfigurationFromSearch(search)).toBeNull();
  });

  it("rejects a payload that is valid JSON but not a version 1 configuration", () => {
    const invalid = encodeURIComponent(
      JSON.stringify({ version: 1, deviceId: "x" }),
    );

    expect(readPreviewConfigurationFromSearch(`?rdl=${invalid}`)).toBeNull();
  });
});
