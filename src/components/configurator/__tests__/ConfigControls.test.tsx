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

describe("ConfigControls guidance", () => {
  it("has no letter height input and no below-minimum warning", () => {
    setup("lp-3-1-standoff-halo");
    expect(screen.queryByLabelText(/letter height/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the configuration's minimum letter height as plain text, inches first", () => {
    setup("lp-3-1-standoff-halo");
    expect(screen.getByText(/minimum letter height/i)).toHaveTextContent("2″ (50 mm)");
  });

  it("uses each configuration's own minimum (LP 1 allows 0.4 inch letters)", () => {
    setup("lp-1-flat-cutout");
    expect(screen.getByText(/minimum letter height/i)).toHaveTextContent("0.39″ (10 mm)");
  });

  it("shows the minimum stroke width as guidance", () => {
    setup("lp-11-f-face-lit");
    expect(screen.getByText(/minimum stroke width/i)).toHaveTextContent("0.47″ (12 mm)");
  });

  it("says depth is shown relative to a nominal 12 inch letter", () => {
    setup("lp-3-1-standoff-halo");
    expect(screen.getByText(/nominal 12″ letter/i)).toBeInTheDocument();
  });
});

describe("ConfigControls background", () => {
  const group = () => screen.getByRole("radiogroup", { name: "Background" });

  it("offers concrete, two more concretes and brick as a radio group with concrete selected by default", () => {
    setup("lp-5-trimless-face-lit");
    const radios = within(group()).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual(["concrete", "light-concrete", "warm-concrete", "brick"]);
    expect(within(group()).getByRole("radio", { name: "Concrete" })).toBeChecked();
    expect(within(group()).getByRole("radio", { name: "Brick" })).not.toBeChecked();
    expect(within(group()).getByRole("radio", { name: "Light concrete" })).toBeInTheDocument();
    expect(within(group()).getByRole("radio", { name: "Warm concrete" })).toBeInTheDocument();
    expect(within(group()).queryByRole("radio", { name: /wood|plaster/i })).not.toBeInTheDocument();
  });

  it("reports the chosen background", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    await user.click(within(group()).getByRole("radio", { name: "Brick" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ background: "brick" }));
  });

  it("reflects the background in the state it is given", () => {
    setup("lp-5-trimless-face-lit", { background: "light-concrete" });
    expect(within(group()).getByRole("radio", { name: "Light concrete" })).toBeChecked();
  });

  it("is available on every configuration, including the unlit LP 1", () => {
    for (const c of configurations) {
      const { unmount } = render(<ConfigControls config={c} state={defaultStateFor(c)} onChange={vi.fn()} />);
      expect(group()).toBeInTheDocument();
      unmount();
    }
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
