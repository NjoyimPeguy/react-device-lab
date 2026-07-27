import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DEVICE_PRESETS,
  DeviceFrame,
  getDeviceFrameDimensions,
  type DevicePreset,
} from "../../src/index.js";

/**
 * Shell tones authored in `src/styles/index.css`. The graphite default lives
 * on the base `.rdl-frame` variables, so it needs no attribute selector.
 */
const AUTHORED_SHELL_TONES: readonly string[] = [
  "graphite",
  "silver",
  "titanium-dark",
  "titanium-light",
  "porcelain",
];
const DEFAULT_SHELL_TONE = "graphite";

function findPreset(name: string): DevicePreset {
  const preset = DEVICE_PRESETS.find((candidate) => candidate.name === name);
  expect(preset, name).toBeDefined();
  return preset as DevicePreset;
}

function renderFrame(name: string) {
  const device = findPreset(name);
  const result = render(
    <DeviceFrame device={device} contentLabel={`${name} application`}>
      <button type="button">Application action</button>
    </DeviceFrame>,
  );
  const viewport = screen.getByRole("region", {
    name: `${name} application`,
  });
  const frame = viewport.closest("[data-rdl-device-frame]");
  expect(frame).toBeInstanceOf(HTMLElement);

  return {
    ...result,
    device,
    frame: frame as HTMLElement,
    viewport,
  };
}

