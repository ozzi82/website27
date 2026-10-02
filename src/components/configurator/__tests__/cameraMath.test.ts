import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  HOME_POSITION,
  HOME_VIEW,
  VIEW_LIMITS,
  VIEW_TARGET,
  clampView,
  dampView,
  positionFromView,
  rotateView,
  shouldPassWheelToPage,
  viewFromPosition,
  viewsClose,
  zoomView,
} from "../cameraMath";

const deg = (d: number) => (d * Math.PI) / 180;

describe("viewFromPosition / positionFromView", () => {
  it("round-trips a camera position about the target", () => {
    const pos = new THREE.Vector3(2.6, 1.42, 4.73);
    const back = positionFromView(viewFromPosition(pos, VIEW_TARGET), VIEW_TARGET);
    expect(back.distanceTo(pos)).toBeLessThan(1e-9);
  });

  it("measures azimuth from +Z toward +X and polar angle from +Y, like THREE.Spherical", () => {
    const v = viewFromPosition(new THREE.Vector3(3, 0, 0), VIEW_TARGET);
    expect(v.radius).toBeCloseTo(3, 9);
    expect(v.theta).toBeCloseTo(Math.PI / 2, 9);
    expect(v.phi).toBeCloseTo(Math.PI / 2, 9);
    const s = new THREE.Spherical().setFromVector3(new THREE.Vector3(1, 2, 3));
    const mine = viewFromPosition(new THREE.Vector3(1, 2, 3), VIEW_TARGET);
    expect([mine.radius, mine.theta, mine.phi]).toEqual([s.radius, s.theta, s.phi]);
  });

  it("honours a non-origin target", () => {
    const v = viewFromPosition(new THREE.Vector3(1, 2, 8), new THREE.Vector3(1, 2, 3));
    expect(v.radius).toBeCloseTo(5, 9);
    expect(v.theta).toBeCloseTo(0, 9);
  });
});

describe("VIEW_LIMITS and the home view", () => {
  it("starts at the existing three-quarter camera and inside every limit", () => {
    expect(HOME_POSITION).toEqual([2.6, 1.42, 4.73]);
    const unclamped = clampView(HOME_VIEW);
    expect(unclamped.radius).toBeCloseTo(HOME_VIEW.radius, 9);
    expect(unclamped.theta).toBeCloseTo(HOME_VIEW.theta, 9);
    expect(unclamped.phi).toBeCloseTo(HOME_VIEW.phi, 9);
  });

  it("keeps the viewer in front of the wall and above the floor: about +-60 degrees azimuth, a bounded polar range", () => {
    expect(VIEW_LIMITS.minTheta).toBeCloseTo(-deg(60), 9);
    expect(VIEW_LIMITS.maxTheta).toBeCloseTo(deg(60), 9);
    expect(VIEW_LIMITS.minPhi).toBeGreaterThan(deg(20));
    expect(VIEW_LIMITS.maxPhi).toBeLessThan(deg(105));
  });

  it("never lets the camera get inside the sign or lose it: the nearest approach clears the 2.4 unit artwork", () => {
    expect(VIEW_LIMITS.minRadius).toBeGreaterThanOrEqual(2.4);
    expect(VIEW_LIMITS.maxRadius).toBeGreaterThan(HOME_VIEW.radius);
    expect(VIEW_LIMITS.maxRadius).toBeLessThanOrEqual(12);
  });
});

describe("clampView", () => {
  it("pulls each component back inside its limit", () => {
    const v = clampView({ radius: 50, theta: deg(170), phi: deg(5) });
    expect(v).toEqual({ radius: VIEW_LIMITS.maxRadius, theta: VIEW_LIMITS.maxTheta, phi: VIEW_LIMITS.minPhi });
    const w = clampView({ radius: 0.1, theta: -deg(170), phi: deg(170) });
    expect(w).toEqual({ radius: VIEW_LIMITS.minRadius, theta: VIEW_LIMITS.minTheta, phi: VIEW_LIMITS.maxPhi });
  });
});

