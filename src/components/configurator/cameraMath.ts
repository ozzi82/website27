import * as THREE from "three";

/** A camera placement around the target: distance, azimuth (from +Z toward +X) and polar angle (from +Y), as THREE.Spherical. */
export interface View {
  radius: number;
  theta: number;
  phi: number;
}

const deg = (d: number) => (d * Math.PI) / 180;

/** The existing three-quarter view the preview opens in (and resets to). */
export const HOME_POSITION: [number, number, number] = [2.6, 1.42, 4.73];

/** What the camera orbits: the centre of the artwork (artwork is normalised to the origin). */
export const VIEW_TARGET = new THREE.Vector3(0, 0, 0);

export const VIEW_LIMITS = {
  // The artwork is normalised to 2.4 units across, so closer than that would put the camera
  // inside a deep letter; much further and the sign becomes a speck.
  minRadius: 2.4,
  maxRadius: 9.5,
  // Stay in front of the wall (it is a plane): about 60 degrees either side of straight on.
  minTheta: -deg(60),
  maxTheta: deg(60),
  // From a high three-quarter look down to just below eye level, never under the sign or over its top.
  minPhi: deg(40),
  maxPhi: deg(98),
};

type Limits = typeof VIEW_LIMITS;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function viewFromPosition(position: THREE.Vector3, target: THREE.Vector3 = VIEW_TARGET): View {
  const s = new THREE.Spherical().setFromVector3(position.clone().sub(target));
  return { radius: s.radius, theta: s.theta, phi: s.phi };
}

export function positionFromView(view: View, target: THREE.Vector3 = VIEW_TARGET, out = new THREE.Vector3()): THREE.Vector3 {
  const sinPhi = Math.sin(view.phi);
  return out.set(
    view.radius * sinPhi * Math.sin(view.theta),
    view.radius * Math.cos(view.phi),
    view.radius * sinPhi * Math.cos(view.theta)
  ).add(target);
}

export const HOME_VIEW: View = viewFromPosition(new THREE.Vector3(...HOME_POSITION));

export function clampView(view: View, limits: Limits = VIEW_LIMITS): View {
  return {
    radius: clamp(view.radius, limits.minRadius, limits.maxRadius),
    theta: clamp(view.theta, limits.minTheta, limits.maxTheta),
    phi: clamp(view.phi, limits.minPhi, limits.maxPhi),
  };
}

/** Moves the camera nearer (factor < 1) or further (factor > 1), within the limits. */
export function zoomView(view: View, factor: number): View {
  return clampView({ ...view, radius: view.radius * factor });
}

/** Orbits by the given angles (radians), within the limits. */
export function rotateView(view: View, dTheta: number, dPhi: number): View {
  return clampView({ ...view, theta: view.theta + dTheta, phi: view.phi + dPhi });
}

const DAMP_RATE = 9; // per second: a button press settles in roughly a third of a second

/** Exponential approach to `goal`; frame-rate independent. */
export function dampView(current: View, goal: View, dt: number, rate = DAMP_RATE): View {
  if (!(dt > 0)) return current;
  const f = 1 - Math.exp(-rate * dt);
  return {
    radius: current.radius + (goal.radius - current.radius) * f,
    theta: current.theta + (goal.theta - current.theta) * f,
    phi: current.phi + (goal.phi - current.phi) * f,
  };
}

export function viewsClose(a: View, b: View): boolean {
  return Math.abs(a.radius - b.radius) < 0.005 && Math.abs(a.theta - b.theta) < 0.001 && Math.abs(a.phi - b.phi) < 0.001;
}

/**
 * Wheel events over the preview zoom it, which would trap the page's own scrolling. Once the
 * wheel can zoom no further in the direction it is turned, hand the event back to the page.
 */
export function shouldPassWheelToPage(radius: number, deltaY: number, limits: Limits = VIEW_LIMITS): boolean {
  const eps = 1e-3;
  if (deltaY > 0) return radius >= limits.maxRadius - eps; // zooming out
  if (deltaY < 0) return radius <= limits.minRadius + eps; // zooming in
  return false;
}
