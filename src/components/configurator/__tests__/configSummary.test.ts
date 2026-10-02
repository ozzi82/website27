import { describe, it, expect } from "vitest";
import { formatConfigSummary, configSummaryRows } from "../configSummary";
import { defaultStateFor } from "../types";
import { configurations } from "../../../data/configurations";

const byId = (id: string) => configurations.find((c) => c.id === id)!;

describe("formatConfigSummary", () => {
  const config = byId("lp-3-1-standoff-halo");
  const state = { ...defaultStateFor(config), depthMm: 75, color: "#b4332a", glowColor: "#19e0ff", brightness: 80 };

  it("is plain readable text, one labelled line per choice, US units first", () => {
    const text = formatConfigSummary(state, config, { kind: "upload", fileName: "logo.svg" });
    expect(text).toContain("LP 3.1");
    expect(text).toContain(config.subtitle);
    expect(text).toContain("Depth: 3″ (75 mm)");
    expect(text).toContain("Paint color: Red (#b4332a)");
    expect(text).toContain("Glow color: Cyan (#19e0ff)");
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

  it("leaves out what the configuration does not have: no glow or brightness on the unlit LP 1, no paint on the neon tube", () => {
    const lp1 = byId("lp-1-flat-cutout");
    const flat = formatConfigSummary(defaultStateFor(lp1), lp1, null);
    expect(flat).not.toMatch(/glow|brightness/i);
    expect(flat).toContain("Paint color:");

    const neon = byId("lp-11-n-faux-neon");
    const tube = formatConfigSummary(defaultStateFor(neon), neon, null);
    expect(tube).not.toContain("Paint color");
    expect(tube).toContain("Glow color: White (#ffffff)");
    expect(tube).toContain("LED brightness: 100%");
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
    expect(rows.find((r) => r.label === "Paint color")).toMatchObject({ swatch: "#4b5059" });
    expect(rows.find((r) => r.label === "Glow color")).toMatchObject({ swatch: "#ffffff" });
  });
});
