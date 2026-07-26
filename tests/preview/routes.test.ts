import { describe, expect, it } from "vitest";

import { createPreviewRouteState } from "../../src/index.js";

describe("preview routes", () => {
  it("normalizes absolute and relative application routes", () => {
    expect(
      createPreviewRouteState(
        "/tasks?owner=me#today",
        "initial",
        "https://app.example.test/dashboard",
      ),
    ).toEqual({
      href: "https://app.example.test/tasks?owner=me#today",
      pathname: "/tasks",
      search: "?owner=me",
      hash: "#today",
      source: "initial",
    });
  });

  it("rejects executable and non-web target protocols", () => {
    expect(() =>
      createPreviewRouteState("javascript:alert(1)", "initial"),
    ).toThrow(TypeError);
    expect(() =>
      createPreviewRouteState("file:///tmp/private.html", "initial"),
    ).toThrow(TypeError);
  });
});