describe("zoomView", () => {
  it("scales the distance and stops at the limits", () => {
    expect(zoomView(HOME_VIEW, 0.5).radius).toBeCloseTo(Math.max(VIEW_LIMITS.minRadius, HOME_VIEW.radius * 0.5), 9);
    expect(zoomView({ ...HOME_VIEW, radius: 3 }, 0.1).radius).toBe(VIEW_LIMITS.minRadius);
    expect(zoomView({ ...HOME_VIEW, radius: 9 }, 10).radius).toBe(VIEW_LIMITS.maxRadius);
  });

  it("leaves the direction alone", () => {
    const z = zoomView(HOME_VIEW, 0.8);
    expect(z.theta).toBe(HOME_VIEW.theta);
    expect(z.phi).toBe(HOME_VIEW.phi);
  });
});

describe("rotateView", () => {
  it("turns by the given angles, clamped to the limits", () => {
    const r = rotateView(HOME_VIEW, -deg(10), deg(5));
    expect(r.theta).toBeCloseTo(HOME_VIEW.theta - deg(10), 9);
    expect(r.phi).toBeCloseTo(HOME_VIEW.phi + deg(5), 9);
    expect(rotateView(HOME_VIEW, deg(200), 0).theta).toBe(VIEW_LIMITS.maxTheta);
    expect(rotateView(HOME_VIEW, 0, -deg(200)).phi).toBe(VIEW_LIMITS.minPhi);
    expect(rotateView(HOME_VIEW, 0, 0).radius).toBe(HOME_VIEW.radius);
  });
});

describe("dampView", () => {
  const far = { radius: 3, theta: -deg(40), phi: deg(60) };

  it("moves toward the goal without overshooting", () => {
    const next = dampView(HOME_VIEW, far, 0.05);
    for (const k of ["radius", "theta", "phi"] as const) {
      const lo = Math.min(HOME_VIEW[k], far[k]);
      const hi = Math.max(HOME_VIEW[k], far[k]);
      expect(next[k]).toBeGreaterThanOrEqual(lo);
      expect(next[k]).toBeLessThanOrEqual(hi);
      expect(next[k]).not.toBe(HOME_VIEW[k]);
    }
  });

  it("converges to the goal and is a no-op for zero time", () => {
    let v = HOME_VIEW;
    for (let i = 0; i < 120; i++) v = dampView(v, far, 1 / 60);
    expect(viewsClose(v, far)).toBe(true);
    expect(dampView(HOME_VIEW, far, 0)).toEqual(HOME_VIEW);
  });

  it("is frame-rate independent (two half steps ~ one full step)", () => {
    const one = dampView(HOME_VIEW, far, 0.1);
    const two = dampView(dampView(HOME_VIEW, far, 0.05), far, 0.05);
    expect(two.radius).toBeCloseTo(one.radius, 6);
    expect(two.theta).toBeCloseTo(one.theta, 6);
  });
});

describe("viewsClose", () => {
  it("is true only when radius and both angles are all within a small tolerance", () => {
    expect(viewsClose(HOME_VIEW, { ...HOME_VIEW })).toBe(true);
    expect(viewsClose(HOME_VIEW, { ...HOME_VIEW, radius: HOME_VIEW.radius + 0.5 })).toBe(false);
    expect(viewsClose(HOME_VIEW, { ...HOME_VIEW, theta: HOME_VIEW.theta + 0.1 })).toBe(false);
  });
});

describe("shouldPassWheelToPage", () => {
  it("lets the page scroll once the wheel can zoom no further (so the preview never traps the page)", () => {
    expect(shouldPassWheelToPage(VIEW_LIMITS.maxRadius, +100)).toBe(true); // zooming out at the far limit
    expect(shouldPassWheelToPage(VIEW_LIMITS.minRadius, -100)).toBe(true); // zooming in at the near limit
  });

  it("keeps the wheel for zooming everywhere else, including away from a limit", () => {
    expect(shouldPassWheelToPage(HOME_VIEW.radius, +100)).toBe(false);
    expect(shouldPassWheelToPage(HOME_VIEW.radius, -100)).toBe(false);
    expect(shouldPassWheelToPage(VIEW_LIMITS.maxRadius, -100)).toBe(false); // can still zoom in
    expect(shouldPassWheelToPage(VIEW_LIMITS.minRadius, +100)).toBe(false); // can still zoom out
  });

  it("ignores a zero delta", () => {
    expect(shouldPassWheelToPage(VIEW_LIMITS.maxRadius, 0)).toBe(false);
  });
});
