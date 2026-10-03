import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfigSwitcher from "../ConfigSwitcher";
import { configurations } from "../../../data/configurations";

describe("ConfigSwitcher", () => {
  it("lists all 12 configurations as 'code · subtitle' in a labelled select", () => {
    render(<ConfigSwitcher value="lp-3-1-standoff-halo" onChange={() => {}} />);
    const select = screen.getByRole("combobox", { name: "Configuration" });
    expect(select).toHaveValue("lp-3-1-standoff-halo");
    const options = within(select).getAllByRole("option");
    expect(options).toHaveLength(12);
    expect(options[1]).toHaveTextContent("LP 3.1 · Fabricated Stainless Steel with Standoffs");
    expect(options.map((o) => o.getAttribute("value"))).toEqual(configurations.map((c) => c.id));
  });

  it("reports the picked configuration", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfigSwitcher value="lp-3-1-standoff-halo" onChange={onChange} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Configuration" }), "lp-11-f-face-lit");
    expect(onChange).toHaveBeenCalledWith("lp-11-f-face-lit");
  });

  it("steps to the previous and next configuration, wrapping at the ends", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<ConfigSwitcher value={configurations[1].id} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Next configuration" }));
    expect(onChange).toHaveBeenLastCalledWith(configurations[2].id);
    await user.click(screen.getByRole("button", { name: "Previous configuration" }));
    expect(onChange).toHaveBeenLastCalledWith(configurations[0].id);

    rerender(<ConfigSwitcher value={configurations[0].id} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Previous configuration" }));
    expect(onChange).toHaveBeenLastCalledWith(configurations[configurations.length - 1].id);

    rerender(<ConfigSwitcher value={configurations[configurations.length - 1].id} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Next configuration" }));
    expect(onChange).toHaveBeenLastCalledWith(configurations[0].id);
  });
});
