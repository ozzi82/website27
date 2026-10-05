import { describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfigControls from "../ConfigControls";
import { defaultStateFor, type ConfiguratorState } from "../types";
import { configurations } from "../../../data/configurations";

const byId = (id: string) => configurations.find((c) => c.id === id)!;

function setup(id: string, patch: Partial<ConfiguratorState> = {}, strokeRatio: number | null = null) {
  const config = byId(id);
  const state = { ...defaultStateFor(config), ...patch };
  const onChange = vi.fn();
  render(<ConfigControls config={config} state={state} onChange={onChange} strokeRatio={strokeRatio} />);
  return { config, state, onChange };
}

const depthGroup = () => screen.getByRole("radiogroup", { name: "Depth" });
const dayNightGroup = () => screen.getByRole("radiogroup", { name: /day or night/i });

describe("ConfigControls depth", () => {
  it("offers only the configuration's own depths, labelled inches first", () => {
    setup("lp-3-1-standoff-halo");
    const radios = within(depthGroup()).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("aria-label"))).toEqual([
      "1.2″ (30 mm)",
      "2″ (50 mm)",
      "3″ (75 mm)",
      "4″ (100 mm)",
    ]);
    expect(within(depthGroup()).getByRole("radio", { name: "3″ (75 mm)" })).toBeChecked();
  });

  it("shows different depths for different configurations", () => {
    setup("lp-11-b-back-lit");
    const radios = within(depthGroup()).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual(["10", "15", "20", "30"]);
  });

  it("reports the chosen depth as millimetres", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    await user.click(within(depthGroup()).getByRole("radio", { name: "2″ (50 mm)" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ depthMm: 50 }));
  });

  it("is keyboard operable with the arrow keys", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    within(depthGroup()).getByRole("radio", { name: "3″ (75 mm)" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ depthMm: 100 }));
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
    const radios = within(depthGroup()).getAllByRole("radio");
    expect(radios).toHaveLength(1);
    expect(radios[0]).toBeDisabled();
    expect(radios[0]).toBeChecked();
    expect(radios[0]).toHaveAccessibleName("1.2″ (30 mm)");
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
    setup("lp-5-trimless-face-lit", { glowColor: "#fff4f0" });
    const group = screen.getByRole("group", { name: "Glow color" });
    expect(within(group).getByRole("button", { name: /^glow color: 6000 k daylight white$/i })).toHaveAttribute("aria-pressed", "true");
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
    await user.click(within(screen.getByRole("group", { name: "Glow color" })).getByRole("button", { name: /blue/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ glowColor: "#2d5bff" }));
  });

  it("keeps the paint colour for the neon letter: the back half of its side is painted", () => {
    setup("lp-11-n-faux-neon");
    expect(screen.getByRole("group", { name: "Paint color" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Glow color" })).toBeInTheDocument();
  });
});

describe("ConfigControls brightness", () => {
  it("is a 0-100% slider starting at 100%", () => {
    setup("lp-5-trimless-face-lit");
    const slider = screen.getByRole("slider", { name: "Brightness" });
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "100");
    expect(slider).toHaveValue("100");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("reports the new brightness as a number", () => {
    const { onChange } = setup("lp-5-trimless-face-lit");
    fireEvent.change(screen.getByRole("slider", { name: "Brightness" }), { target: { value: "35" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ brightness: 35 }));
  });

  it("reflects the brightness in the state it is given", () => {
    setup("lp-3-1-standoff-halo", { brightness: 60 });
    expect(screen.getByRole("slider", { name: "Brightness" })).toHaveValue("60");
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("is hidden for the unlit LP 1 and shown for every configuration that emits light", () => {
    const { unmount } = render(
      <ConfigControls config={byId("lp-1-flat-cutout")} state={defaultStateFor(byId("lp-1-flat-cutout"))} onChange={vi.fn()} />
    );
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    unmount();
    for (const c of configurations.filter((c) => c.id !== "lp-1-flat-cutout")) {
      const view = render(<ConfigControls config={c} state={defaultStateFor(c)} onChange={vi.fn()} />);
      expect(screen.getByRole("slider", { name: "Brightness" })).toBeInTheDocument();
      view.unmount();
    }
  });
});

describe("ConfigControls guidance", () => {
  it("has no letter height input and no below-minimum warning", () => {
    setup("lp-3-1-standoff-halo");
    expect(screen.queryByLabelText(/letter height/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
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

  it("says depth is shown relative to a nominal 12 inch letter, tucked into the collapsed notes", () => {
    setup("lp-3-1-standoff-halo");
    const text = screen.getByText(/nominal 12″ letter/i);
    expect(text.closest("details")).not.toHaveAttribute("open");
  });
});

describe("ConfigControls thin-stroke note", () => {
  it("shows a prominent amber note for thin art on the faux neon, with the height it would need", () => {
    setup("lp-11-n-faux-neon", {}, 0.03);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/thin strokes/i);
    expect(note).toHaveTextContent("LP 11-N");
    expect(note).toHaveTextContent("0.47″ (12 mm)");
    expect(note).toHaveTextContent("16″");
  });

  it("does the same for the conical profile", () => {
    setup("lp-11-c-conical", {}, 0.02);
    expect(screen.getByRole("note")).toHaveTextContent("LP 11-C");
  });

  it("stays quiet for sturdy strokes, an unknown ratio, and ordinary thinness on other configurations", () => {
    const { unmount } = render(
      <ConfigControls config={byId("lp-11-n-faux-neon")} state={defaultStateFor(byId("lp-11-n-faux-neon"))} onChange={vi.fn()} strokeRatio={0.15} />
    );
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    unmount();
    setup("lp-11-n-faux-neon", {}, null);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("gives other configurations only a subtle note when the letter would have to be taller than 24 inches", () => {
    const { unmount } = render(
      <ConfigControls config={byId("lp-5-trimless-face-lit")} state={defaultStateFor(byId("lp-5-trimless-face-lit"))} onChange={vi.fn()} strokeRatio={0.04} />
    );
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    unmount();
    setup("lp-5-trimless-face-lit", {}, 0.01);
    expect(screen.getByRole("note")).toHaveTextContent(/thin strokes/i);
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

  it("is a Day | Night segmented control with Day selected by default", () => {
    setup("lp-5-trimless-face-lit");
    const radios = within(dayNightGroup()).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual(["day", "night"]);
    expect(within(dayNightGroup()).getByRole("radio", { name: "Day" })).toBeChecked();
    expect(within(dayNightGroup()).getByRole("radio", { name: "Night" })).not.toBeChecked();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("keeps the day/night toggle on every configuration, including the unlit LP 1", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-1-flat-cutout");
    await user.click(within(dayNightGroup()).getByRole("radio", { name: "Night" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dayNight: "night" }));
  });

  it("round-trips night back to day", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit", { dayNight: "night" });
    expect(within(dayNightGroup()).getByRole("radio", { name: "Night" })).toBeChecked();
    await user.click(within(dayNightGroup()).getByRole("radio", { name: "Day" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dayNight: "day" }));
  });

  it("is keyboard operable with the arrow keys", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-5-trimless-face-lit");
    within(dayNightGroup()).getByRole("radio", { name: "Day" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dayNight: "night" }));
  });
});

describe("ConfigControls LP 1 finish and build", () => {
  it("offers the seven finishes only on the flat cutout", () => {
    setup("lp-1-flat-cutout");
    expect(within(screen.getByRole("radiogroup", { name: "Finish" })).getAllByRole("radio")).toHaveLength(7);
    cleanup();
    setup("lp-5-trimless-face-lit");
    expect(screen.queryByRole("radiogroup", { name: "Finish" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "Build" })).not.toBeInTheDocument();
  });

  it("switching to a fabricated build moves to the thicker depths", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("lp-1-flat-cutout");
    await user.click(within(screen.getByRole("radiogroup", { name: "Build" })).getByRole("radio", { name: "Fabricated" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ build: "fabricated", depthMm: 20 }));
  });

  it("wood and acrylic are solid-only, so the build choice is disabled with a note", () => {
    const lp1 = byId("lp-1-flat-cutout");
    render(<ConfigControls config={lp1} state={{ ...defaultStateFor(lp1), finish: "wood" }} onChange={vi.fn()} />);
    for (const r of within(screen.getByRole("radiogroup", { name: "Build" })).getAllByRole("radio")) expect(r).toBeDisabled();
    expect(screen.getByText(/solid material only/i)).toBeInTheDocument();
  });

  it("asks for a colour only for the finishes that take one", () => {
    const lp1 = byId("lp-1-flat-cutout");
    const { rerender } = render(<ConfigControls config={lp1} state={defaultStateFor(lp1)} onChange={vi.fn()} />);
    expect(screen.queryByRole("group", { name: "Acrylic color" })).not.toBeInTheDocument();
    rerender(<ConfigControls config={lp1} state={{ ...defaultStateFor(lp1), finish: "acrylic-colored" }} onChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Acrylic color" })).toBeInTheDocument();
  });
});
