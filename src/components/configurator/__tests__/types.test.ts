import { describe, it, expect } from "vitest";
import { configurations } from "../../../data/configurations";
import { defaultStateFor, formatDepth, emitsLight } from "../types";

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

  it("starts in day mode with dark paint and a white glow", () => {
    const s = defaultStateFor(byId("lp-5-trimless-face-lit"));
    expect(s).toMatchObject({
      configId: "lp-5-trimless-face-lit",
      dayNight: "day",
      glowColor: "#ffffff",
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
