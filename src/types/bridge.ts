import type { PreviewConfiguration } from "./preview.js";

/** Message sent when embedded preview content reports a route change. */
export interface PreviewBridgeRouteMessage {
  /** Protocol namespace used to reject unrelated window messages. */
  readonly namespace: "react-device-lab";
  /** Supported bridge protocol version. */
  readonly version: 1;
  /** Discriminator for a route notification. */
  readonly type: "route";
  /** Route data supplied by the embedded application. */
  readonly payload: {
    /** Absolute HTTP or HTTPS URL for the current embedded route. */
    readonly href: string;
  };
}

/** Message sent by the host to apply a preview environment configuration. */
export interface PreviewBridgeConfigurationMessage {
  /** Protocol namespace used to reject unrelated window messages. */
  readonly namespace: "react-device-lab";
  /** Supported bridge protocol version. */
  readonly version: 1;
  /** Discriminator for a configuration update. */
  readonly type: "configuration";
  /** Validated configuration supplied by the preview host. */
  readonly payload: {
    /** Complete versioned preview configuration. */
    readonly configuration: PreviewConfiguration;
  };
}

/** Message sent after embedded preview content installs the bridge. */
export interface PreviewBridgeReadyMessage {
  /** Protocol namespace used to reject unrelated window messages. */
  readonly namespace: "react-device-lab";
  /** Supported bridge protocol version. */
  readonly version: 1;
  /** Discriminator for bridge readiness. */
  readonly type: "ready";
  /** Initial route data supplied by the embedded application. */
  readonly payload: {
    /** Absolute HTTP or HTTPS URL for the current embedded route. */
    readonly href: string;
  };
}

/** Valid message accepted by the version 1 preview bridge protocol. */
export type PreviewBridgeMessage =
  | PreviewBridgeRouteMessage
  | PreviewBridgeConfigurationMessage
  | PreviewBridgeReadyMessage;

/** Security and lifecycle options for {@link installPreviewBridge}. */
export interface InstallPreviewBridgeOptions {
  /**
   * Exact parent origins allowed to configure or receive messages.
   *
   * Wildcards, paths, and empty allowlists are rejected.
   */
  readonly allowedParentOrigins: readonly string[];
  /** Called after a valid configuration message has been applied. */
  readonly onConfiguration?: (configuration: PreviewConfiguration) => void;
  /** Returns the absolute route reported to the parent. */
  readonly getRoute?: () => string;
  /** Window receiving bridge events; defaults to the current browser window. */
  readonly targetWindow?: Window;
  /** Parent window receiving reports; defaults to `targetWindow.parent`. */
  readonly parentWindow?: Window;
}
