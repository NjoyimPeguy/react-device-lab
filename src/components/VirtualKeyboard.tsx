import type { VirtualKeyboardProps } from "../types/environment.js";

const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["⇧", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
] as const;

/**
 * Renders a decorative virtual-keyboard overlay for layout review.
 *
 * This component does not capture input or emulate a native keyboard.
 *
 * @param props - Keyboard visibility, height, and optional class.
 * @returns The keyboard visualization, or `null` when hidden.
 *
 * @example
 * ```tsx
 * <VirtualKeyboard state={{ visible: true, height: 300 }} />
 * ```
 */
export function VirtualKeyboard({
  state,
  className,
}: VirtualKeyboardProps) {
  if (!state.visible || state.height <= 0) return null;

  const classes = ["rdl-virtual-keyboard", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-hidden="true"
      className={classes}
      data-rdl-virtual-keyboard-overlay=""
      style={{ height: `${state.height}px` }}
    >
      <div className="rdl-virtual-keyboard__keys">
        {KEY_ROWS.map((row, rowIndex) => (
          <div className="rdl-virtual-keyboard__row" key={rowIndex}>
            {row.map((key) => (
              <span className="rdl-virtual-keyboard__key" key={key}>
                {key}
              </span>
            ))}
          </div>
        ))}
        <div className="rdl-virtual-keyboard__row">
          <span className="rdl-virtual-keyboard__key rdl-virtual-keyboard__key--mode">
            123
          </span>
          <span className="rdl-virtual-keyboard__key rdl-virtual-keyboard__key--space" />
          <span className="rdl-virtual-keyboard__key rdl-virtual-keyboard__key--mode">
            Return
          </span>
        </div>
      </div>
    </div>
  );
}
