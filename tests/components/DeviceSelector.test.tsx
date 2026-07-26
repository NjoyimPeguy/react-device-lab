import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DEVICE_PRESETS,
  DeviceSelector,
} from "../../src/index.js";

describe("DeviceSelector", () => {
  it("searches the catalog while retaining grouped native options", async () => {
    const user = userEvent.setup();
    render(
      <DeviceSelector
        devices={DEVICE_PRESETS}
        onChange={() => undefined}
        value="iphone-17-pro"
      />,
    );

    expect(screen.getByLabelText("Search devices")).toBeVisible();
    expect(screen.getByRole("group", { name: "Phones" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search devices"), "S25 Edge");

    const selector = screen.getByLabelText("Device");
    expect(selector).toHaveTextContent("Galaxy S25 Edge");
    expect(selector).not.toHaveTextContent("iPhone 17 Pro Max");
  });

  it("reports a keyboard-selected preset", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DeviceSelector
        devices={DEVICE_PRESETS}
        onChange={onChange}
        value="iphone-17-pro"
      />,
    );

    await user.selectOptions(screen.getByLabelText("Device"), "pixel-10");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pixel-10", name: "Pixel 10" }),
    );
  });
});
