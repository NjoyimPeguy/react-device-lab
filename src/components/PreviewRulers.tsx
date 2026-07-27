import { useCallback, useMemo, useState } from "react";

import type { ViewportDimensions } from "../types/device.js";

const MINOR_TICK_INTERVAL = 10;
const MAJOR_TICK_INTERVAL = 50;

interface RulerTick {
  readonly position: number;
  readonly major: boolean;
}

interface PointerCoordinates {
  readonly x: number;
  readonly y: number;
}

/** Props for the internal {@link PreviewRulers} overlay. */
interface PreviewRulersProps {
  /** Logical viewport measured in CSS pixels. */
  readonly viewport: ViewportDimensions;
  /**
   * Presentation scale applied by the outer zoom wrapper, used to convert
   * pointer positions into logical coordinates; defaults to `1`.
   */
  readonly scale?: number;
}

function createTicks(size: number): readonly RulerTick[] {
  const ticks: RulerTick[] = [];
  for (
    let position = 0;
    position <= size;
    position += MINOR_TICK_INTERVAL
  ) {
    ticks.push({
      position,
      major: position % MAJOR_TICK_INTERVAL === 0,
    });
  }
  return ticks;
}

function clamp(value: number, maximum: number): number {
  return Math.min(maximum, Math.max(0, value));
}

/**
 * Renders logical-pixel rulers and a measurement crosshair over one viewport.
 *
 * The component is decorative chrome: rulers are `aria-hidden`, tick labels
 * always read logical device pixels regardless of the presentation scale, and
 * the crosshair readout is a polite live region rendered only while the
 * pointer moves over the viewport. The transparent measurement surface
 * captures pointer input over the framed content while rulers are visible.
 * Mounted inside the scaled presentation wrapper so the strip scales visually
 * with zoom.
 *
 * @param props - Logical viewport and presentation scale.
 * @returns The ruler and crosshair overlay.
 */
export function PreviewRulers({ viewport, scale = 1 }: PreviewRulersProps) {
  const horizontalTicks = useMemo(
    () => createTicks(viewport.width),
    [viewport.width],
  );
  const verticalTicks = useMemo(
    () => createTicks(viewport.height),
    [viewport.height],
  );
  const [pointer, setPointer] = useState<PointerCoordinates | null>(null);

  const updatePointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = clamp(
        Math.round((event.clientX - bounds.left) / scale),
        viewport.width,
      );
      const y = clamp(
        Math.round((event.clientY - bounds.top) / scale),
        viewport.height,
      );
      setPointer((current) =>
        current !== null && current.x === x && current.y === y
          ? current
          : { x, y },
      );
    },
    [scale, viewport.height, viewport.width],
  );
  const clearPointer = useCallback(() => setPointer(null), []);

  return (
    <div className="rdl-rulers" data-rdl-rulers="">
      <div aria-hidden="true" className="rdl-rulers__corner" />
      <div
        aria-hidden="true"
        className="rdl-rulers__top"
        data-rdl-ruler="top"
      >
        {horizontalTicks.map((tick) => (
          <span
            className={
              tick.major
                ? "rdl-rulers__tick rdl-rulers__tick--major"
                : "rdl-rulers__tick"
            }
            data-rdl-tick={tick.major ? "major" : "minor"}
            key={tick.position}
            style={{ left: `${tick.position}px` }}
          >
            {tick.major ? (
              <span className="rdl-rulers__label" data-rdl-tick-label="">
                {tick.position}
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="rdl-rulers__left"
        data-rdl-ruler="left"
      >
        {verticalTicks.map((tick) => (
          <span
            className={
              tick.major
                ? "rdl-rulers__tick rdl-rulers__tick--major"
                : "rdl-rulers__tick"
            }
            data-rdl-tick={tick.major ? "major" : "minor"}
            key={tick.position}
            style={{ top: `${tick.position}px` }}
          >
            {tick.major ? (
              <span className="rdl-rulers__label" data-rdl-tick-label="">
                {tick.position}
              </span>
            ) : null}
          </span>
        ))}
      </div>
      {pointer !== null ? (
        <div
          aria-hidden="true"
          className="rdl-rulers__crosshair"
          data-rdl-crosshair=""
        >
          <div
            className="rdl-rulers__crosshair-line rdl-rulers__crosshair-line--vertical"
            data-rdl-crosshair-vertical=""
            style={{ left: `${pointer.x}px` }}
          />
          <div
            className="rdl-rulers__crosshair-line rdl-rulers__crosshair-line--horizontal"
            data-rdl-crosshair-horizontal=""
            style={{ top: `${pointer.y}px` }}
          />
        </div>
      ) : null}
      <div
        className="rdl-rulers__overlay"
        data-rdl-ruler-overlay=""
        onPointerLeave={clearPointer}
        onPointerMove={updatePointer}
      />
      {pointer !== null ? (
        <output
          aria-live="polite"
          className="rdl-rulers__readout"
          data-rdl-coordinate=""
        >
          {pointer.x} × {pointer.y}
        </output>
      ) : null}
    </div>
  );
}
