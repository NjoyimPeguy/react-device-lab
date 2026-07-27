import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUrlConfiguration } from "../../src/hooks/useUrlConfiguration.js";
import {
  createPreviewEnvironment,
  readPreviewConfigurationFromSearch,
  writePreviewConfigurationToSearch,
  type PreviewConfiguration,
} from "../../src/index.js";

const baseConfiguration: PreviewConfiguration = {
  version: 1,
  deviceId: "iphone-17-pro",
  orientation: "portrait",
  zoom: "fit",
  frameVisible: true,
  environment: createPreviewEnvironment(),
};

const restoredConfiguration: PreviewConfiguration = {
  ...baseConfiguration,
  deviceId: "pixel-10",
  orientation: "landscape",
  zoom: 0.5,
  frameVisible: false,
  environment: createPreviewEnvironment({ colorScheme: "dark" }),
};

function Harness({
  sync,
  configuration,
  onRestore,
}: {
  readonly sync: boolean | string | undefined;
  readonly configuration: PreviewConfiguration;
  readonly onRestore: (configuration: PreviewConfiguration) => void;
}) {
  useUrlConfiguration(sync, configuration, onRestore);
  return null;
}

describe("useUrlConfiguration", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("persists the current configuration on mount when the URL has none", () => {
    render(
      <Harness
        configuration={baseConfiguration}
        onRestore={() => undefined}
        sync
      />,
    );

    expect(readPreviewConfigurationFromSearch(window.location.search)).toEqual(
      baseConfiguration,
    );
  });

  it("restores the URL configuration once on mount without rewriting it", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    window.history.replaceState(
      null,
      "",
      `/${writePreviewConfigurationToSearch("?theme=dark", restoredConfiguration)}`,
    );
    replaceState.mockClear();
    const onRestore = vi.fn();

    render(
      <Harness
        configuration={baseConfiguration}
        onRestore={onRestore}
        sync
      />,
    );

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith(restoredConfiguration);
    expect(replaceState).not.toHaveBeenCalled();
    expect(window.location.search).toContain("theme=dark");
    expect(window.location.search).toContain("rdl=");
  });

  it("updates the URL with replaceState only when the configuration changes", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const pushState = vi.spyOn(window.history, "pushState");
    const onRestore = vi.fn();
    const { rerender } = render(
      <Harness
        configuration={baseConfiguration}
        onRestore={onRestore}
        sync
      />,
    );
    expect(replaceState).toHaveBeenCalledTimes(1);

    rerender(
      <Harness
        configuration={{ ...baseConfiguration }}
        onRestore={onRestore}
        sync
      />,
    );
    expect(replaceState).toHaveBeenCalledTimes(1);

    rerender(
      <Harness
        configuration={{ ...baseConfiguration, zoom: 0.5 }}
        onRestore={onRestore}
        sync
      />,
    );
    expect(replaceState).toHaveBeenCalledTimes(2);
    expect(pushState).not.toHaveBeenCalled();
    expect(onRestore).not.toHaveBeenCalled();
    expect(readPreviewConfigurationFromSearch(window.location.search)).toEqual({
      ...baseConfiguration,
      zoom: 0.5,
    });
  });

  it("uses a custom parameter name when sync is a string", () => {
    render(
      <Harness
        configuration={baseConfiguration}
        onRestore={() => undefined}
        sync="preview"
      />,
    );

    expect(window.location.search).toContain("preview=");
    expect(window.location.search).not.toContain("rdl=");
    expect(
      readPreviewConfigurationFromSearch(window.location.search, "preview"),
    ).toEqual(baseConfiguration);
  });

  it.each([undefined, false] as const)(
    "leaves the URL alone when sync is %s",
    (sync) => {
      render(
        <Harness
          configuration={baseConfiguration}
          onRestore={() => undefined}
          sync={sync}
        />,
      );

      expect(window.location.search).toBe("");
    },
  );

  it("restores the configuration again after popstate navigation", () => {
    const onRestore = vi.fn();
    render(
      <Harness
        configuration={baseConfiguration}
        onRestore={onRestore}
        sync
      />,
    );
    expect(onRestore).not.toHaveBeenCalled();

    window.history.replaceState(
      null,
      "",
      `/${writePreviewConfigurationToSearch("", restoredConfiguration)}`,
    );
    window.dispatchEvent(new Event("popstate"));

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith(restoredConfiguration);
  });

  it("removes the popstate listener on unmount", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <Harness
        configuration={baseConfiguration}
        onRestore={() => undefined}
        sync
      />,
    );

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );
  });
});
