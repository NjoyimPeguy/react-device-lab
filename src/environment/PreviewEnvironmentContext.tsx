import { createContext, useContext } from "react";

import { DEFAULT_PREVIEW_ENVIRONMENT } from "./configuration.js";
import type {
  PreviewEnvironment,
  PreviewEnvironmentProviderProps,
} from "../types/environment.js";

const PreviewEnvironmentContext = createContext<PreviewEnvironment>(
  DEFAULT_PREVIEW_ENVIRONMENT,
);

/**
 * Supplies a complete preview environment to consumer-rendered React content.
 *
 * @param props - Provider value and React subtree.
 * @returns A React context provider.
 */
export function PreviewEnvironmentProvider({
  value,
  children,
}: PreviewEnvironmentProviderProps) {
  return (
    <PreviewEnvironmentContext.Provider value={value}>
      {children}
    </PreviewEnvironmentContext.Provider>
  );
}

/**
 * Reads the nearest preview environment.
 *
 * @returns The provider value, or {@link DEFAULT_PREVIEW_ENVIRONMENT} when used
 * outside a provider.
 */
export function usePreviewEnvironment(): PreviewEnvironment {
  return useContext(PreviewEnvironmentContext);
}
