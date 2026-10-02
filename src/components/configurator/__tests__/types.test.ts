import { describe, it, expect } from "vitest";
import { configurations } from "../../../data/configurations";
import { defaultStateFor, isBelowMinHeight, formatDepth, emitsLight } from "../types";

const byId = (id: string) => configurations.find((c) => c.id === id)!;

describe("defaultStateFor", () => {
  it("starts every configuration on one of its own allowed depths", () => {
    for (const c of configurations) {
      expect(c.depthOptionsMm).toContain(defaultStateFor(c).depthMm);
    }
  });

  it("uses the family's customary depth: 50 mm stainless, 30 mm block acrylic, 5 mm flat cutout", () => {
    expect(defaultStateFor(byId("lp-5-trimless-face-lit")).depthMm).toBe(50);
    expect(defaultStateFor(byId("lp-3-1-standoff-halo")).depthMm).toBe(50);
    expect(defaultStateFor(byId("lp-11-f-face-lit")).depthMm).toBe(30);
    expect(defaultStateFor(byId("lp-11-b-back-lit")).depthMm).toBe(30);
    expect(defaultStateFor(byId("lp-1-flat-cutout")).depthMm).toBe(5);
  });

  it("starts in day mode with a 12 inch letter, dark paint and a white glow", () => {
    const s = defaultStateFor(byId("lp-5-trimless-face-lit"));
    expect(s).toMatchObject({
      configId: "lp-5-trimless-face-lit",
      dayNight: "day",
      letterHeightIn: 12,
      glowColor: "#ffffff",
    });
    expect(s.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("isBelowMinHeight", () => {
  const lp31 = byId("lp-3-1-standoff-halo"); // min 50 mm = 1.97 in
  const lp1 = byId("lp-1-flat-cutout"); // min 10 mm = 0.39 in

  it("flags letters shorter than the configuration's minimum height", () => {
    expect(isBelowMinHeight({ ...defaultStateFor(lp31), letterHeightIn: 1 }, lp31)).toBe(true);
  });

  it("does not flag letters at or above the minimum", () => {
    expect(isBelowMinHeight({ ...defaultStateFor(lp31), letterHeightIn: 2 }, lp31)).toBe(false);
    expect(isBelowMinHeight({ ...defaultStateFor(lp31), letterHeightIn: 12 }, lp31)).toBe(false);
  });

  it("uses each configuration's own minimum (LP 1 allows 0.4 inch letters)", () => {
    expect(isBelowMinHeight({ ...defaultStateFor(lp1), letterHeightIn: 0.5 }, lp1)).toBe(false);
    expect(isBelowMinHeight({ ...defaultStateFor(lp1), letterHeightIn: 0.3 }, lp1)).toBe(true);
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
