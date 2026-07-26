import type { ReactNode } from "react";

import type { SafeAreaInsets } from "./frame.js";

/** Text flow direction applied to portal preview content. */
export type PreviewDirection = "ltr" | "rtl";
/** Requested contrast preference for preview styling. */
export type PreviewContrast = "no-preference" | "more" | "less";
/** Requested light or dark color scheme for preview content. */
export type PreviewColorScheme = "light" | "dark";
/** Simulated posture exposed to fold-aware preview content. */
export type PreviewFoldPosture = "flat" | "half-open" | "folded";
/** Simulated result for a named browser permission. */
export type PreviewPermissionState = "prompt" | "granted" | "denied";

/**
 * Visual state of the optional preview-only virtual keyboard.
 *
 * Height must be between 0 and 4096 CSS pixels.
 */
export interface PreviewVirtualKeyboardState {
  /** Whether the keyboard visualization is shown; defaults to `false`. */
  readonly visible: boolean;
  /** Keyboard overlay height in CSS pixels; defaults to `0`. */
  readonly height: number;
}

/** Accessibility preferences exposed by the preview environment adapter. */
export interface PreviewAccessibilityState {
  /**
   * Whether content should represent a screen-reader review scenario.
   *
   * This is application state only, does not emulate assistive technology, and
   * defaults to `false`.
   */
  readonly screenReader: boolean;
  /** Whether content should request heavier text where supported; defaults to `false`. */
  readonly boldText: boolean;
}

/**
 * Complete deterministic environment supplied to preview content.
 *
 * These values provide styling and application-test signals. They do not
 * replace browser permission prompts, native accessibility services, or
 * hardware APIs.
 */
export interface PreviewEnvironment {
  /** Insets from 0–4096 CSS pixels; every edge defaults to `0`. */
  readonly safeArea: SafeAreaInsets;
  /** Preview-only virtual keyboard state; defaults to hidden at zero height. */
  readonly virtualKeyboard: PreviewVirtualKeyboardState;
  /**
   * Language identifier assigned to `documentElement.lang`; defaults to
   * `"en"` and accepts 1–35 ASCII letters, digits, or hyphens.
   */
  readonly locale: string;
  /** Text flow direction; defaults to `"ltr"`. */
  readonly direction: PreviewDirection;
  /** Text-size multiplier from 0.5–3; defaults to `1`. */
  readonly textScale: number;
  /** Requested contrast preference; defaults to `"no-preference"`. */
  readonly contrast: PreviewContrast;
  /** Whether preview content should reduce non-essential motion; defaults to `false`. */
  readonly reducedMotion: boolean;
  /** Requested content color scheme; defaults to `"light"`. */
  readonly colorScheme: PreviewColorScheme;
  /** Primary-pointer precision; defaults to `"coarse"`. */
  readonly pointer: "coarse" | "fine";
  /** Whether the scenario has a primary hover capability; defaults to `false`. */
  readonly hover: boolean;
  /** Fold posture selected for cooperating content; defaults to `"flat"`. */
  readonly foldPosture: PreviewFoldPosture;
  /** Preview-only accessibility preferences; both flags default to `false`. */
  readonly accessibility: PreviewAccessibilityState;
  /**
   * Named preview permission states; defaults to an empty map.
   *
   * Names must start with a lowercase ASCII letter, contain at most 64
   * lowercase letters, digits, or hyphens, and cannot be `constructor` or
   * `prototype`.
   */
  readonly permissions: Readonly<Record<string, PreviewPermissionState>>;
}

/** Partial input accepted when creating or overriding an environment. */
export interface PreviewEnvironmentOverrides
  extends Partial<
    Omit<
      PreviewEnvironment,
      "safeArea" | "virtualKeyboard" | "accessibility" | "permissions"
    >
  > {
  /** Safe-area values to merge with the current or default insets. */
  readonly safeArea?: Partial<SafeAreaInsets>;
  /** Virtual-keyboard values to merge with the current or default state. */
  readonly virtualKeyboard?: Partial<PreviewVirtualKeyboardState>;
  /** Accessibility values to merge with the current or default state. */
  readonly accessibility?: Partial<PreviewAccessibilityState>;
  /** Permission states to merge with the current or default map. */
  readonly permissions?: Readonly<Record<string, PreviewPermissionState>>;
}

/** Props for {@link PreviewEnvironmentProvider}. */
export interface PreviewEnvironmentProviderProps {
  /** Complete environment made available through React context. */
  readonly value: PreviewEnvironment;
  /** React subtree that can read the environment. */
  readonly children: ReactNode;
}

/** Props for the preview-only {@link VirtualKeyboard} visualization. */
export interface VirtualKeyboardProps {
  /** Visibility and height of the keyboard visualization. */
  readonly state: PreviewVirtualKeyboardState;
  /** Optional class added to the keyboard root. */
  readonly className?: string;
}
