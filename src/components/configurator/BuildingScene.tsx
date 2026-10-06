import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { BUILDING_SECONDS, cameraPoseAt, fitToAspect, timeOfDay, type TimeOfDay } from "./buildingTime";
import ConfigScene from "./ConfigScene";
import { emitsLight, type ConfiguratorState } from "./types";
import type { LightConfig } from "../../data/configurations";

export const GROUND_Y = -5; // street level; the sign's centre is about 3.4 units (140 in) above it
const HEADER_FRONT_Z = -0.4;
const TOWER_FRONT_Z = -0.9;
const TOWER_SIZE = 12;
const TOWER_TOP = 140;

/** Uniforms every building shares: one object per name, so a single write per frame reaches all of them. */
function makeShared() {
  return {
    uLit: { value: 0 },
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSun: { value: new THREE.Color() },
    uSunAmt: { value: 1 },
  };
}
type Shared = ReturnType<typeof makeShared>;

const GLASS_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vUv = uv;
  vNormal = normal;
  vPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;

// A curtain wall: dark glass reflecting the sky, steel mullions, and one switch-on moment per window.
const GLASS_FRAGMENT = /* glsl */ `
uniform vec2 uCells;
uniform float uSeed;
uniform float uHaze;
uniform float uLit;
uniform float uSunAmt;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSun;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec3 col;
  if (vNormal.y > 0.5) {
    col = vec3(0.05, 0.055, 0.065) + uHorizon * 0.15;
  } else {
    vec2 g = vUv * uCells;
    vec2 cell = floor(g);
    vec2 f = fract(g);
    float r = hash(cell + uSeed);
    float height = clamp(vPos.y / 140.0, 0.0, 1.0);
    vec3 sky = mix(uHorizon, uZenith, clamp(height * 1.4 + 0.15, 0.0, 1.0));
    vec3 glass = mix(vec3(0.015, 0.02, 0.03), sky * 0.32, 0.78) * (0.85 + 0.3 * hash(cell + 9.0));
    glass += uSun * uSunAmt * 0.12 * smoothstep(0.55, 1.0, hash(cell + 3.0));
    float on = step(r, uLit * 0.72);
    vec3 warm = mix(vec3(1.0, 0.72, 0.38), vec3(0.75, 0.88, 1.0), step(0.82, hash(cell + 7.0)));
    glass = mix(glass, warm * (0.3 + 0.5 * hash(cell + 5.0)), on);
    float frame = max(max(step(f.x, 0.05), step(0.95, f.x)), max(step(f.y, 0.1), step(0.9, f.y)));
    vec3 steel = vec3(0.08, 0.085, 0.095) + sky * 0.12;
    col = mix(glass, steel, frame);
  }
  vec3 haze = mix(uHorizon, uZenith, 0.25);
  gl_FragColor = vec4(mix(col, haze, uHaze), 1.0);
}`;

interface BlockProps {
  position: [number, number, number];
  size: [number, number, number];
  cells: [number, number];
  seed: number;
  shared: Shared;
  haze?: number;
}

