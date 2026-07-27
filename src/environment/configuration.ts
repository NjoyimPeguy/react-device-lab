import type { SafeAreaInsets } from "../types/frame.js";
import type {
  PreviewAccessibilityState,
  PreviewEnvironment,
  PreviewEnvironmentOverrides,
  PreviewPermissionState,
  PreviewVirtualKeyboardState,
} from "../types/environment.js";
import type { PreviewConfiguration } from "../types/preview.js";

const SAFE_AREA_DEFAULT: SafeAreaInsets = Object.freeze({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

const VIRTUAL_KEYBOARD_DEFAULT: PreviewVirtualKeyboardState = Object.freeze({
  visible: false,
  height: 0,
});

const ACCESSIBILITY_DEFAULT: PreviewAccessibilityState = Object.freeze({
  screenReader: false,
  boldText: false,
});

function freezeEnvironment(environment: PreviewEnvironment): PreviewEnvironment {
  return Object.freeze({
    ...environment,
    safeArea: Object.freeze({ ...environment.safeArea }),
    virtualKeyboard: Object.freeze({ ...environment.virtualKeyboard }),
    accessibility: Object.freeze({ ...environment.accessibility }),
    permissions: Object.freeze({ ...environment.permissions }),
  });
}

/** Immutable neutral baseline used when environment values are omitted. */
export const DEFAULT_PREVIEW_ENVIRONMENT: PreviewEnvironment =
  freezeEnvironment({
    safeArea: SAFE_AREA_DEFAULT,
    virtualKeyboard: VIRTUAL_KEYBOARD_DEFAULT,
    locale: "en",
    direction: "ltr",
    textScale: 1,
    contrast: "no-preference",
    reducedMotion: false,
    colorScheme: "light",
    pointer: "coarse",
    hover: false,
    foldPosture: "flat",
    accessibility: ACCESSIBILITY_DEFAULT,
    permissions: {},
  });

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: UnknownRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isBoundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isSafeArea(value: unknown): value is SafeAreaInsets {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["top", "right", "bottom", "left"]) &&
    Object.values(value).every((inset) => isBoundedNumber(inset, 0, 4096))
  );
}

function isVirtualKeyboard(
  value: unknown,
): value is PreviewVirtualKeyboardState {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["visible", "height"]) &&
    typeof value["visible"] === "boolean" &&
    isBoundedNumber(value["height"], 0, 4096)
  );
}

function isAccessibility(
  value: unknown,
): value is PreviewAccessibilityState {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["screenReader", "boldText"]) &&
    typeof value["screenReader"] === "boolean" &&
    typeof value["boldText"] === "boolean"
  );
}

function isPermissionState(value: unknown): value is PreviewPermissionState {
  return value === "prompt" || value === "granted" || value === "denied";
}

function isPermissions(
  value: unknown,
): value is Readonly<Record<string, PreviewPermissionState>> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([name, state]) =>
      /^[a-z][a-z0-9-]{0,63}$/u.test(name) &&
      name !== "constructor" &&
      name !== "prototype" &&
      isPermissionState(state),
  );
}

function isPreviewEnvironment(value: unknown): value is PreviewEnvironment {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "safeArea",
      "virtualKeyboard",
      "locale",
      "direction",
      "textScale",
      "contrast",
      "reducedMotion",
      "colorScheme",
      "pointer",
      "hover",
      "foldPosture",
      "accessibility",
      "permissions",
    ]) &&
    isSafeArea(value["safeArea"]) &&
    isVirtualKeyboard(value["virtualKeyboard"]) &&
    typeof value["locale"] === "string" &&
    /^[A-Za-z0-9-]{1,35}$/u.test(value["locale"]) &&
    (value["direction"] === "ltr" || value["direction"] === "rtl") &&
    isBoundedNumber(value["textScale"], 0.5, 3) &&
    (value["contrast"] === "no-preference" ||
      value["contrast"] === "more" ||
      value["contrast"] === "less") &&
    typeof value["reducedMotion"] === "boolean" &&
    (value["colorScheme"] === "light" || value["colorScheme"] === "dark") &&
    (value["pointer"] === "coarse" || value["pointer"] === "fine") &&
    typeof value["hover"] === "boolean" &&
    (value["foldPosture"] === "flat" ||
      value["foldPosture"] === "half-open" ||
      value["foldPosture"] === "folded") &&
    isAccessibility(value["accessibility"]) &&
    isPermissions(value["permissions"])
  );
}

