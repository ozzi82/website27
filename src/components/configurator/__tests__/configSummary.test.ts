import { describe, it, expect } from "vitest";
import { formatConfigSummary, configSummaryRows } from "../configSummary";
import { defaultStateFor } from "../types";
import { configurations } from "../../../data/configurations";

const byId = (id: string) => configurations.find((c) => c.id === id)!;

describe("formatConfigSummary", () => {
  const config = byId("lp-3-1-standoff-halo");
  const state = { ...defaultStateFor(config), depthMm: 75, color: "#b4332a", glowColor: "#2d5bff", brightness: 80 };

  it("is plain readable text, one labelled line per choice, US units first", () => {
    const text = formatConfigSummary(state, config, { kind: "upload", fileName: "logo.svg" });
    expect(text).toContain("LP 3.1");
    expect(text).toContain(config.subtitle);
    expect(text).toContain("Depth: 3″ (75 mm)");
    expect(text).toContain("Paint color: Red (#b4332a)");
    expect(text).toContain("Glow color: Blue (#2d5bff)");
    expect(text).toContain("LED brightness: 80%");
    expect(text).toContain("Artwork: uploaded file logo.svg");
    expect(text).not.toMatch(/[<>{}]/);
    expect(text.split("\n").length).toBeGreaterThan(4);
  });

  it("names typed text artwork with its font", () => {
    const text = formatConfigSummary(state, config, { kind: "text", text: "Sunlite\nSigns", fontLabel: "Pacifico" });
    expect(text).toContain('Artwork: typed text "Sunlite / Signs" in Pacifico');
  });

  it("works without artwork (no artwork line at all)", () => {
    const text = formatConfigSummary(state, config, null);
    expect(text).not.toMatch(/artwork:/i);
    expect(text).toContain("Depth:");
  });

  it("leaves out what the configuration does not have: no glow or brightness on the unlit LP 1", () => {
    const lp1 = byId("lp-1-flat-cutout");
    const flat = formatConfigSummary(defaultStateFor(lp1), lp1, null);
    expect(flat).not.toMatch(/glow|brightness/i);
  });

  it("names the LP 1 finish and build, and the colour only where the finish takes one", () => {
    const lp1 = byId("lp-1-flat-cutout");
    const steel = formatConfigSummary({ ...defaultStateFor(lp1), finish: "brushed-steel", build: "fabricated", depthMm: 50 }, lp1, null);
    expect(steel).toContain("Finish: Silver metallic stainless steel");
    expect(steel).toContain("Build: Fabricated (hollow)");
    expect(steel).not.toContain("color:");
    const acrylic = formatConfigSummary({ ...defaultStateFor(lp1), finish: "acrylic-colored", color: "#b4332a" }, lp1, null);
    expect(acrylic).toContain("Build: Solid material");
    expect(acrylic).toContain("Acrylic color: Red (#b4332a)");
  });

  it("keeps the paint colour for the neon letter (the back half of its side is painted) alongside glow and brightness", () => {
    const neon = byId("lp-11-n-faux-neon");
    const text = formatConfigSummary(defaultStateFor(neon), neon, null);
    expect(text).toContain("Paint color:");
    expect(text).toContain("Glow color: 6000 K daylight white (#fff4f0)");
    expect(text).toContain("LED brightness: 100%");
    expect(text).not.toContain("Finish:");
  });

  it("falls back to the bare hex for a custom colour", () => {
    const text = formatConfigSummary({ ...state, color: "#123456" }, config, null);
    expect(text).toContain("Paint color: #123456");
  });

  it("does not mention the background or day/night (they are only a preview setting)", () => {
    const text = formatConfigSummary({ ...state, dayNight: "night", background: "brick" }, config, null);
    expect(text).not.toMatch(/background|brick|night|day/i);
  });

  it("appends an optional note, e.g. about thin strokes", () => {
    const text = formatConfigSummary(state, config, null, { note: "Thin strokes: needs a 16 in letter." });
    expect(text).toContain("Note: Thin strokes: needs a 16 in letter.");
  });
});

describe("configSummaryRows", () => {
  it("returns label/value rows (with colour swatches) for display", () => {
    const config = byId("lp-5-trimless-face-lit");
    const rows = configSummaryRows(defaultStateFor(config), config, null);
    expect(rows[0]).toMatchObject({ label: "Configuration" });
    expect(rows.find((r) => r.label === "Paint color")).toMatchObject({ swatch: "#c9ced4" });
    expect(rows.find((r) => r.label === "Glow color")).toMatchObject({ swatch: "#fff4f0" });
  });
});

describe("size in the summary", () => {
  it("states the real size in inches and millimetres when the artwork's proportions are known", () => {
    const config = configurations.find((c) => c.id === "lp-11-b-back-lit")!;
    const state = { ...defaultStateFor(config), sizeIn: 60 };
    const text = formatConfigSummary(state, config, null, { aspect: 4 });
    expect(text).toContain("Size: 60″ × 15″ (1524 × 381 mm)");
    expect(formatConfigSummary(state, config, null)).not.toContain("Size:");
  });
});
