import { describe, expect, it } from "vitest";
import { BUILDING_SECONDS, CLOSE_UP_FILL, SCENE_SHARE, cameraPoseAt, closeUpPose, fitToAspect, framedPose, skyAt, timeOfDay } from "../buildingTime";

describe("building time of day", () => {
  it("runs 15 seconds of day-to-night plus a 3 second close-up", () => {
    expect(BUILDING_SECONDS).toBe(18);
    expect(SCENE_SHARE * BUILDING_SECONDS).toBeCloseTo(15);
  });

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
    expect(timeOfDay(0.4 * SCENE_SHARE).night).toBe(0);
    const mid = timeOfDay(0.72 * SCENE_SHARE).night;
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

  it("stays at night during the close-up", () => {
    expect(timeOfDay(1)).toEqual(timeOfDay(SCENE_SHARE));
    expect(timeOfDay(1).night).toBe(1);
  });

  it("zooms to a view where the sign fills 60% of the screen across", () => {
    const sign = { w: 2.4, h: 0.7 };
    const aspect = 16 / 9;
    const pose = framedPose(1, aspect, sign);
    const distance = Math.hypot(...pose.position);
    const visibleWidth = 2 * Math.tan((35 * Math.PI) / 360) * distance * aspect;
    expect(sign.w / visibleWidth).toBeCloseTo(CLOSE_UP_FILL, 1);
    expect(pose.target).toEqual([0, 0, 0]);
  });

  it("fits a tall sign by its height, and a narrow screen by its width", () => {
    const tall = closeUpPose(16 / 9, { w: 1, h: 2.4 });
    const wide = closeUpPose(16 / 9, { w: 2.4, h: 0.7 });
    expect(tall.position[2]).toBeGreaterThan(wide.position[2] * 0.9);
    const phone = closeUpPose(0.5, { w: 2.4, h: 0.7 });
    expect(phone.position[2]).toBeGreaterThan(wide.position[2]);
  });

  it("leaves the overview alone until the close-up starts", () => {
    expect(framedPose(SCENE_SHARE, 1.8, { w: 2.4, h: 0.7 })).toEqual(fitToAspect(cameraPoseAt(1), 1.8));
  });

  it("moves the opening shot out for a bigger sign and back in for a smaller one, and agrees once the camera has pulled back", () => {
    const sign = { w: 2.4, h: 0.7 };
    const base = framedPose(0, 1.8, sign);
    const big = framedPose(0, 1.8, sign, 3);
    const small = framedPose(0, 1.8, sign, 0.5);
    const dist = (p: { position: number[]; target: number[] }) => Math.hypot(p.position[0] - p.target[0], p.position[1] - p.target[1], p.position[2] - p.target[2]);
    expect(dist(big)).toBeCloseTo(3 * dist(base), 6);
    expect(dist(small)).toBeCloseTo(0.5 * dist(base), 6);
    expect(framedPose(0.5, 1.8, sign, 3)).toEqual(framedPose(0.5, 1.8, sign));
  });
});