describe("DeviceFrame", () => {
  it("keeps the target viewport exact when frame visibility changes", () => {
    const device = findPreset("iPhone 16 Pro Max");
    const { rerender } = render(
      <DeviceFrame device={device} contentLabel="Target application">
        Content
      </DeviceFrame>,
    );
    const viewport = screen.getByRole("region", {
      name: "Target application",
    });

    expect(viewport).toHaveStyle({ width: "440px", height: "956px" });
    expect(viewport.closest("[data-rdl-device-frame]")).toHaveAttribute(
      "data-rdl-frame-visible",
      "true",
    );

    rerender(
      <DeviceFrame
        device={device}
        contentLabel="Target application"
        frameVisible={false}
      >
        Content
      </DeviceFrame>,
    );

    expect(viewport).toHaveStyle({ width: "440px", height: "956px" });
    expect(viewport.closest("[data-rdl-device-frame]")).toHaveAttribute(
      "data-rdl-frame-visible",
      "false",
    );
    expect(
      viewport
        .closest("[data-rdl-device-frame]")
        ?.querySelector("[data-rdl-hardware]"),
    ).not.toBeInTheDocument();
  });

  it("rotates the exact viewport without replacing the selected device", () => {
    const device = findPreset("iPhone 16 Pro Max");
    const { rerender } = render(
      <DeviceFrame
        device={device}
        contentLabel="Rotating application"
        orientation="portrait"
      >
        Content
      </DeviceFrame>,
    );

    rerender(
      <DeviceFrame
        device={device}
        contentLabel="Rotating application"
        orientation="landscape"
      >
        Content
      </DeviceFrame>,
    );

    expect(
      screen.getByRole("region", { name: "Rotating application" }),
    ).toHaveStyle({
      width: "956px",
      height: "440px",
    });
    expect(
      screen
        .getByRole("region", { name: "Rotating application" })
        .closest("[data-rdl-device-frame]"),
    ).toHaveAttribute(
      "data-rdl-device-id",
      device.id,
    );
  });

  it("rotates mobile cutouts but keeps landscape-first cutouts on top", () => {
    const phone = findPreset("iPhone 17 Pro");
    const { unmount } = render(
      <DeviceFrame
        device={phone}
        contentLabel="Landscape phone"
        orientation="landscape"
      >
        Content
      </DeviceFrame>,
    );
    expect(
      screen
        .getByRole("region", { name: "Landscape phone" })
        .closest("[data-rdl-device-frame]"),
    ).toHaveAttribute("data-rdl-cutout-mount", "leading");
    unmount();

    for (const name of ["Galaxy Tab S10 Ultra", "MacBook Air 13-inch"]) {
      const device = findPreset(name);
      const rendered = render(
        <DeviceFrame
          device={device}
          contentLabel={`${name} landscape`}
          orientation="landscape"
        >
          Content
        </DeviceFrame>,
      );
      expect(
        screen
          .getByRole("region", { name: `${name} landscape` })
          .closest("[data-rdl-device-frame]"),
      ).toHaveAttribute("data-rdl-cutout-mount", "top");
      rendered.unmount();
    }
  });

  it.each([
    ["iPhone SE (3rd generation)", ["earpiece", "home-button"]],
    ["iPhone 13 mini", ["traditional-notch", "mute", "volume", "power"]],
    [
      "iPhone 17 Pro",
      ["dynamic-island", "action", "camera-control", "volume", "power"],
    ],
    ["Galaxy S25 Ultra", ["punch-hole", "volume", "power"]],
    ["Galaxy Z Flip 7 — cover", ["cover-camera-pair", "volume", "power"]],
    ["Galaxy Z Fold 7 — unfolded", ["punch-hole", "fold-crease"]],
    ["iPad Pro 13-inch", ["tablet-camera"]],
    ["Galaxy Tab S10 Ultra", ["tablet-notch"]],
    ["MacBook Air 13-inch", ["laptop-notch", "laptop-base"]],
    ["Windows laptop", ["laptop-camera", "laptop-base"]],
    ["Full HD desktop", ["monitor-camera", "monitor-stand"]],
    [
      "Ultrawide desktop",
      ["monitor-camera", "monitor-stand", "ultrawide"],
    ],
  ])("renders authored %s skin features", (name, expectedFeatures) => {
    const { frame } = renderFrame(name);

    for (const feature of expectedFeatures) {
      expect(
        frame.querySelector(`[data-rdl-feature="${feature}"]`),
        `${name}: ${feature}`,
      ).toBeInTheDocument();
    }
  });

  it("uses distinct model geometry for materially different silhouettes", () => {
    const geometryFor = (name: string) => {
      const rendered = renderFrame(name);
      const geometry = rendered.frame.getAttribute("data-rdl-geometry");
      rendered.unmount();
      return geometry;
    };
    const air = geometryFor("iPhone Air");
    const proMax = geometryFor("iPhone 17 Pro Max");
    const edge = geometryFor("Galaxy S25 Edge");
    const ultra = geometryFor("Galaxy S25 Ultra");

    expect(new Set([air, proMax, edge, ultra]).size).toBe(4);
  });

  it("applies the catalog corner profile to model-specific radii", () => {
    const edge = renderFrame("Galaxy S25 Edge");
    expect(edge.frame).toHaveAttribute(
      "data-rdl-corner-profile",
      edge.device.frame.cornerProfile,
    );
    expect(edge.frame).toHaveStyle({ "--rdl-frame-radius": "48px" });
    edge.unmount();

    const ultra = renderFrame("Galaxy S25 Ultra");
    expect(ultra.frame).toHaveAttribute(
      "data-rdl-corner-profile",
      ultra.device.frame.cornerProfile,
    );
    expect(ultra.frame).toHaveStyle({ "--rdl-frame-radius": "25px" });
  });

  it("emits the authored default tone for each frame style", () => {
    const expectations: Array<[string, string]> = [
      ["iPhone SE (3rd generation)", "silver"],
      ["iPhone 13 mini", "graphite"],
      ["iPhone 17 Pro", "graphite"],
      ["Galaxy S25 Ultra", "graphite"],
      ["Galaxy Z Fold 7 — unfolded", "graphite"],
      ["iPad Pro 13-inch", "silver"],
      ["MacBook Air 13-inch", "silver"],
      ["Full HD desktop", "graphite"],
    ];

    for (const [name, tone] of expectations) {
      const rendered = renderFrame(name);
      expect(rendered.frame, name).toHaveAttribute(
        "data-rdl-shell-tone",
        tone,
      );
      rendered.unmount();
    }
  });

  it("emits only authored palette tones across the whole catalog", () => {
    for (const device of DEVICE_PRESETS) {
      const { unmount } = render(
        <DeviceFrame device={device} contentLabel={device.name}>
          Content
        </DeviceFrame>,
      );
      const frame = screen
        .getByRole("region", { name: device.name })
        .closest("[data-rdl-device-frame]");
      const tone = (frame as HTMLElement).dataset["rdlShellTone"];
      expect(AUTHORED_SHELL_TONES.includes(tone ?? ""), device.id).toBe(true);
      unmount();
    }
  });

  it("backs every authored shell tone with a full set of CSS variables", () => {
    const stylesheet = readFileSync(
      resolve("src/styles/index.css"),
      "utf8",
    );

    for (const tone of AUTHORED_SHELL_TONES) {
      if (tone === DEFAULT_SHELL_TONE) continue;
      const rule = new RegExp(
        `\\.rdl-frame\\[data-rdl-shell-tone="${tone}"\\]\\s*\\{[^}]*\\}`,
        "u",
      );
      const block = rule.exec(stylesheet)?.[0] ?? "";
      expect(block, tone).toContain("--rdl-frame-metal:");
      expect(block, tone).toContain("--rdl-frame-metal-edge:");
      expect(block, tone).toContain("--rdl-frame-highlight:");
    }
  });

  it("draws a non-interactive safe-area overlay with explicit insets", () => {
    const device = findPreset("iPhone 17 Pro");
    render(
      <DeviceFrame
        device={device}
        contentLabel="Safe-area application"
        safeAreaInsets={{ top: 62, right: 0, bottom: 34, left: 0 }}
        showSafeArea
      >
        Content
      </DeviceFrame>,
    );

    const overlay = screen
      .getByRole("region", { name: "Safe-area application" })
      .querySelector("[data-rdl-safe-area]");
    expect(overlay).toBeInstanceOf(HTMLElement);
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay).toHaveStyle({
      "--rdl-safe-top": "62px",
      "--rdl-safe-right": "0px",
      "--rdl-safe-bottom": "34px",
      "--rdl-safe-left": "0px",
    });
  });

  it("keeps hardware decorative and application content keyboard reachable", () => {
    const { frame } = renderFrame("iPhone 17 Pro");
    const hardware = frame.querySelector("[data-rdl-hardware]");

    expect(hardware).toBeInstanceOf(HTMLElement);
    expect(hardware).toHaveAttribute("aria-hidden", "true");
    expect(
      (hardware as HTMLElement).querySelectorAll(
        "button, a, input, select, textarea",
      ),
    ).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Application action" }),
    ).toBeVisible();
    expect(frame.querySelector("img")).not.toBeInTheDocument();
    expect(frame.innerHTML).not.toMatch(/\burl\s*\(/iu);
  });

  it("provides frame dimensions without changing viewport metadata", () => {
    const device = findPreset("MacBook Air 13-inch");
    const visible = getDeviceFrameDimensions(device, "landscape", true);
    const hidden = getDeviceFrameDimensions(device, "landscape", false);

    expect(hidden).toEqual({
      width: device.logicalViewport.width,
      height: device.logicalViewport.height,
    });
    expect(visible.width).toBeGreaterThan(hidden.width);
    expect(visible.height).toBeGreaterThan(hidden.height);
    expect(device.logicalViewport).toMatchObject({
      width: 1440,
      height: 900,
    });
  });

  it("has authored geometry for every preset", () => {
    for (const device of DEVICE_PRESETS) {
      const { unmount } = render(
        <DeviceFrame device={device} contentLabel={device.name}>
          Content
        </DeviceFrame>,
      );
      const frame = screen
        .getByRole("region", { name: device.name })
        .closest("[data-rdl-device-frame]");

      expect(frame).toBeInstanceOf(HTMLElement);
      expect(
        (frame as HTMLElement).dataset["rdlGeometry"],
        device.id,
      ).toBeTruthy();
      expect((frame as HTMLElement).dataset["rdlGeometry"], device.id).not.toBe(
        "fallback",
      );
      unmount();
    }
  });
});
