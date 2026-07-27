import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { applyPreviewEnvironment } from "../environment/applyPreviewEnvironment.js";
import type { IframePortalProps } from "../types/preview.js";

const PORTAL_DOCUMENT = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, #react-device-lab-root { box-sizing: border-box; width: 100%; min-height: 100%; margin: 0; }
    </style>
  </head>
  <body><div id="react-device-lab-root"></div></body>
</html>`;

const PORTAL_STYLE_ID = "react-device-lab-portal-styles";

function getPortalRoot(iframe: HTMLIFrameElement): HTMLElement | null {
  const targetDocument = iframe.contentDocument;
  if (!targetDocument) return null;

  let root = targetDocument.getElementById("react-device-lab-root");
  if (!root) {
    root = targetDocument.createElement("div");
    root.id = "react-device-lab-root";
    targetDocument.body.append(root);
  }
  return root;
}

/**
 * Mounts consumer React content into an isolated, viewport-accurate iframe.
 *
 * The iframe document receives its own media-query viewport and environment
 * attributes. React component closures still execute in the host JavaScript
 * realm.
 *
 * @param props - Portal content, iframe name, styles, and environment.
 * @returns The iframe and, after its document loads, the React portal content.
 *
 * @example
 * ```tsx
 * <IframePortal
 *   styles="body { margin: 0; font-family: system-ui; }"
 *   title="Checkout preview"
 * >
 *   <CheckoutPage />
 * </IframePortal>
 * ```
 */
export function IframePortal({
  children,
  title,
  className,
  styles,
  environment,
  onLoad,
}: IframePortalProps) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  const handleLoad = useCallback(
    (loadedIframe: HTMLIFrameElement) => {
      setIframe(loadedIframe);
      setPortalRoot(getPortalRoot(loadedIframe));
      onLoad?.(loadedIframe);
    },
    [onLoad],
  );

  useEffect(() => {
    if (!iframe || !portalRoot || !styles) return;
    const targetDocument = portalRoot.ownerDocument;
    let style = targetDocument.getElementById(
      PORTAL_STYLE_ID,
    ) as HTMLStyleElement | null;
    if (!style) {
      style = targetDocument.createElement("style");
      style.id = PORTAL_STYLE_ID;
      targetDocument.head.append(style);
    }
    style.textContent = styles;
    return () => style?.remove();
  }, [iframe, portalRoot, styles]);

  useEffect(() => {
    if (!portalRoot || !environment) return;
    return applyPreviewEnvironment(portalRoot.ownerDocument, environment);
  }, [environment, portalRoot]);

  return (
    <>
      <iframe
        className={className}
        onLoad={(event) => handleLoad(event.currentTarget)}
        ref={setIframe}
        srcDoc={PORTAL_DOCUMENT}
        title={title}
      />
      {portalRoot ? createPortal(children, portalRoot) : null}
    </>
  );
}
