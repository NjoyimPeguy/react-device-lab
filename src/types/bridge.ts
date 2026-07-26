import type { PreviewConfiguration } from "./preview.js";

export interface PreviewBridgeRouteMessage {
  readonly namespace: "react-device-lab";
  readonly version: 1;
  readonly type: "route";
  readonly payload: {
    readonly href: string;
  };
}

export interface PreviewBridgeConfigurationMessage {
  readonly namespace: "react-device-lab";
  readonly version: 1;
  readonly type: "configuration";
  readonly payload: {
    readonly configuration: PreviewConfiguration;
  };
}

export interface PreviewBridgeReadyMessage {
  readonly namespace: "react-device-lab";
  readonly version: 1;
  readonly type: "ready";
  readonly payload: {
    readonly href: string;
  };
}

export type PreviewBridgeMessage =
  | PreviewBridgeRouteMessage
  | PreviewBridgeConfigurationMessage
  | PreviewBridgeReadyMessage;

export interface InstallPreviewBridgeOptions {
  readonly allowedParentOrigins: readonly string[];
  readonly onConfiguration?: (configuration: PreviewConfiguration) => void;
  readonly getRoute?: () => string;
  readonly targetWindow?: Window;
  readonly parentWindow?: Window;
}
