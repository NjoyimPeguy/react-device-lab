import { useEffect, useRef } from "react";

import type { PreviewShortcuts } from "../types/lab.js";

/**
 * Callbacks invoked by {@link usePreviewShortcuts} when a bound key is
 * pressed. Each callback mirrors one controllable preview action.
 */
export interface UsePreviewShortcutsCallbacks {
  /** Rotate the viewport orientation. */
  readonly onRotate: () => void;
  /** Select the previous device in catalog order. */
  readonly onPreviousDevice: () => void;
  /** Select the next device in catalog order. */
  readonly onNextDevice: () => void;
  /** Increase the visual scale one step. */
  readonly onZoomIn: () => void;
  /** Decrease the visual scale one step. */
  readonly onZoomOut: () => void;
  /** Reset the visual scale to Fit. */
  readonly onZoomReset: () => void;
  /** Toggle device-frame visibility. */
  readonly onToggleFrame: () => void;
}

/** Options accepted by {@link usePreviewShortcuts}. */
export interface UsePreviewShortcutsOptions {
  /** Whether the keydown listener is attached; defaults to `true`. */
  readonly enabled?: boolean;
  /**
   * Per-action key overrides. An omitted action keeps its default key and a
   * `null` value removes that binding. An override that collides with a key
   * a default binding still holds wins the key, leaving the default action
   * unbound.
   */
  readonly bindings?: PreviewShortcuts;
  /** Actions invoked for each bound key. */
  readonly callbacks: UsePreviewShortcutsCallbacks;
}

type PreviewShortcutAction = keyof Required<PreviewShortcuts>;

const DEFAULT_BINDINGS: Readonly<
  Record<PreviewShortcutAction, string>
> = {
  rotate: "r",
  previousDevice: "[",
  nextDevice: "]",
  zoomIn: "+",
  zoomOut: "-",
  zoomReset: "0",
  toggleFrame: "f",
};

const CALLBACK_NAMES: Readonly<
  Record<PreviewShortcutAction, keyof UsePreviewShortcutsCallbacks>
> = {
  rotate: "onRotate",
  previousDevice: "onPreviousDevice",
  nextDevice: "onNextDevice",
  zoomIn: "onZoomIn",
  zoomOut: "onZoomOut",
  zoomReset: "onZoomReset",
  toggleFrame: "onToggleFrame",
};

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

function resolveKeymap(
  bindings: PreviewShortcuts | undefined,
): ReadonlyMap<string, keyof UsePreviewShortcutsCallbacks> {
  const keymap = new Map<string, keyof UsePreviewShortcutsCallbacks>();
  const actions = Object.keys(DEFAULT_BINDINGS) as PreviewShortcutAction[];
  // Defaults land first so an explicit override wins a key collision; the
  // displaced default action keeps no key.
  for (const action of actions) {
    if (bindings?.[action] === undefined) {
      keymap.set(
        normalizeKey(DEFAULT_BINDINGS[action]),
        CALLBACK_NAMES[action],
      );
    }
  }
  for (const action of actions) {
    const override = bindings?.[action];
    if (override !== undefined && override !== null && override !== "") {
      keymap.set(normalizeKey(override), CALLBACK_NAMES[action]);
    }
  }
  return keymap;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("input, select, textarea") !== null) return true;
  const editable = target.closest("[contenteditable]");
  return (
    editable !== null && editable.getAttribute("contenteditable") !== "false"
  );
}

/**
 * Binds plain-key keyboard shortcuts to preview actions.
 *
 * One `keydown` listener is attached to `window` while the component is
 * mounted and `enabled`. Bindings match only modifier-free keys: Control,
 * Meta, or Alt shortcut the browser and are ignored, while Shift remains
 * allowed so shifted symbols such as `"+"` keep working and single-letter
 * bindings match either letter case. Events dispatched from an input, select,
 * textarea, or contenteditable element — and events whose default was already
 * prevented — are ignored. The hook reads no browser global outside effects
 * and removes its listener on unmount.
 *
 * Default keymap: `"r"` rotates the viewport, `"["` and `"]"` cycle devices,
 * `"+"` and `"-"` step the visual scale, `"0"` resets the scale to Fit, and
 * `"f"` toggles the device frame.
 *
 * @param options - Enablement, per-action key overrides, and callbacks.
 *
 * @example
 * ```tsx
 * usePreviewShortcuts({
 *   bindings: { toggleFrame: null },
 *   callbacks: {
 *     onRotate: () => setOrientation(next(orientation)),
 *     onPreviousDevice: () => cycle(-1),
 *     onNextDevice: () => cycle(1),
 *     onZoomIn: () => setZoom(zoom + 0.1),
 *     onZoomOut: () => setZoom(zoom - 0.1),
 *     onZoomReset: () => setZoom("fit"),
 *     onToggleFrame: () => setFrameVisible(!frameVisible),
 *   },
 * });
 * ```
 */
export function usePreviewShortcuts(
  options: UsePreviewShortcutsOptions,
): void {
  const { enabled = true, bindings, callbacks } = options;
  const latestRef = useRef({ callbacks, keymap: resolveKeymap(bindings) });

  useEffect(() => {
    latestRef.current = { callbacks, keymap: resolveKeymap(bindings) };
  });

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const callbackName = latestRef.current.keymap.get(
        normalizeKey(event.key),
      );
      if (callbackName !== undefined) {
        latestRef.current.callbacks[callbackName]();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
