import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DevicePreviewLab } from "../../src/index.js";

describe("DevicePreviewLab accessibility", () => {
  it("provides one named main landmark, a stage region, and a complementary panel", () => {
    render(<DevicePreviewLab src="https://app.example.test/" />);

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(
      screen.getByRole("region", { name: "Preview stage" }),
    ).toBeVisible();
    expect(
      screen.getByRole("complementary", { name: "Preview configuration" }),
    ).toBeVisible();
    for (const name of [
      "Search devices",
      "Device",
      "Rotate viewport",
      "Show device frame",
      "Show safe areas",
      "Package theme",
    ]) {
      expect(screen.getByLabelText(name)).toBeVisible();
    }
  });
});
