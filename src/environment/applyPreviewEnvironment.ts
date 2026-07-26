import type { PreviewEnvironment } from "../types/environment.js";

const TARGET_STYLE_ID = "react-device-lab-preview-environment";

const TARGET_STYLE = `
html[data-rdl-pointer="coarse"],
html[data-rdl-pointer="coarse"] body {
  scrollbar-width: none;
}
html[data-rdl-pointer="coarse"]::-webkit-scrollbar,
html[data-rdl-pointer="coarse"] body::-webkit-scrollbar,
html[data-rdl-pointer="coarse"] *::-webkit-scrollbar {
  width: 0;
  height: 0;
}
`;

const DATA_ATTRIBUTES = [
  "data-rdl-color-scheme",
  "data-rdl-contrast",
  "data-rdl-reduced-motion",
  "data-rdl-pointer",
  "data-rdl-hover",
  "data-rdl-fold-posture",
  "data-rdl-virtual-keyboard",
  "data-rdl-screen-reader",
  "data-rdl-bold-text",
] as const;

const STYLE_PROPERTIES = [
  "--rdl-safe-area-inset-top",
  "--rdl-safe-area-inset-right",
  "--rdl-safe-area-inset-bottom",
  "--rdl-safe-area-inset-left",
  "--rdl-virtual-keyboard-height",
  "--rdl-text-scale",
] as const;

interface AttributeSnapshot {
  readonly name: string;
  readonly value: string | null;
}

function setBooleanAttribute(
  root: HTMLElement,
  name: string,
  value: boolean,
): void {
  root.setAttribute(name, value ? "true" : "false");
}

/**
 * Applies a deterministic preview scenario to a same-origin document.
 *
 * The adapter sets data attributes and CSS custom properties, hides scrollbar
 * chrome for coarse-pointer scenarios without disabling scrolling, and
 * dispatches `react-device-lab:environment`. It does not override browser
 * permission APIs or emulate native hardware.
 *
 * @param targetDocument - Same-origin document that owns the preview content.
 * @param environment - Complete validated environment to apply.
 * @returns A cleanup function that restores prior attributes and inline styles.
 */
export function applyPreviewEnvironment(
  targetDocument: Document,
  environment: PreviewEnvironment,
): () => void {
  const root = targetDocument.documentElement;
  const attributes: AttributeSnapshot[] = [
    { name: "lang", value: root.getAttribute("lang") },
    { name: "dir", value: root.getAttribute("dir") },
    ...DATA_ATTRIBUTES.map((name) => ({
      name,
      value: root.getAttribute(name),
    })),
  ];
  const permissionAttributeNames = Object.keys(environment.permissions).map(
    (name) => `data-rdl-permission-${name}`,
  );
  attributes.push(
    ...permissionAttributeNames.map((name) => ({
      name,
      value: root.getAttribute(name),
    })),
  );
  const styles = new Map(
    STYLE_PROPERTIES.map((name) => [name, root.style.getPropertyValue(name)]),
  );
  const existingStyle = targetDocument.querySelector(`#${TARGET_STYLE_ID}`);
  let injectedStyle: HTMLStyleElement | null = null;
  if (!existingStyle) {
    injectedStyle = targetDocument.createElement("style");
    injectedStyle.id = TARGET_STYLE_ID;
    injectedStyle.textContent = TARGET_STYLE;
    targetDocument.head.append(injectedStyle);
  }

  root.lang = environment.locale;
  root.dir = environment.direction;
  root.setAttribute("data-rdl-color-scheme", environment.colorScheme);
  root.setAttribute("data-rdl-contrast", environment.contrast);
  setBooleanAttribute(
    root,
    "data-rdl-reduced-motion",
    environment.reducedMotion,
  );
  root.setAttribute("data-rdl-pointer", environment.pointer);
  setBooleanAttribute(root, "data-rdl-hover", environment.hover);
  root.setAttribute("data-rdl-fold-posture", environment.foldPosture);
  setBooleanAttribute(
    root,
    "data-rdl-virtual-keyboard",
    environment.virtualKeyboard.visible,
  );
  setBooleanAttribute(
    root,
    "data-rdl-screen-reader",
    environment.accessibility.screenReader,
  );
  setBooleanAttribute(
    root,
    "data-rdl-bold-text",
    environment.accessibility.boldText,
  );
  for (const [name, state] of Object.entries(environment.permissions)) {
    root.setAttribute(`data-rdl-permission-${name}`, state);
  }
  root.style.setProperty(
    "--rdl-safe-area-inset-top",
    `${environment.safeArea.top}px`,
  );
  root.style.setProperty(
    "--rdl-safe-area-inset-right",
    `${environment.safeArea.right}px`,
  );
  root.style.setProperty(
    "--rdl-safe-area-inset-bottom",
    `${environment.safeArea.bottom}px`,
  );
  root.style.setProperty(
    "--rdl-safe-area-inset-left",
    `${environment.safeArea.left}px`,
  );
  root.style.setProperty(
    "--rdl-virtual-keyboard-height",
    `${environment.virtualKeyboard.height}px`,
  );
  root.style.setProperty("--rdl-text-scale", String(environment.textScale));

  const EventConstructor = targetDocument.defaultView?.CustomEvent;
  if (EventConstructor) {
    targetDocument.dispatchEvent(
      new EventConstructor("react-device-lab:environment", {
        detail: environment,
      }),
    );
  }

  return () => {
    for (const { name, value } of attributes) {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
    for (const [name, value] of styles) {
      if (value) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    }
    injectedStyle?.remove();
  };
}
