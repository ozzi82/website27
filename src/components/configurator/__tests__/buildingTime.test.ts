import { describe, expect, it } from "vitest";
import { BUILDING_SECONDS, cameraPoseAt, fitToAspect, skyAt, timeOfDay } from "../buildingTime";

describe("building time of day", () => {
  it("runs fifteen seconds", () => expect(BUILDING_SECONDS).toBe(15));

  it("starts as a sunny day with the sign and windows off", () => {
    const d = timeOfDay(0);
    expect(d.night).toBe(0);
    expect(d.windowsLit).toBe(0);
    expect(d.moon).toBe(0);
    expect(d.stars).toBe(0);
    expect(d.sunStrength).toBe(1);
    expect(d.sunDir[1]).toBeGreaterThan(0.6);
  });

  it("ends at night with moon, stars, lit windows and the sign on", () => {
    const d = timeOfDay(1);
    expect(d.night).toBe(1);
    expect(d.windowsLit).toBe(1);
    expect(d.moon).toBe(1);
    expect(d.stars).toBe(1);
    expect(d.sunStrength).toBe(0);
    expect(d.sunDir[1]).toBeLessThan(0);
    expect(d.moonDir[1]).toBeGreaterThan(0.25);
  });

  it("lowers the sun, then lights the sign and windows gradually (never going backwards)", () => {
    let prev = timeOfDay(0);
    for (let i = 1; i <= 100; i++) {
      const d = timeOfDay(i / 100);
      expect(d.sunDir[1]).toBeLessThanOrEqual(prev.sunDir[1] + 1e-9);
      expect(d.night).toBeGreaterThanOrEqual(prev.night - 1e-9);
      expect(d.windowsLit).toBeGreaterThanOrEqual(prev.windowsLit - 1e-9);
      expect(d.moon).toBeGreaterThanOrEqual(prev.moon - 1e-9);
      prev = d;
    }
  });

  it("is still day at the halfway point's start and the sign is only partly on mid-dusk", () => {
    expect(timeOfDay(0.4).night).toBe(0);
    const mid = timeOfDay(0.72).night;
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(0.9);
  });

  it("clamps out-of-range times", () => {
    expect(timeOfDay(-3)).toEqual(timeOfDay(0));
    expect(timeOfDay(9)).toEqual(timeOfDay(1));
    expect(skyAt(2)).toEqual(skyAt(1));
  });

  it("moves the camera from close on the sign to a wider view", () => {
    const a = cameraPoseAt(0);
    const b = cameraPoseAt(1);
    expect(a.position[2]).toBeLessThan(7);
    expect(b.position[2]).toBeGreaterThan(30);
    expect(cameraPoseAt(2)).toEqual(b);
  });

  it("backs the camera off on a narrow screen only", () => {
    const pose = cameraPoseAt(0);
    expect(fitToAspect(pose, 1.8)).toEqual(pose);
    expect(fitToAspect(pose, 0.5).position[2]).toBeGreaterThan(pose.position[2]);
  });
});
