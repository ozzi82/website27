import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import * as THREE from "three";
import { configurations } from "../../../data/configurations";
import ConfigControls from "../ConfigControls";
import { TEXT_FONTS, fontsFor, usableFontId } from "../textFonts";
import { GLOW_SWATCHES } from "../swatches";
import { milkyTint } from "../SceneMaterials";
import { defaultStateFor, effectiveConfig, switchConfig, withVariant } from "../types";
import { formatConfigSummary } from "../configSummary";
import { DISCLAIMER_TEXT } from "../disclaimer";
import { glowParts } from "../glowParts";

const byId = (id: string) => configurations.find((c) => c.id === id)!;
const lp5 = byId("lp-5-trimless-face-lit");

describe("fonts", () => {
  it("has no Playfair Display anywhere", () => {
    expect(TEXT_FONTS.some((f) => /playfair/i.test(f.id + f.label))).toBe(false);
  });

  it("offers the single-line neon fonts for LP 11-N only", () => {
    const neon = fontsFor(byId("lp-11-n-faux-neon")).map((f) => f.id);
    expect(neon).toEqual(expect.arrayContaining(["neon-script", "neon-line"]));
    for (const c of configurations.filter((x) => x.profile !== "tube")) {
      expect(fontsFor(c).some((f) => f.neonOnly), c.id).toBe(false);
    }
  });

  it("falls back to the default font when a neon font is not available for the configuration", () => {
    expect(usableFontId(byId("lp-11-n-faux-neon"), "neon-line")).toBe("neon-line");
    expect(usableFontId(byId("lp-11-f-face-lit"), "neon-line")).toBe("montserrat");
  });
});

describe("glow colours", () => {
  it("are the four white temperatures and six colours, with no free colour picker", () => {
    expect(GLOW_SWATCHES.map((s) => s.name)).toEqual([
      "3000 K warm white", "4000 K white", "5000 K cool white", "6000 K daylight white",
      "Yellow", "Orange", "Red", "Pink", "Green", "Blue",
    ]);
    render(<ConfigControls config={lp5} state={defaultStateFor(lp5)} onChange={vi.fn()} />);
    const glow = screen.getByRole("group", { name: "Glow color" });
    expect(within(glow).getAllByRole("button")).toHaveLength(10);
    expect(glow.querySelector('input[type="color"]')).toBeNull();
    expect(screen.getByRole("group", { name: "Paint color" }).querySelector('input[type="color"]')).not.toBeNull();
  });

  it("keeps a red glow visibly red when the LEDs are off, and whites milky", () => {
    const red = milkyTint("#ff1a1a");
    expect(red.r).toBeGreaterThan(red.g * 3);
    expect(red.r).toBeGreaterThan(red.b * 3);
    const white = milkyTint("#fff4f0");
    expect(Math.abs(white.r - white.b)).toBeLessThan(0.2);
  });
});

describe("LP 5 + 3.1 option", () => {
  it("makes LP 5 face and halo lit, stand-off only, and goes back", () => {
    const on = withVariant(lp5, defaultStateFor(lp5), true);
    const eff = effectiveConfig(lp5, on);
    expect(eff.code).toBe("LP 5+3.1");
    expect(eff.light).toMatchObject({ face: "glow", halo: "standoff" });
    expect(eff.mounts).toEqual(["standoff"]);
    expect(on.mounting).toBe("standoff");
    expect(glowParts(eff.light, eff.profile, on.mounting).wallSpill).toBe("standoff");
    const off = withVariant(lp5, on, false);
    expect(effectiveConfig(lp5, off).code).toBe("LP 5");
    expect(off.variant).toBe(false);
  });

  it("is offered on LP 5 only, and resets when another system is picked", () => {
    expect(configurations.filter((c) => c.variant).map((c) => c.id)).toEqual(["lp-5-trimless-face-lit"]);
    const on = withVariant(lp5, defaultStateFor(lp5), true);
    expect(switchConfig(on, byId("lp-11-f-face-lit")).variant).toBe(false);
  });

  it("shows the Lighting switch, and names the option in the quote summary", () => {
    const on = withVariant(lp5, defaultStateFor(lp5), true);
    render(<ConfigControls config={lp5} state={on} onChange={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: "Lighting" })).toBeInTheDocument();
    expect(formatConfigSummary(on, effectiveConfig(lp5, on), null)).toContain("Configuration: LP 5+3.1");
  });
});

describe("disclaimer", () => {
  it("travels with the quote summary", () => {
    expect(DISCLAIMER_TEXT).toMatch(/do not represent the real acrylic colors/);
    expect(DISCLAIMER_TEXT).toMatch(/every order needs proper artwork/);
    expect(formatConfigSummary(defaultStateFor(lp5), lp5, null)).toContain(DISCLAIMER_TEXT);
  });
});

import { SPACER_DIAMETER_MM, SPACER_LENGTH_MM, mmToWorld, spacerPoints } from "../spacers";
import { wallGapFor } from "../renderMath";

describe("stand-off spacers", () => {
  const block = (x: number, y: number, w: number, h: number) => {
    const s = new THREE.Shape();
    s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath();
    return s;
  };

  it("are clear 1 inch tubes, 0.4 inch across, and the stand-off gap is exactly one tube long", () => {
    expect(SPACER_LENGTH_MM).toBeCloseTo(25.4, 6);
    expect(SPACER_DIAMETER_MM).toBeCloseTo(10.16, 6);
    expect(wallGapFor("standoff", 2.4)).toBeCloseTo(mmToWorld(SPACER_LENGTH_MM, 2.4), 9);
  });

  it("go inside thick parts of the letter, spread out, and never onto a stroke too thin to hold a tube", () => {
    const thick = [block(0, 0, 3, 2.4)];
    const pts = spacerPoints(thick, 2.4);
    expect(pts.length).toBeGreaterThan(1);
    for (const p of pts) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(3);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(2.4);
    }
    const hairline = [block(0, 0, 3, 0.01)];
    expect(spacerPoints(hairline, 2.4)).toEqual([]);
  });
});

describe("walls light only where the letter is made to light them", () => {
  it("face-lit, front-band and full side-lit letters spill nothing on the wall", () => {
    for (const id of ["lp-11-f-face-lit", "lp-11-fs-front-side-lit", "lp-11-s-side-lit", "lp-11-n-faux-neon", "lp-11-c-conical", "lp-5-trimless-face-lit"]) {
      const c = byId(id);
      expect(glowParts(c.light, c.profile, "flush").wallSpill, id).toBe("none");
    }
    expect(glowParts(byId("lp-11-b-back-lit").light, "standard", "standoff").wallSpill).toBe("standoff");
    expect(glowParts(byId("lp-11-bs-back-side-lit").light, "standard", "flush").wallSpill).toBe("flush");
  });
});

import ThinStrokeNotice from "../ThinStrokeNotice";

describe("thin-stroke notice", () => {
  it("is a visible note over the preview for thin artwork, and absent for sturdy artwork", () => {
    const neon = byId("lp-11-n-faux-neon");
    const { container, rerender } = render(<ThinStrokeNotice config={neon} strokeRatio={0.03} />);
    const note = screen.getByRole("note");
    expect(note.textContent).toMatch(/thin strokes/i);
    expect(note.className).toMatch(/absolute/);
    rerender(<ThinStrokeNotice config={neon} strokeRatio={0.3} />);
    expect(container.querySelector('[role="note"]')).toBeNull();
  });
});
