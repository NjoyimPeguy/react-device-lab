import { createContext, useContext } from "react";

import { DEFAULT_PREVIEW_ENVIRONMENT } from "./configuration.js";
import type {
  PreviewEnvironment,
  PreviewEnvironmentProviderProps,
} from "../types/environment.js";

const PreviewEnvironmentContext = createContext<PreviewEnvironment>(
  DEFAULT_PREVIEW_ENVIRONMENT,
);

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

export function usePreviewEnvironment(): PreviewEnvironment {
  return useContext(PreviewEnvironmentContext);
}
