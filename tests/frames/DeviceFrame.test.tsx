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
    expect(edge.frame).toHaveStyle({ "--rdl-frame-radius": "44px" });
    edge.unmount();

    const ultra = renderFrame("Galaxy S25 Ultra");
    expect(ultra.frame).toHaveAttribute(
      "data-rdl-corner-profile",
      ultra.device.frame.cornerProfile,
    );
    expect(ultra.frame).toHaveStyle({ "--rdl-frame-radius": "25px" });
  });

  it.each([
    ["iPhone SE (3rd generation)", 50, 3],
    ["iPhone 13 mini", 49, 41],
    ["iPhone 16e", 54, 46],
    ["iPhone 17e", 54, 46],
    ["iPhone 17 Pro Max", 56, 48],
  ])(
    "pins the recalibrated %s silhouette radii",
    (name, outerRadius, screenRadius) => {
      const { frame, unmount } = renderFrame(name);
      expect(frame).toHaveStyle({
        "--rdl-frame-radius": `${outerRadius}px`,
        "--rdl-screen-radius": `${screenRadius}px`,
      });
      unmount();
    },
  );

  it("restores home-button body proportions on iPhone SE (3rd generation)", () => {
    const { frame, unmount } = renderFrame("iPhone SE (3rd generation)");
    expect(frame).toHaveStyle({
      "--rdl-bezel-top": "96px",
      "--rdl-bezel-right": "24px",
      "--rdl-bezel-bottom": "96px",
      "--rdl-bezel-left": "24px",
    });
    unmount();
  });

  it.each([
    ["iPhone 13 mini", 150],
    ["iPhone 16e", 146],
    ["iPhone 17e", 146],
    ["iPhone 17 Pro Max", 92],
  ])("pins the recalibrated %s cutout width", (name, cutoutWidth) => {
    const { frame, unmount } = renderFrame(name);
    expect(frame).toHaveStyle({ "--rdl-cutout-width": `${cutoutWidth}px` });
    unmount();
  });

  it.each([
    ["iPad (10th generation)", 75, 18],
    ["iPad (A16)", 75, 18],
    ["iPad mini (A17 Pro)", 80, 18],
    ["iPad Air 11-inch", 73, 18],
    ["iPad Air 13-inch", 66, 18],
    ["iPad Pro 11-inch", 63, 18],
    ["iPad Pro 13-inch", 63, 18],
    ["Galaxy S21", 34, 26],
    ["Galaxy S25 Edge", 44, 36],
    ["Galaxy S26 Ultra", 40, 30],
    ["Galaxy A57", 34, 26],
    ["Galaxy Z Flip 7 — unfolded", 38, 32],
    ["Galaxy Z Flip 8 — unfolded", 38, 32],
    ["Galaxy Z Fold 6 — cover", 26, 20],
    ["Galaxy Z Fold 7 — cover", 22, 16],
    ["Galaxy Z Fold 8 — cover", 22, 16],
    ["Galaxy Z Fold 8 Ultra — cover", 22, 16],
    ["Galaxy Tab S9", 15, 10],
    ["Galaxy Tab S10+", 17, 11],
    ["Galaxy Tab S10 Ultra", 18, 11],
    ["Galaxy Tab S11 Ultra", 18, 11],
    ["Pixel 8 Pro", 52, 44],
    ["Pixel 9 Pro", 57, 49],
    ["Pixel 9 Pro XL", 56, 48],
    ["Pixel 10 Pro", 58, 50],
    ["Pixel 10 Pro XL", 57, 49],
    ["Pixel 10 Pro Fold — unfolded", 34, 27],
  ])(
    "pins the recalibrated %s silhouette radii",
    (name, outerRadius, screenRadius) => {
      const { frame, unmount } = renderFrame(name);
      expect(frame).toHaveStyle({
        "--rdl-frame-radius": `${outerRadius}px`,
        "--rdl-screen-radius": `${screenRadius}px`,
      });
      unmount();
    },
  );

  it.each([
    ["iPad (10th generation)", 57, 57, 57, 57],
    ["iPad mini (A17 Pro)", 62, 62, 62, 62],
    ["iPad Air 13-inch", 48, 48, 48, 48],
    ["iPad Pro 11-inch", 45, 45, 45, 45],
    ["Galaxy S9+", 26, 8, 26, 8],
    ["Galaxy S21", 12, 10, 12, 10],
    ["Galaxy A55", 14, 12, 19, 12],
    ["Galaxy A56", 9, 8, 9, 8],
    ["Galaxy Z Flip 6 — cover", 16, 26, 26, 26],
    ["Galaxy Z Flip 7 — cover", 20, 16, 20, 16],
    ["Galaxy Z Flip 8 — cover", 20, 16, 20, 16],
    ["Galaxy Z Flip 8 — unfolded", 16, 16, 16, 16],
    ["Galaxy Z Fold 6 — cover", 22, 28, 22, 28],
    ["Galaxy Z Fold 8 — unfolded", 24, 24, 24, 24],
    ["Galaxy Z Fold 8 Ultra — unfolded", 26, 26, 26, 26],
    ["Galaxy Tab S9", 22, 22, 22, 22],
    ["Galaxy Tab S10 Ultra", 23, 23, 23, 23],
    ["Pixel 8a", 8, 8, 8, 8],
    ["Pixel 9a", 8, 8, 8, 8],
  ])(
    "pins the recalibrated %s bezel insets",
    (name, top, right, bottom, left) => {
      const { frame, unmount } = renderFrame(name);
      expect(frame).toHaveStyle({
        "--rdl-bezel-top": `${top}px`,
        "--rdl-bezel-right": `${right}px`,
        "--rdl-bezel-bottom": `${bottom}px`,
        "--rdl-bezel-left": `${left}px`,
      });
      unmount();
    },
  );

  it.each([
    ["Galaxy Z Flip 6 — cover", 144, 60],
    ["Galaxy Z Flip 8 — cover", 82, 36],
    ["Galaxy Z Fold 7 — cover", 16, 16],
    ["Galaxy Z Fold 8 — unfolded", 18, 18],
    ["Galaxy Tab S9", 12, 12],
    ["Galaxy Tab S10 Ultra", 105, 13],
    ["Galaxy Tab S11 Ultra", 52, 17],
    ["iPad (10th generation)", 14, 14],
    ["iPad mini (A17 Pro)", 16, 16],
  ])(
    "pins the recalibrated %s cutout size",
    (name, cutoutWidth, cutoutHeight) => {
      const { frame, unmount } = renderFrame(name);
      expect(frame).toHaveStyle({
        "--rdl-cutout-width": `${cutoutWidth}px`,
        "--rdl-cutout-height": `${cutoutHeight}px`,
      });
      unmount();
    },
  );

  it("rounds the Galaxy S25 Ultra rail like the real hardware", () => {
    const s25Ultra = renderFrame("Galaxy S25 Ultra");
    expect(s25Ultra.frame).toHaveAttribute(
      "data-rdl-corner-profile",
      "rounded",
    );
    s25Ultra.unmount();

    const s24Ultra = renderFrame("Galaxy S24 Ultra");
    expect(s24Ultra.frame).toHaveAttribute(
      "data-rdl-corner-profile",
      "rounded-compact",
    );
    s24Ultra.unmount();

    const s26Ultra = renderFrame("Galaxy S26 Ultra");
    expect(s26Ultra.frame).toHaveAttribute(
      "data-rdl-corner-profile",
      "rounded",
    );
    s26Ultra.unmount();
  });

  it("hides the under-display camera on Galaxy Z Fold 6 — unfolded", () => {
    const { frame, device, unmount } = renderFrame(
      "Galaxy Z Fold 6 — unfolded",
    );
    expect(device.frame.cutout).toBe("none");
    expect(
      frame.querySelector('[data-rdl-feature="punch-hole"]'),
    ).not.toBeInTheDocument();
    expect(
      frame.querySelector('[data-rdl-feature="fold-crease"]'),
    ).toBeInTheDocument();
    unmount();
  });

  it("emits the calibrated tone for representative devices", () => {
    const expectations: Array<[string, string]> = [
      ["iPhone SE (3rd generation)", "silver"],
      ["iPhone 13 mini", "graphite"],
      ["iPhone 15 Pro", "titanium-light"],
      ["iPhone 15 Pro Max", "titanium-light"],
      ["iPhone 16 Pro", "titanium-light"],
      ["iPhone 16 Pro Max", "titanium-light"],
      ["iPhone Air", "titanium-light"],
      ["iPhone 17 Pro", "silver"],
      ["iPhone 17 Pro Max", "silver"],
      ["iPad mini (A17 Pro)", "graphite"],
      ["iPad Air 11-inch", "graphite"],
      ["iPad Pro 13-inch", "graphite"],
      ["Galaxy S24 Ultra", "titanium-dark"],
      ["Galaxy S25", "silver"],
      ["Galaxy S25 Edge", "titanium-light"],
      ["Galaxy S25 Ultra", "titanium-dark"],
      ["Galaxy A56", "silver"],
      ["Galaxy Z Flip 6 — unfolded", "silver"],
      ["Galaxy Z Fold 6 — unfolded", "silver"],
      ["Galaxy Z Fold 7 — unfolded", "graphite"],
      ["Galaxy Tab S9", "graphite"],
      ["Galaxy Tab S10+", "graphite"],
      ["Pixel 8 Pro", "porcelain"],
      ["Pixel 9a", "porcelain"],
      ["Pixel 10 Pro", "porcelain"],
      ["Pixel 10a", "silver"],
      ["Pixel 10 Pro Fold — unfolded", "porcelain"],
      ["Pixel Tablet", "porcelain"],
      ["MacBook Air 13-inch", "silver"],
      ["Windows laptop", "graphite"],
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
