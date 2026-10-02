import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfigChooser from "../ConfigChooser";
import { configurations } from "../../../data/configurations";

describe("ConfigChooser", () => {
  it("offers all 12 configurations, in order, each with its title, subtitle and summary", () => {
    render(<ConfigChooser onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(12);
    configurations.forEach((c, i) => {
      expect(within(buttons[i]).getByText(c.code)).toBeInTheDocument();
      expect(within(buttons[i]).getByText(`${c.title} ${c.subtitle}`)).toBeInTheDocument();
      expect(within(buttons[i]).getByText(c.summary)).toBeInTheDocument();
    });
  });

  it("shows the brochure photo as a decorative thumbnail", () => {
    render(<ConfigChooser onSelect={vi.fn()} />);
    const button = screen.getByRole("button", { name: /EdgeLuxe LP 11-FB Block/ });
    const img = button.querySelector("img")!;
    expect(img).toHaveAttribute("src", configurations.find((c) => c.code === "LP 11-FB")!.img);
    expect(img).toHaveAttribute("alt", "");
  });

  it("calls onSelect with the configuration id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ConfigChooser onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: /EdgeLuxe LP 3\.2 Fabricated/ }));
    expect(onSelect).toHaveBeenCalledWith("lp-3-2-flush-mount");
  });

  it("is operable from the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ConfigChooser onSelect={onSelect} />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(configurations[0].id);
  });
});
