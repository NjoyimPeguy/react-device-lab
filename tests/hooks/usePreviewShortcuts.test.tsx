import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  usePreviewShortcuts,
  type UsePreviewShortcutsCallbacks,
  type UsePreviewShortcutsOptions,
} from "../../src/hooks/usePreviewShortcuts.js";

function createCallbacks() {
  return {
    onRotate: vi.fn(),
    onPreviousDevice: vi.fn(),
    onNextDevice: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomReset: vi.fn(),
    onToggleFrame: vi.fn(),
  } satisfies UsePreviewShortcutsCallbacks;
}

interface HarnessProps {
  readonly callbacks: UsePreviewShortcutsCallbacks;
  readonly enabled?: boolean;
  readonly bindings?: UsePreviewShortcutsOptions["bindings"];
}

function Harness({ callbacks, enabled, bindings }: HarnessProps) {
  usePreviewShortcuts({
    callbacks,
    ...(enabled !== undefined ? { enabled } : {}),
    ...(bindings !== undefined ? { bindings } : {}),
  });
  return null;
}

function GuardHarness({ callbacks }: HarnessProps) {
  usePreviewShortcuts({ callbacks });
  return (
    <form>
      <input aria-label="Text field" />
      <select aria-label="Select field" />
      <textarea aria-label="Text area" />
      <div aria-label="Editable region" contentEditable={true} />
    </form>
  );
}

function press(
  key: string,
  init: KeyboardEventInit = {},
  target: EventTarget = window,
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

describe("usePreviewShortcuts", () => {
  it.each([
    ["r", "onRotate"],
    ["[", "onPreviousDevice"],
    ["]", "onNextDevice"],
    ["+", "onZoomIn"],
    ["-", "onZoomOut"],
    ["0", "onZoomReset"],
    ["f", "onToggleFrame"],
  ] as const)("pressing %s calls only %s", (key, callbackName) => {
    const callbacks = createCallbacks();
    render(<Harness callbacks={callbacks} />);

    press(key);

    for (const [name, callback] of Object.entries(callbacks)) {
      if (name === callbackName) {
        expect(callback).toHaveBeenCalledTimes(1);
      } else {
        expect(callback).not.toHaveBeenCalled();
      }
    }
  });

  it("matches single-letter bindings in either letter case", () => {
    const callbacks = createCallbacks();
    render(<Harness callbacks={callbacks} />);

    press("R");
    press("+", { shiftKey: true });

    expect(callbacks.onRotate).toHaveBeenCalledTimes(1);
    expect(callbacks.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }] as const)(
    "ignores bindings pressed with %s",
    (modifier) => {
      const callbacks = createCallbacks();
      render(<Harness callbacks={callbacks} />);

      press("r", modifier);
      press("f", modifier);

      for (const callback of Object.values(callbacks)) {
        expect(callback).not.toHaveBeenCalled();
      }
    },
  );

  it.each([
    ["Text field"],
    ["Select field"],
    ["Text area"],
    ["Editable region"],
  ] as const)("ignores keydown from a %s typing context", (label) => {
    const callbacks = createCallbacks();
    const { getByLabelText } = render(<GuardHarness callbacks={callbacks} />);

    press("r", {}, getByLabelText(label));
    press("f", {}, getByLabelText(label));

    for (const callback of Object.values(callbacks)) {
      expect(callback).not.toHaveBeenCalled();
    }
  });

  it("ignores events whose default is already prevented", () => {
    const callbacks = createCallbacks();
    render(<Harness callbacks={callbacks} />);

    const event = new KeyboardEvent("keydown", {
      key: "r",
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    window.dispatchEvent(event);

    expect(callbacks.onRotate).not.toHaveBeenCalled();
  });

  it("overrides an individual binding and removes a binding with null", () => {
    const callbacks = createCallbacks();
    render(
      <Harness
        bindings={{ rotate: "o", toggleFrame: null }}
        callbacks={callbacks}
      />,
    );

    press("o");
    expect(callbacks.onRotate).toHaveBeenCalledTimes(1);

    press("r");
    expect(callbacks.onRotate).toHaveBeenCalledTimes(1);

    press("f");
    expect(callbacks.onToggleFrame).not.toHaveBeenCalled();

    press("]");
    expect(callbacks.onNextDevice).toHaveBeenCalledTimes(1);
  });

  it("lets a consumer override win a key held by a default binding", () => {
    const callbacks = createCallbacks();
    render(<Harness bindings={{ rotate: "f" }} callbacks={callbacks} />);

    press("f");
    expect(callbacks.onRotate).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleFrame).not.toHaveBeenCalled();

    press("r");
    expect(callbacks.onRotate).toHaveBeenCalledTimes(1);
  });

  it("attaches no listener while disabled and attaches once enabled", () => {
    const callbacks = createCallbacks();
    const { rerender } = render(
      <Harness callbacks={callbacks} enabled={false} />,
    );

    press("r");
    expect(callbacks.onRotate).not.toHaveBeenCalled();

    rerender(<Harness callbacks={callbacks} enabled={true} />);
    press("r");
    expect(callbacks.onRotate).toHaveBeenCalledTimes(1);
  });

  it("invokes the latest callbacks after a rerender", () => {
    const firstCallbacks = createCallbacks();
    const nextCallbacks = createCallbacks();
    const { rerender } = render(<Harness callbacks={firstCallbacks} />);

    rerender(<Harness callbacks={nextCallbacks} />);
    press("r");

    expect(firstCallbacks.onRotate).not.toHaveBeenCalled();
    expect(nextCallbacks.onRotate).toHaveBeenCalledTimes(1);
  });

  it("removes the keydown listener on unmount", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const callbacks = createCallbacks();
    const { unmount } = render(<Harness callbacks={callbacks} />);

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
    press("r");
    expect(callbacks.onRotate).not.toHaveBeenCalled();
    removeEventListener.mockRestore();
  });
});
