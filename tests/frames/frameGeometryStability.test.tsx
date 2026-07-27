import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DEVICE_PRESETS,
  DeviceFrame,
  getDeviceFrameDimensions,
  type DeviceOrientation,
} from "../../src/index.js";
import type { DeviceFrameGeometry } from "../../src/frames/frameGeometry.js";

type ShellTone = DeviceFrameGeometry["shellTone"];

/**
 * Tones a `MODEL_OVERRIDES` entry may select. The titanium and porcelain
 * values intentionally fail type checking until `GeometryValues.shellTone`
 * is widened beyond the original graphite/silver pair.
 */
const SELECTABLE_SHELL_TONES = [
  "graphite",
  "silver",
  "titanium-dark",
  "titanium-light",
  "porcelain",
] as const satisfies readonly ShellTone[];

const ORIENTATIONS: readonly DeviceOrientation[] = ["portrait", "landscape"];

const GEOMETRY_VARIABLES = [
  "--rdl-bezel-top",
  "--rdl-bezel-right",
  "--rdl-bezel-bottom",
  "--rdl-bezel-left",
  "--rdl-cutout-height",
  "--rdl-cutout-offset",
  "--rdl-cutout-width",
  "--rdl-extension-height",
  "--rdl-frame-overhang",
  "--rdl-frame-radius",
  "--rdl-screen-radius",
  "--rdl-shell-height",
  "--rdl-shell-width",
] as const;

interface OrientationRecord {
  readonly dimensionsVisible: { readonly width: number; readonly height: number };
  readonly dimensionsHidden: { readonly width: number; readonly height: number };
  readonly tone: string | undefined;
  readonly geometryId: string | undefined;
  readonly cornerProfile: string | undefined;
  readonly cutoutMount: string | undefined;
  readonly variables: Record<string, string>;
}

describe("frame geometry stability", () => {
  it("keeps dimensions and rendered geometry unchanged for every preset", () => {
    const records = DEVICE_PRESETS.map((device) => {
      const orientations: Record<string, OrientationRecord> = {};
      for (const orientation of ORIENTATIONS) {
        const label = `${device.id} (${orientation})`;
        const { unmount } = render(
          <DeviceFrame
            device={device}
            contentLabel={label}
            orientation={orientation}
          >
            Content
          </DeviceFrame>,
        );
        const frame = screen
          .getByRole("region", { name: label })
          .closest("[data-rdl-device-frame]");
        expect(frame, label).toBeInstanceOf(HTMLElement);
        const element = frame as HTMLElement;
        const tone = element.dataset["rdlShellTone"];
        expect(
          (SELECTABLE_SHELL_TONES as readonly string[]).includes(tone ?? ""),
          label,
        ).toBe(true);
        const variables: Record<string, string> = {};
        for (const name of GEOMETRY_VARIABLES) {
          variables[name] = element.style.getPropertyValue(name);
        }
        orientations[orientation] = {
          dimensionsVisible: getDeviceFrameDimensions(device, orientation, true),
          dimensionsHidden: getDeviceFrameDimensions(
            device,
            orientation,
            false,
          ),
          tone,
          geometryId: element.dataset["rdlGeometry"],
          cornerProfile: element.dataset["rdlCornerProfile"],
          cutoutMount: element.dataset["rdlCutoutMount"],
          variables,
        };
        unmount();
      }
      return { id: device.id, ...orientations };
    });

    expect(records).toHaveLength(85);
    expect(records).toMatchSnapshot();
  });
});
