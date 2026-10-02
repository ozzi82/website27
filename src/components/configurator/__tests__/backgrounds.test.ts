import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  BACKGROUNDS,
  DEFAULT_BACKGROUND,
  getBackground,
  makeWallLook,
  wallLookAt,
} from "../backgrounds";
import { makeTileableNoise, mulberry32 } from "../wallNoise";

const luminance = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

describe("BACKGROUNDS", () => {
  it("offers concrete (the default, first), two more concretes and a brick wall, with unique ids and labels", () => {
    expect(BACKGROUNDS.map((b) => b.id)).toEqual(["concrete", "light-concrete", "warm-concrete", "brick"]);
    expect(new Set(BACKGROUNDS.map((b) => b.label)).size).toBe(4);
    expect(DEFAULT_BACKGROUND).toBe("concrete");
    expect(BACKGROUNDS.map((b) => b.label)).toEqual(["Concrete", "Light concrete", "Warm concrete", "Brick"]);
    // wood slats and white plaster are gone
    expect(BACKGROUNDS.some((b) => /wood|plaster/i.test(b.id + b.label))).toBe(false);
  });

  it("keeps the original concrete look exactly (the brochure wall)", () => {
    const concrete = getBackground("concrete");
    expect(concrete.day).toEqual({ color: "#8d929d", roughness: 0.92, bumpScale: 0.9, scene: "#2b3242" });
    expect(concrete.night).toEqual({ color: "#363a44", emissive: "#171a20", emissiveIntensity: 1, scene: "#04060a" });
    expect(concrete.tile).toEqual({ w: 6, h: 6 });
  });

  it("makes the light concrete clearly lighter than the concrete, and the warm one warmer", () => {
    const lum = (hex: string) => luminance(new THREE.Color(hex));
    expect(lum(getBackground("light-concrete").day.color)).toBeGreaterThan(lum(getBackground("concrete").day.color) * 1.25);
    const warm = new THREE.Color(getBackground("warm-concrete").day.color);
    const cool = new THREE.Color(getBackground("concrete").day.color);
    expect(warm.r - warm.b).toBeGreaterThan(cool.r - cool.b + 0.05);
  });

  it("gives each scene a valid texture tile size and halo modulation", () => {
    for (const b of BACKGROUNDS) {
      expect(b.tile.w).toBeGreaterThan(0);
      expect(b.tile.h).toBeGreaterThan(0);
      expect(b.haloModulation).toBeGreaterThanOrEqual(0);
      expect(b.haloModulation).toBeLessThanOrEqual(1);
    }
  });

  it("makes every wall darker at night than by day (so the glow carries the picture)", () => {
    for (const b of BACKGROUNDS) {
      const day = wallLookAt(b, 0, makeWallLook());
      const night = wallLookAt(b, 1, makeWallLook());
      expect(luminance(night.color)).toBeLessThan(luminance(day.color));
    }
  });
});

describe("getBackground", () => {
  it("looks a scene up by id and falls back to the default for an unknown id", () => {
    expect(getBackground("brick").id).toBe("brick");
    expect(getBackground("nope" as never).id).toBe("concrete");
    expect(getBackground("wood" as never).id).toBe("concrete"); // a removed scene
  });
});

describe("wallLookAt", () => {
  const brick = getBackground("brick");

  it("is the day look at 0 and the night look at 1", () => {
    const day = wallLookAt(brick, 0, makeWallLook());
    expect(day.color.getHexString()).toBe(new THREE.Color(brick.day.color).getHexString());
    expect(day.scene.getHexString()).toBe(new THREE.Color(brick.day.scene).getHexString());
    expect(day.emissiveIntensity).toBe(0);
    const night = wallLookAt(brick, 1, makeWallLook());
    expect(night.color.getHexString()).toBe(new THREE.Color(brick.night.color).getHexString());
    expect(night.emissive.getHexString()).toBe(new THREE.Color(brick.night.emissive).getHexString());
    expect(night.emissiveIntensity).toBe(brick.night.emissiveIntensity);
  });

  it("sits between the two at 0.5, and reuses the target it is given", () => {
    const target = makeWallLook();
    const mid = wallLookAt(brick, 0.5, target);
    expect(mid).toBe(target);
    const day = new THREE.Color(brick.day.color);
    const night = new THREE.Color(brick.night.color);
    expect(luminance(mid.color)).toBeLessThan(luminance(day));
    expect(luminance(mid.color)).toBeGreaterThan(luminance(night));
  });
});

describe("mulberry32", () => {
  it("is deterministic per seed and stays in [0, 1)", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const seq = Array.from({ length: 50 }, () => a());
    expect(seq).toEqual(Array.from({ length: 50 }, () => b()));
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(mulberry32(8)()).not.toBe(mulberry32(7)());
  });
});

describe("makeTileableNoise", () => {
  const noise = makeTileableNoise(8, 3);

  it("repeats seamlessly every 1.0 in both axes (so a wall texture tiles without seams)", () => {
    for (const [u, v] of [[0.13, 0.77], [0.5, 0.5], [0.99, 0.01], [0, 0]]) {
      expect(noise(u + 1, v)).toBeCloseTo(noise(u, v), 9);
      expect(noise(u, v + 1)).toBeCloseTo(noise(u, v), 9);
      expect(noise(u - 3, v + 2)).toBeCloseTo(noise(u, v), 9);
    }
  });

  it("is continuous across the tile edge", () => {
    expect(Math.abs(noise(0.9999, 0.3) - noise(0.0001, 0.3))).toBeLessThan(0.01);
  });

  it("stays in [0, 1], varies, and differs by seed", () => {
    const values: number[] = [];
    for (let i = 0; i < 400; i++) values.push(noise((i * 0.137) % 1, (i * 0.291) % 1));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.3);
    expect(makeTileableNoise(8, 4)(0.31, 0.62)).not.toBeCloseTo(noise(0.31, 0.62), 3);
  });
});