/**
 * Merges and validates environment overrides against the neutral defaults.
 *
 * @param overrides - Partial environment scenario values.
 * @returns A deeply frozen complete environment.
 * @throws `TypeError` when a value is out of range or structurally
 * invalid.
 *
 * @example
 * ```ts
 * const environment = createPreviewEnvironment({
 *   colorScheme: "dark",
 *   virtualKeyboard: { visible: true, height: 300 },
 * });
 * ```
 */
export function createPreviewEnvironment(
  overrides: PreviewEnvironmentOverrides = {},
): PreviewEnvironment {
  const environment: PreviewEnvironment = {
    ...DEFAULT_PREVIEW_ENVIRONMENT,
    ...overrides,
    safeArea: {
      ...DEFAULT_PREVIEW_ENVIRONMENT.safeArea,
      ...overrides.safeArea,
    },
    virtualKeyboard: {
      ...DEFAULT_PREVIEW_ENVIRONMENT.virtualKeyboard,
      ...overrides.virtualKeyboard,
    },
    accessibility: {
      ...DEFAULT_PREVIEW_ENVIRONMENT.accessibility,
      ...overrides.accessibility,
    },
    permissions: {
      ...DEFAULT_PREVIEW_ENVIRONMENT.permissions,
      ...overrides.permissions,
    },
  };
  if (!isPreviewEnvironment(environment)) {
    throw new TypeError("Preview environment contains invalid scenario data.");
  }
  return freezeEnvironment(environment);
}

function isPreviewConfiguration(
  value: unknown,
): value is PreviewConfiguration {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "version",
      "deviceId",
      "orientation",
      "zoom",
      "frameVisible",
      "environment",
    ]) &&
    value["version"] === 1 &&
    typeof value["deviceId"] === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value["deviceId"]) &&
    (value["orientation"] === "portrait" ||
      value["orientation"] === "landscape") &&
    (value["zoom"] === "fit" ||
      isBoundedNumber(value["zoom"], 0.1, 2)) &&
    typeof value["frameVisible"] === "boolean" &&
    isPreviewEnvironment(value["environment"])
  );
}

/**
 * Validates an unknown object or JSON string as a version 1 configuration.
 *
 * The parser rejects unknown keys and invalid environment values so it can be
 * used at storage and message boundaries.
 *
 * @param serialized - Unknown configuration value or JSON text.
 * @returns A normalized immutable configuration.
 * @throws `TypeError` when JSON parsing or validation fails.
 */
export function parsePreviewConfiguration(
  serialized: unknown,
): PreviewConfiguration {
  let value: unknown = serialized;
  if (typeof serialized === "string") {
    try {
      value = JSON.parse(serialized) as unknown;
    } catch (error) {
      throw new TypeError("Preview configuration is not valid JSON.", {
        cause: error,
      });
    }
  }
  if (!isPreviewConfiguration(value)) {
    throw new TypeError("Preview configuration does not match version 1.");
  }
  return Object.freeze({
    ...value,
    environment: freezeEnvironment(value.environment),
  });
}

/**
 * Validates and serializes a version 1 preview configuration.
 *
 * @param configuration - Configuration to validate.
 * @returns Compact JSON preserving the validated object's property order.
 * @throws `TypeError` when the configuration is invalid.
 */
export function serializePreviewConfiguration(
  configuration: PreviewConfiguration,
): string {
  return JSON.stringify(parsePreviewConfiguration(configuration));
}
