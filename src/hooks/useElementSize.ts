import { useEffect, useState } from "react";

import type { ViewportDimensions } from "../types/device.js";

const EMPTY_SIZE: ViewportDimensions = Object.freeze({ width: 0, height: 0 });

export function useElementSize(
  element: HTMLElement | null,
): ViewportDimensions {
  const [size, setSize] = useState<ViewportDimensions>(EMPTY_SIZE);

  useEffect(() => {
    if (!element) return;
    const update = () => {
      const bounds = element.getBoundingClientRect();
      setSize({ width: bounds.width, height: bounds.height });
    };
    update();

    const ownerWindow = element.ownerDocument.defaultView;
    const Observer = ownerWindow?.ResizeObserver;
    if (Observer) {
      const observer = new Observer(update);
      observer.observe(element);
      return () => observer.disconnect();
    }
    ownerWindow?.addEventListener("resize", update);
    return () => ownerWindow?.removeEventListener("resize", update);
  }, [element]);

  return size;
}
