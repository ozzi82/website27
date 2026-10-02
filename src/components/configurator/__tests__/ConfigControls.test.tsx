import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfigControls from "../ConfigControls";
import { defaultStateFor, type ConfiguratorState } from "../types";
import { configurations } from "../../../data/configurations";

const byId = (id: string) => configurations.find((c) => c.id === id)!;

function setup(id: string, patch: Partial<ConfiguratorState> = {}) {
  const config = byId(id);
  const state = { ...defaultStateFor(config), ...patch };
  const onChange = vi.fn();
  render(<ConfigControls config={config} state={state} onChange={onChange} />);
  return { config, state, onChange };
}

const dayNight = () => screen.getByLabelText(/day.*night|night.*day/i);

describe("ConfigControls depth", () => {
  it("offers only the configuration's own depths, labelled inches first", () => {
    setup("lp-3-1-standoff-halo");
    const select = screen.getByLabelText("Depth") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual([
      "1.2″ (30 mm)",
      "2″ (50 mm)",
      "3″ (75 mm)",
      "4″ (100 mm)",
    ]);
    expect(select).toHaveValue("50");
  });

  it("shows different depths for different configurations", () => {
    setup("lp-11-b-back-lit");
    const select = screen.getByLabelText("Depth") as HTMLSelectElement;
    expect([...select.options].map((o) => o.value)).toEqual(["10", "15", "20", "30"]);
  });

  it("reports the chosen depth as millimetres", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    await user.selectOptions(screen.getByLabelText("Depth"), "75");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ depthMm: 75 }));
  });

  it("says custom depths are available only for configurations that offer them", () => {
    const { unmount } = render(
      <ConfigControls config={byId("lp-5-trimless-face-lit")} state={defaultStateFor(byId("lp-5-trimless-face-lit"))} onChange={vi.fn()} />
    );
    expect(screen.getByText("Custom depths available — ask us.")).toBeInTheDocument();
    unmount();
    setup("lp-11-f-face-lit");
    expect(screen.queryByText(/custom depths/i)).not.toBeInTheDocument();
  });

  it("still shows a single available depth, but disabled", () => {
    setup("lp-11-s-side-lit");
    const select = screen.getByLabelText("Depth") as HTMLSelectElement;
    expect(select).toBeDisabled();
    expect(select).toHaveDisplayValue("1.2″ (30 mm)");
  });
});

describe("ConfigControls colours", () => {
  it("lets the painted colour be picked from swatches or a custom colour input", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    const group = screen.getByRole("group", { name: "Paint color" });
    await user.click(within(group).getByRole("button", { name: /red/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ color: expect.stringMatching(/^#[0-9a-f]{6}$/i) }));

    fireEvent.change(within(group).getByLabelText("Custom paint color"), { target: { value: "#123456" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ color: "#123456" }));
  });

  it("marks the active swatch as pressed", () => {
    setup("lp-5-trimless-face-lit", { glowColor: "#ffffff" });
    const group = screen.getByRole("group", { name: "Glow color" });
    expect(within(group).getByRole("button", { name: /^glow color: white$/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a glow colour control only for configurations that emit light", () => {
    const { unmount } = render(
      <ConfigControls config={byId("lp-1-flat-cutout")} state={defaultStateFor(byId("lp-1-flat-cutout"))} onChange={vi.fn()} />
    );
    expect(screen.queryByRole("group", { name: "Glow color" })).not.toBeInTheDocument();
    unmount();
    setup("lp-11-s-side-lit"); // only the side wall emits light
    expect(screen.getByRole("group", { name: "Glow color" })).toBeInTheDocument();
  });

  it("reports the glow colour", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    await user.click(within(screen.getByRole("group", { name: "Glow color" })).getByRole("button", { name: /cyan/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ glowColor: "#19e0ff" }));
  });

  it("hides the paint colour for the neon tube, which has no painted surface", () => {
    setup("lp-11-n-faux-neon");
    expect(screen.queryByRole("group", { name: "Paint color" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Glow color" })).toBeInTheDocument();
  });
});

describe("ConfigControls letter height", () => {
  it("reports a new height in inches", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    const input = screen.getByLabelText(/letter height/i);
    await user.clear(input);
    await user.type(input, "24");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ letterHeightIn: 24 }));
  });

  it("does not report an empty or non-positive height", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    await user.clear(screen.getByLabelText(/letter height/i));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("declares sensible bounds", () => {
    setup("lp-5-trimless-face-lit");
    const input = screen.getByLabelText(/letter height/i);
    expect(input).toHaveAttribute("min", "0.4");
    expect(input).toHaveAttribute("max", "240");
  });

  it("warns, without blocking, when the letter is below the minimum height", () => {
    setup("lp-3-1-standoff-halo", { letterHeightIn: 1 });
    const warning = screen.getByRole("status");
    expect(warning).toHaveTextContent(/minimum/i);
    expect(warning).toHaveTextContent("2″ (50 mm)");
    expect(screen.getByLabelText(/letter height/i)).toBeEnabled();
  });

  it("shows no warning at or above the minimum, and uses LP 1's smaller minimum", () => {
    const { unmount } = render(
      <ConfigControls
        config={byId("lp-3-1-standoff-halo")}
        state={{ ...defaultStateFor(byId("lp-3-1-standoff-halo")), letterHeightIn: 2 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    unmount();
    setup("lp-1-flat-cutout", { letterHeightIn: 1 });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the minimum stroke width as guidance", () => {
    setup("lp-11-f-face-lit");
    expect(screen.getByText(/minimum stroke width/i)).toHaveTextContent("0.47″ (12 mm)");
  });
});

describe("ConfigControls profile note and day/night", () => {
  it("flags the tube and conical profiles as illustrative", () => {
    const { unmount } = render(
      <ConfigControls config={byId("lp-11-n-faux-neon")} state={defaultStateFor(byId("lp-11-n-faux-neon"))} onChange={vi.fn()} />
    );
    expect(screen.getByText(/illustrative preview — this profile is approximated/i)).toBeInTheDocument();
    unmount();
    setup("lp-11-c-conical");
    expect(screen.getByText(/illustrative preview — this profile is approximated/i)).toBeInTheDocument();
  });

  it("does not flag the standard and flat profiles", () => {
    setup("lp-11-f-face-lit");
    expect(screen.queryByText(/illustrative preview/i)).not.toBeInTheDocument();
  });

  it("keeps the day/night toggle on every configuration, including the unlit LP 1", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-1-flat-cutout");
    await user.click(dayNight());
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dayNight: "night" }));
  });

  it("round-trips night back to day", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit", { dayNight: "night" });
    expect(dayNight()).toBeChecked();
    await user.click(dayNight());
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dayNight: "day" }));
  });
});
