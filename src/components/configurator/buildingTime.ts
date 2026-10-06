import { easeInOut, lerp } from "./nightFade";

/** Seconds the whole film takes: 15 of day-to-night, then a 3 second zoom in on the lit sign. */
export const BUILDING_SECONDS = 18;
/** Share of the film (0-1) taken by the day-to-night part; the rest is the close-up. */
export const SCENE_SHARE = 15 / 18;
const sceneTime = (t: number) => Math.min(1, Math.max(0, t) / SCENE_SHARE);

export type Vec3 = [number, number, number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0 before `a`, 1 after `b`, eased in between. */
export const ramp = (t: number, a: number, b: number) => easeInOut(clamp01((t - a) / (b - a)));

const hex = (h: number): Vec3 => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const mix = (a: Vec3, b: Vec3, k: number): Vec3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

interface SkyStop {
  t: number;
  zenith: Vec3;
  horizon: Vec3;
}

// Clear afternoon -> low sun -> sunset glow -> dusk -> night.
const SKY: SkyStop[] = [
  { t: 0, zenith: hex(0x2f78d0), horizon: hex(0xb4d4f0) },
  { t: 0.38, zenith: hex(0x3a78c0), horizon: hex(0xd6dfe4) },
  { t: 0.55, zenith: hex(0x3a4a8c), horizon: hex(0xffa050) },
  { t: 0.66, zenith: hex(0x262a66), horizon: hex(0xe0587a) },
  { t: 0.78, zenith: hex(0x10153c), horizon: hex(0x6a3a78) },
  { t: 0.9, zenith: hex(0x060a22), horizon: hex(0x1e2456) },
  { t: 1, zenith: hex(0x03050f), horizon: hex(0x0f1636) },
];

export function skyAt(t: number): { zenith: Vec3; horizon: Vec3 } {
  const x = clamp01(t);
  for (let i = 1; i < SKY.length; i++) {
    if (x <= SKY[i].t) {
      const a = SKY[i - 1];
      const b = SKY[i];
      const k = easeInOut((x - a.t) / (b.t - a.t));
      return { zenith: mix(a.zenith, b.zenith, k), horizon: mix(a.horizon, b.horizon, k) };
    }
  }
  return { zenith: SKY[SKY.length - 1].zenith, horizon: SKY[SKY.length - 1].horizon };
}

export interface TimeOfDay {
  zenith: Vec3;
  horizon: Vec3;
  /** Sun direction on the sky dome (kept in view of the camera) and its strength: 0 once it is below the horizon. */
  sunDir: Vec3;
  sunStrength: number;
  sunColor: Vec3;
  moonDir: Vec3;
  moon: number;
  stars: number;
  /** Share of office windows switched on, 0-1 (each window has its own switch-on moment). */
  windowsLit: number;
  /** 0 = day, 1 = night: drives the sign's own glow and the tone mapper, the same amount the configurator's day/night toggle uses. */
  night: number;
  /** Strength of the light on the sign: sunlight fading to nothing. */
  keyLight: number;
  /** Warmth of the key light, 0 = white noon, 1 = deep orange. */
  keyWarmth: number;
}

const SUN_AZIMUTH = (-26 * Math.PI) / 180; // left of the tower as the camera sees it
const SUN_SET = 0.6; // time the sun touches the horizon

function direction(azimuth: number, elevation: number): Vec3 {
  const c = Math.cos(elevation);
  return [Math.sin(azimuth) * c, Math.sin(elevation), -Math.cos(azimuth) * c];
}

/** Everything that changes with the clock; `t` runs 0 (sunny afternoon) to 1 (night). */
export function timeOfDay(t: number): TimeOfDay {
  const x = sceneTime(t);
  const sky = skyAt(x);
  const sunElev = lerp(50, -10, easeInOut(clamp01(x / (SUN_SET / 0.833)))) * (Math.PI / 180);
  const low = 1 - clamp01((Math.sin(sunElev) - 0) / 0.35); // 0 high sun, 1 on the horizon
  const moonElev = lerp(8, 25, ramp(x, 0.6, 1)) * (Math.PI / 180);
  return {
    ...sky,
    sunDir: direction(SUN_AZIMUTH, sunElev),
    sunStrength: 1 - ramp(x, SUN_SET - 0.03, SUN_SET + 0.07),
    sunColor: mix([1, 0.96, 0.85], [1, 0.52, 0.2], low),
    moonDir: direction((-22 * Math.PI) / 180, moonElev),
    moon: ramp(x, 0.64, 0.86),
    stars: ramp(x, 0.7, 0.95),
    windowsLit: ramp(x, 0.5, 0.98),
    night: ramp(x, 0.52, 0.94),
    keyLight: 1 - ramp(x, 0.45, 0.78),
    keyWarmth: ramp(x, 0.3, 0.6),
  };
}

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

// Close on the sign in daylight, pulling back and up as the sun goes, settling on a medium view with the moon beside the tower.
const POSES: { t: number; pose: CameraPose }[] = [
  { t: 0, pose: { position: [1.4, -0.4, 6.4], target: [0, 0.1, 0] } },
  { t: 0.42, pose: { position: [-5, -2.5, 20], target: [0, 2, 0] } },
  { t: 0.72, pose: { position: [-3, -2.7, 36], target: [0, 5, 0] } },
  { t: 1, pose: { position: [5, -2.6, 46], target: [0, 9, 0] } },
];

export function cameraPoseAt(t: number): CameraPose {
  const x = sceneTime(t);
  for (let i = 1; i < POSES.length; i++) {
    if (x <= POSES[i].t) {
      const a = POSES[i - 1];
      const b = POSES[i];
      const k = easeInOut((x - a.t) / (b.t - a.t));
      return { position: mix(a.pose.position, b.pose.position, k), target: mix(a.pose.target, b.pose.target, k) };
    }
  }
  return POSES[POSES.length - 1].pose;
}

/** Pulls the camera back along its line of sight on narrow (phone) screens so the sign still fits across. */
export function fitToAspect(pose: CameraPose, aspect: number): CameraPose {
  const k = Math.max(1, 1.4 / Math.max(aspect, 0.2));
  const [px, py, pz] = pose.position;
  const [tx, ty, tz] = pose.target;
  return { target: pose.target, position: [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k] };
}

/** Floor height in world units: a 100 in wide sign is 2.4 units across, so 1 unit is about 41.7 in and a 156 in floor is about 3.74 units. */
export const FLOOR_UNITS = 3.74;

const FOV_TAN = Math.tan((35 * Math.PI) / 360); // half of the 35 degree vertical field of view
/** Share of the picture width or height the sign fills in the close-up. */
export const CLOSE_UP_FILL = 0.6;

/** Straight-on view with the sign filling `CLOSE_UP_FILL` of the screen (its width or its height, whichever limits), slightly off-axis so the depth shows. */
export function closeUpPose(aspect: number, sign: { w: number; h: number }): CameraPose {
  const a = Math.max(aspect, 0.2);
  const distance = Math.max(sign.w / (2 * FOV_TAN * a), sign.h / (2 * FOV_TAN)) / CLOSE_UP_FILL;
  return { position: [distance * 0.14, distance * 0.02, distance * 0.99], target: [0, 0, 0] };
}

/** The camera at film time `t` for this screen and sign: the day-to-night move, then the zoom onto the sign over the last seconds. */
export function framedPose(t: number, aspect: number, sign: { w: number; h: number }): CameraPose {
  const overview = fitToAspect(cameraPoseAt(t), aspect);
  if (t <= SCENE_SHARE) return overview;
  const k = easeInOut((t - SCENE_SHARE) / (1 - SCENE_SHARE));
  const close = closeUpPose(aspect, sign);
  return { position: mix(overview.position, close.position, k), target: mix(overview.target, close.target, k) };
}
