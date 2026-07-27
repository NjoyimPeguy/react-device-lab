import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DEVICE_PRESETS,
  DeviceFrame,
  DevicePreviewLab,
  type DevicePreset,
} from "../../src/index.js";
import { PreviewRulers } from "../../src/components/PreviewRulers.js";

const VIEWPORT = { width: 400, height: 800 } as const;
const DEFAULT_DEVICE = DEVICE_PRESETS[0] as DevicePreset;

function pointerMove(target: Element, x: number, y: number) {
  fireEvent(
    target,
    new MouseEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    }),
  );
}

function pointerLeave(target: Element) {
  fireEvent(target, new MouseEvent("pointerout", { bubbles: true }));
}

function rulerTicks(container: HTMLElement, ruler: "top" | "left") {
  const strip = container.querySelector(`[data-rdl-ruler="${ruler}"]`);
  expect(strip).toBeInstanceOf(HTMLElement);
  return {
    all: (strip as Element).querySelectorAll("[data-rdl-tick]"),
    major: (strip as Element).querySelectorAll('[data-rdl-tick="major"]'),
    labels: [...(strip as Element).querySelectorAll("[data-rdl-tick-label]")].map(
      (node) => node.textContent,
    ),
  };
}

describe("PreviewRulers", () => {
  it("renders minor ticks every 10 px and labeled majors every 50 px", () => {
    const { container } = render(
      <PreviewRulers scale={1} viewport={VIEWPORT} />,
    );

    const top = rulerTicks(container, "top");
    expect(top.all).toHaveLength(41);
    expect(top.major).toHaveLength(9);
    expect(top.labels).toEqual([
      "0",
      "50",
      "100",
      "150",
      "200",
      "250",
      "300",
      "350",
      "400",
    ]);

    const left = rulerTicks(container, "left");
    expect(left.all).toHaveLength(81);
    expect(left.major).toHaveLength(17);
    expect(left.labels[0]).toBe("0");
    expect(left.labels[16]).toBe("800");

    expect(
      container.querySelector('[data-rdl-ruler="top"]'),
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      container.querySelector('[data-rdl-ruler="left"]'),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it.each([0.5, 1, 2])(
    "keeps tick counts and logical labels identical at scale %s",
    (scale) => {
      const { container } = render(
        <PreviewRulers scale={scale} viewport={VIEWPORT} />,
      );

      expect(rulerTicks(container, "top").all).toHaveLength(41);
      expect(rulerTicks(container, "top").labels[8]).toBe("400");
      expect(rulerTicks(container, "left").all).toHaveLength(81);

      const lastMajor = container.querySelector(
        '[data-rdl-ruler="top"] [data-rdl-tick="major"]:last-child',
      );
      expect(lastMajor).toHaveStyle({ left: "400px" });
    },
  );

  it("positions the origin at the viewport top-left corner", () => {
    const { container } = render(
      <PreviewRulers scale={1} viewport={VIEWPORT} />,
    );

    const firstTopTick = container.querySelector(
      '[data-rdl-ruler="top"] [data-rdl-tick]',
    );
    const firstLeftTick = container.querySelector(
      '[data-rdl-ruler="left"] [data-rdl-tick]',
    );
    expect(firstTopTick).toHaveStyle({ left: "0px" });
    expect(firstLeftTick).toHaveStyle({ top: "0px" });
  });

  it("converts pointer positions into logical coordinates", () => {
    const { container } = render(
      <PreviewRulers scale={0.5} viewport={VIEWPORT} />,
    );
    const overlay = container.querySelector("[data-rdl-ruler-overlay]");
    expect(overlay).toBeInstanceOf(HTMLElement);

    pointerMove(overlay as Element, 50, 120);

    const readout = screen.getByText("100 × 240");
    expect(readout).toHaveAttribute("aria-live", "polite");
    expect(
      container.querySelector("[data-rdl-crosshair-vertical]"),
    ).toHaveStyle({ left: "100px" });
    expect(
      container.querySelector("[data-rdl-crosshair-horizontal]"),
    ).toHaveStyle({ top: "240px" });
  });

  it("clamps the readout to the logical viewport", () => {
    const { container } = render(
      <PreviewRulers scale={0.5} viewport={VIEWPORT} />,
    );
    const overlay = container.querySelector(
      "[data-rdl-ruler-overlay]",
    ) as Element;

    pointerMove(overlay, 500, -40);

    expect(screen.getByText("400 × 0")).toBeInTheDocument();
  });

  it("hides the crosshair and readout when the pointer leaves", () => {
    const { container } = render(
      <PreviewRulers scale={1} viewport={VIEWPORT} />,
    );
    const overlay = container.querySelector(
      "[data-rdl-ruler-overlay]",
    ) as Element;

    pointerMove(overlay, 50, 120);
    expect(screen.getByText("50 × 120")).toBeInTheDocument();

    pointerLeave(overlay);
    expect(screen.queryByText("50 × 120")).toBeNull();
    expect(container.querySelector("[data-rdl-crosshair]")).toBeNull();
  });
});

describe("DeviceFrame ruler mount", () => {
  it("renders no ruler markup when rulers are disabled", () => {
    const { container } = render(
      <DeviceFrame device={DEFAULT_DEVICE}>Framed content</DeviceFrame>,
    );

    expect(container.querySelector("[data-rdl-rulers]")).toBeNull();
    expect(container.querySelector("[data-rdl-ruler-overlay]")).toBeNull();
  });

  it("mounts rulers inside the viewport region when enabled", () => {
    render(
      <DeviceFrame device={DEFAULT_DEVICE} presentationScale={1} showRulers>
        Framed content
      </DeviceFrame>,
    );

    const viewport = screen.getByRole("region", {
      name: `${DEFAULT_DEVICE.name} application preview`,
    });
    expect(viewport.querySelector("[data-rdl-rulers]")).not.toBeNull();
  });
});

describe("DevicePreviewLab ruler wiring", () => {
  it("toggles rulers from the configuration panel without layout markup when off", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DevicePreviewLab
        defaultCustomViewport={VIEWPORT}
        defaultViewportMode="custom"
        src="https://app.example.test/"
      />,
    );

    expect(container.querySelector("[data-rdl-rulers]")).toBeNull();

    await user.click(screen.getByRole("checkbox", { name: "Show rulers" }));

    expect(container.querySelector("[data-rdl-rulers]")).not.toBeNull();
    expect(rulerTicks(container, "top").all).toHaveLength(41);
    expect(rulerTicks(container, "left").all).toHaveLength(81);

    const overlay = container.querySelector(
      "[data-rdl-ruler-overlay]",
    ) as Element;
    pointerMove(overlay, 50, 120);
    expect(screen.getByText("50 × 120")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Show rulers" }));
    expect(container.querySelector("[data-rdl-rulers]")).toBeNull();
    expect(screen.queryByText("50 × 120")).toBeNull();
  });

  it("supports controlled ruler visibility", async () => {
    const user = userEvent.setup();
    const onShowRulersChange = vi.fn();
    const { container } = render(
      <DevicePreviewLab
        onShowRulersChange={onShowRulersChange}
        showRulers
        src="https://app.example.test/"
      />,
    );

    expect(container.querySelector("[data-rdl-rulers]")).not.toBeNull();

    await user.click(screen.getByRole("checkbox", { name: "Show rulers" }));

    expect(onShowRulersChange).toHaveBeenCalledWith(false);
    expect(container.querySelector("[data-rdl-rulers]")).not.toBeNull();
  });
});