function GlassBlock({ position, size, cells, seed, shared, haze = 0 }: BlockProps) {
  const uniforms = useMemo(
    () => ({ ...shared, uCells: { value: new THREE.Vector2(...cells) }, uSeed: { value: seed }, uHaze: { value: haze } }),
    [shared, cells, seed, haze],
  );
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <shaderMaterial vertexShader={GLASS_VERTEX} fragmentShader={GLASS_FRAGMENT} uniforms={uniforms} />
    </mesh>
  );
}

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunAmt;
uniform vec3 uMoonDir;
uniform float uMoon;
uniform float uStars;
varying vec3 vDir;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float up = max(d.y, 0.0);
  vec3 col = mix(uHorizon, uZenith, pow(up, 0.55));

  float s = max(dot(d, uSunDir), 0.0);
  col += uSunColor * uSunAmt * (pow(s, 5.0) * 0.28 + pow(s, 40.0) * 0.7);
  col += uSunColor * (1.0 - smoothstep(0.0, 0.5, abs(d.y))) * pow(max(dot(normalize(d.xz), normalize(uSunDir.xz)), 0.0), 3.0) * 0.35 * (1.0 - uSunAmt * 0.6);
  col = mix(col, vec3(1.0, 0.97, 0.88) * 3.0, smoothstep(0.9988, 0.9994, s) * uSunAmt);

  vec3 p = d * 220.0;
  vec3 id = floor(p);
  float h = hash3(id);
  float twinkle = 0.65 + 0.35 * sin(h * 80.0);
  float star = step(0.9965, h) * smoothstep(0.45, 0.0, length(fract(p) - 0.5)) * twinkle;
  col += vec3(0.85, 0.9, 1.0) * star * uStars * smoothstep(0.02, 0.25, d.y);

  float m = max(dot(d, uMoonDir), 0.0);
  float disk = smoothstep(0.99925, 0.99935, m);
  float craters = 0.82 + 0.18 * hash3(floor(d * 900.0));
  col += vec3(0.93, 0.95, 1.0) * 1.6 * disk * craters * uMoon;
  col += vec3(0.6, 0.7, 1.0) * (pow(m, 250.0) * 0.45 + pow(m, 30.0) * 0.06) * uMoon;

  gl_FragColor = vec4(col, 1.0);
}`;

function Sky({ uniforms }: { uniforms: Record<string, THREE.IUniform> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  useFrame(() => mesh.current?.position.copy(camera.position), 3);
  return (
    <mesh ref={mesh} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[600, 48, 24]} />
      <shaderMaterial vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

/** A soft pool of lobby light on the pavement. */
function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    if (!g) return null;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,200,130,1)");
    grad.addColorStop(1, "rgba(255,200,130,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
}

/** The block, entrance and street around the sign. */
function Tower({ shared, lobby }: { shared: Shared; lobby: MutableRefObject<TimeOfDay> }) {
  const stone = useRef<THREE.MeshStandardMaterial>(null);
  const door = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const ground = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useGlowTexture();
  const base = GROUND_Y;

  useFrame(() => {
    const l = lobby.current.windowsLit;
    door.current?.color.setRGB(0.18 + 1.5 * l, 0.14 + 1.1 * l, 0.1 + 0.7 * l);
    if (pool.current) pool.current.opacity = 0.75 * l;
    const day = 1 - lobby.current.night;
    ground.current?.color.setRGB(0.06 + 0.2 * day, 0.065 + 0.2 * day, 0.075 + 0.21 * day);
    stone.current?.color.setRGB(0.12 + 0.3 * day, 0.12 + 0.28 * day, 0.125 + 0.26 * day);
  });

  const towerH = TOWER_TOP - base;
  const towerZ = TOWER_FRONT_Z - TOWER_SIZE / 2;
  return (
    <group>
      {/* The tower itself, glass from street to roof. */}
      <GlassBlock position={[0, base + towerH / 2, towerZ]} size={[TOWER_SIZE, towerH, TOWER_SIZE]} cells={[12, 37]} seed={1} shared={shared} />
      {/* Stone header over the entrance, which the sign's panel is fixed to. */}
      <mesh position={[0, 0, HEADER_FRONT_Z - 0.6]}>
        <boxGeometry args={[TOWER_SIZE + 0.8, 3.4, 1.2]} />
        <meshStandardMaterial ref={stone} color="#2a2c30" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Entrance doors, with the lobby light behind them. */}
      <mesh position={[0, base + 1.1, TOWER_FRONT_Z + 0.02]}>
        <planeGeometry args={[3.2, 2.2]} />
        <meshBasicMaterial ref={door} color="#2a2018" />
      </mesh>
      {glow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, base + 0.02, 2.2]}>
          <planeGeometry args={[11, 8]} />
          <meshBasicMaterial ref={pool} map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {/* Neighbours: nearer, lower blocks either side, then a skyline fading into haze. */}
      <GlassBlock position={[-17, base + 9, -8]} size={[14, 18, 14]} cells={[12, 5]} seed={4} shared={shared} />
      <GlassBlock position={[18, base + 13, -9]} size={[14, 26, 14]} cells={[12, 7]} seed={7} shared={shared} />
      <GlassBlock position={[-42, base + 45, -45]} size={[18, 90, 18]} cells={[18, 28]} seed={11} shared={shared} haze={0.3} />
      <GlassBlock position={[40, base + 55, -55]} size={[20, 110, 20]} cells={[20, 34]} seed={13} shared={shared} haze={0.35} />
      <GlassBlock position={[-8, base + 40, -90]} size={[24, 80, 24]} cells={[22, 25]} seed={17} shared={shared} haze={0.55} />
      <GlassBlock position={[70, base + 35, -85]} size={[22, 70, 22]} cells={[20, 22]} seed={19} shared={shared} haze={0.55} />
      <GlassBlock position={[-80, base + 30, -80]} size={[22, 60, 22]} cells={[20, 19]} seed={23} shared={shared} haze={0.6} />
      {/* Street. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, base, -20]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial ref={ground} color="#555960" roughness={0.9} />
      </mesh>
    </group>
  );
}

interface BuildingSceneProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  /** The film clock, 0-1. Written here while playing, by the slider otherwise. */
  clock: MutableRefObject<number>;
  playing: boolean;
  onTime: (t: number) => void;
  onEnd: () => void;
  /** The night amount the sign materials follow. */
  nightRef: MutableRefObject<number>;
}

export default function BuildingScene({ shapes, config, state, clock, playing, onTime, onEnd, nightRef }: BuildingSceneProps) {
  const shared = useMemo(makeShared, []);
  const skyUniforms = useMemo(
    () => ({
      uZenith: shared.uZenith,
      uHorizon: shared.uHorizon,
      uSunDir: { value: new THREE.Vector3() },
      uSunColor: shared.uSun,
      uSunAmt: shared.uSunAmt,
      uMoonDir: { value: new THREE.Vector3() },
      uMoon: { value: 0 },
      uStars: { value: 0 },
    }),
    [shared],
  );
  const tod = useRef<TimeOfDay>(timeOfDay(clock.current));
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const lastPose = useRef(-1);
  const lastReported = useRef(-1);
  const dark = emitsLight(config);

  useFrame((_, delta) => {
    if (playing) {
      clock.current = Math.min(1, clock.current + Math.min(delta, 0.1) / BUILDING_SECONDS);
      if (clock.current >= 1) onEnd();
    }
    const t = clock.current;
    if (Math.abs(t - lastReported.current) > 0.003 || t === 1 || t === 0) {
      lastReported.current = t;
      onTime(t);
    }
    const d = timeOfDay(t);
    tod.current = d;
    nightRef.current = d.night;

    shared.uLit.value = d.windowsLit;
    shared.uZenith.value.setRGB(...d.zenith);
    shared.uHorizon.value.setRGB(...d.horizon);
    shared.uSun.value.setRGB(...d.sunColor);
    shared.uSunAmt.value = d.sunStrength;
    skyUniforms.uSunDir.value.set(...d.sunDir);
    skyUniforms.uMoonDir.value.set(...d.moonDir);
    skyUniforms.uMoon.value = d.moon;
    skyUniforms.uStars.value = d.stars;

    // The sign's light stays on its face (the sun, as the camera sees it, is behind the tower): sunlight that warms and fades.
    if (key.current) {
      key.current.intensity = 0.3 + 1.1 * d.keyLight + (dark ? 0.15 : 0.4) * d.night;
      key.current.color.setRGB(...d.sunColor);
    }
    if (ambient.current) ambient.current.intensity = 0.1 + 0.25 * d.keyLight + 0.06 * d.night;
    scene.environmentIntensity = 0.1 * d.keyLight + 0.04;

    if (playing || lastPose.current !== t) {
      lastPose.current = t;
      const pose = fitToAspect(cameraPoseAt(t), size.width / size.height);
      camera.position.set(...pose.position);
      controls.current?.target.set(...pose.target);
      controls.current?.update();
    }
  });

  // Start from the right pose even when the clock is already part-way (reduced motion starts at night).
  useEffect(() => {
    lastPose.current = -1;
  }, [size.width, size.height]);

  return (
    <>
      <Sky uniforms={skyUniforms} />
      <ambientLight ref={ambient} intensity={0.3} />
      <directionalLight ref={key} position={[-2.5, 3, 6]} intensity={0.7} />
      <Environment files="/configurator/studio.hdr" />
      <Tower shared={shared} lobby={tod} />
      <ConfigScene shapes={shapes} config={config} state={state} facadeWidth={5.6} />
      <OrbitControls
        ref={controls}
        enabled={!playing}
        enablePan={false}
        minDistance={2.5}
        maxDistance={70}
        maxPolarAngle={Math.PI / 2 + 0.25}
        enableDamping={false}
      />
    </>
  );
}
