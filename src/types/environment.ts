import type { ReactNode } from "react";

import type { SafeAreaInsets } from "./frame.js";

export type PreviewDirection = "ltr" | "rtl";
export type PreviewContrast = "no-preference" | "more" | "less";
export type PreviewColorScheme = "light" | "dark";
export type PreviewFoldPosture = "flat" | "half-open" | "folded";
export type PreviewPermissionState = "prompt" | "granted" | "denied";

export interface PreviewVirtualKeyboardState {
  readonly visible: boolean;
  readonly height: number;
}

export interface PreviewAccessibilityState {
  readonly screenReader: boolean;
  readonly boldText: boolean;
}

export interface PreviewEnvironment {
  readonly safeArea: SafeAreaInsets;
  readonly virtualKeyboard: PreviewVirtualKeyboardState;
  readonly locale: string;
  readonly direction: PreviewDirection;
  readonly textScale: number;
  readonly contrast: PreviewContrast;
  readonly reducedMotion: boolean;
  readonly colorScheme: PreviewColorScheme;
  readonly pointer: "coarse" | "fine";
  readonly hover: boolean;
  readonly foldPosture: PreviewFoldPosture;
  readonly accessibility: PreviewAccessibilityState;
  readonly permissions: Readonly<Record<string, PreviewPermissionState>>;
}

export interface PreviewEnvironmentOverrides
  extends Partial<
    Omit<
      PreviewEnvironment,
      "safeArea" | "virtualKeyboard" | "accessibility" | "permissions"
    >
  > {
  readonly safeArea?: Partial<SafeAreaInsets>;
  readonly virtualKeyboard?: Partial<PreviewVirtualKeyboardState>;
  readonly accessibility?: Partial<PreviewAccessibilityState>;
  readonly permissions?: Readonly<Record<string, PreviewPermissionState>>;
}

export interface PreviewEnvironmentProviderProps {
  readonly value: PreviewEnvironment;
  readonly children: ReactNode;
}

export interface VirtualKeyboardProps {
  readonly state: PreviewVirtualKeyboardState;
  readonly className?: string;
}
