import { describe, it, expect } from "vitest";
import { configurations } from "../../../data/configurations";
import { defaultStateFor, formatDepth, emitsLight, switchConfig, depthOptionsFor, withBuild, withFinish } from "../types";

const byId = (id: string) => configurations.find((c) => c.id === id)!;

describe("defaultStateFor", () => {
  it("starts every configuration on one of its own allowed depths", () => {
    for (const c of configurations) {
      expect(c.depthOptionsMm).toContain(defaultStateFor(c).depthMm);
    }
  });

  it("uses the family's customary depth: 75 mm stainless (clearly thicker than LP 11), 30 mm block acrylic, 5 mm flat cutout", () => {
    expect(defaultStateFor(byId("lp-5-trimless-face-lit")).depthMm).toBe(75);
    expect(defaultStateFor(byId("lp-3-1-standoff-halo")).depthMm).toBe(75);
    expect(defaultStateFor(byId("lp-11-f-face-lit")).depthMm).toBe(30);
    expect(defaultStateFor(byId("lp-11-b-back-lit")).depthMm).toBe(30);
    expect(defaultStateFor(byId("lp-1-flat-cutout")).depthMm).toBe(5);
  });

  it("starts on the concrete background", () => {
    for (const c of configurations) expect(defaultStateFor(c).background).toBe("concrete");
  });

  it("starts in day mode with dark paint and a white glow", () => {
    const s = defaultStateFor(byId("lp-5-trimless-face-lit"));
    expect(s).toMatchObject({
      configId: "lp-5-trimless-face-lit",
      dayNight: "day",
      glowColor: "#fff4f0",
    });
    expect(s).not.toHaveProperty("letterHeightIn"); // height was dropped: it made deeper letters look thinner
    expect(s.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("formatDepth", () => {
  it("formats inches first with millimetres in parentheses, matching the brochure's rounding", () => {
    expect(formatDepth(30)).toBe("1.2″ (30 mm)");
    expect(formatDepth(50)).toBe("2″ (50 mm)");
    expect(formatDepth(75)).toBe("3″ (75 mm)");
    expect(formatDepth(100)).toBe("4″ (100 mm)");
    expect(formatDepth(15)).toBe("0.5″ (15 mm)");
    expect(formatDepth(12)).toBe("0.47″ (12 mm)");
    expect(formatDepth(1)).toBe("0.039″ (1 mm)");
    expect(formatDepth(200)).toBe("7.87″ (200 mm)");
  });
});

describe("emitsLight", () => {
  it("is false only for the unlit flat cutout", () => {
    expect(emitsLight(byId("lp-1-flat-cutout"))).toBe(false);
    for (const c of configurations.filter((c) => c.id !== "lp-1-flat-cutout")) {
      expect(emitsLight(c)).toBe(true);
    }
  });
});

describe("switchConfig", () => {
  it("keeps the visitor's colours, brightness, day/night and background", () => {
    const prev = {
      ...defaultStateFor(byId("lp-3-1-standoff-halo")),
      color: "#aa3311",
      glowColor: "#2d5bff",
      brightness: 40,
      dayNight: "night" as const,
      background: "brick" as const,
    };
    const next = switchConfig(prev, byId("lp-11-f-face-lit"));
    expect(next).toMatchObject({
      configId: "lp-11-f-face-lit",
      color: "#aa3311",
      glowColor: "#2d5bff",
      brightness: 40,
      dayNight: "night",
      background: "brick",
    });
  });

  it("keeps the depth when the new configuration offers it", () => {
    const prev = { ...defaultStateFor(byId("lp-5-trimless-face-lit")), depthMm: 75 };
    expect(byId("lp-3-1-standoff-halo").depthOptionsMm).toContain(75);
    expect(switchConfig(prev, byId("lp-3-1-standoff-halo")).depthMm).toBe(75);
  });

  it("falls back to the new configuration's default depth when it lacks the old one", () => {
    const prev = { ...defaultStateFor(byId("lp-5-trimless-face-lit")), depthMm: 75 };
    const flat = byId("lp-1-flat-cutout");
    expect(flat.depthOptionsMm).not.toContain(75);
    expect(switchConfig(prev, flat).depthMm).toBe(defaultStateFor(flat).depthMm);
  });

  it("always lands on one of the target's own depths", () => {
    for (const from of configurations) {
      for (const to of configurations) {
        const prev = { ...defaultStateFor(from), depthMm: from.depthOptionsMm[from.depthOptionsMm.length - 1] };
        expect(to.depthOptionsMm).toContain(switchConfig(prev, to).depthMm);
      }
    }
  });
});

describe("LP 1 finish and build", () => {
  const lp1 = byId("lp-1-flat-cutout");

  it("offers thinner depths for solid and thicker for fabricated", () => {
    const solid = defaultStateFor(lp1);
    expect(depthOptionsFor(lp1, solid)).toEqual([3, 5, 10, 20]);
    expect(depthOptionsFor(lp1, { build: "fabricated" })).toEqual([20, 50, 100, 200]);
  });

  it("moves the depth to the nearest step of the new build", () => {
    const fab = withBuild(defaultStateFor(lp1), "fabricated");
    expect(fab.build).toBe("fabricated");
    expect(fab.depthMm).toBe(20);
  });

  it("only metals can be fabricated: wood and acrylic fall back to solid", () => {
    const fab = withBuild(defaultStateFor(lp1), "fabricated");
    const wood = withFinish(fab, "wood");
    expect(wood.build).toBe("solid");
    expect(depthOptionsFor(lp1, wood)).toContain(wood.depthMm);
    expect(withBuild(wood, "fabricated").build).toBe("solid");
    expect(withFinish(fab, "corten").build).toBe("fabricated");
  });

  it("does not change the other configurations' depth lists", () => {
    const lp5 = byId("lp-5-trimless-face-lit");
    expect(depthOptionsFor(lp5, defaultStateFor(lp5))).toEqual(lp5.depthOptionsMm);
  });

  it("keeps the finish when switching away and back", () => {
    const s = withFinish(defaultStateFor(lp1), "corten");
    const there = switchConfig(s, byId("lp-11-f-face-lit"));
    expect(switchConfig(there, lp1).finish).toBe("corten");
  });
});

describe("mounting state", () => {
  it("starts flush where offered, standoff where it is the only option, and keeps the choice when the new system offers it", () => {
    expect(defaultStateFor(byId("lp-11-f-face-lit")).mounting).toBe("flush");
    expect(defaultStateFor(byId("lp-11-b-back-lit")).mounting).toBe("standoff");
    const standoff = { ...defaultStateFor(byId("lp-1-flat-cutout")), mounting: "standoff" as const };
    expect(switchConfig(standoff, byId("lp-11-fs-front-side-lit")).mounting).toBe("standoff");
    expect(switchConfig(standoff, byId("lp-11-s-side-lit")).mounting).toBe("flush"); // flush only
    expect(switchConfig({ ...standoff, mounting: "flush" }, byId("lp-3-1-standoff-halo")).mounting).toBe("standoff");
  });
});
