import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import ConfigScene from "./ConfigScene";
import { useNightEffect } from "./NightContext";
import { atmosphereFor, lerp } from "./nightFade";
import { distanceToFill } from "./photoMath";
import { wallGapFor } from "./renderMath";
import { emitsLight, type ConfiguratorState } from "./types";
import type { LightConfig } from "../../data/configurations";

export const PHOTO_FOV = 35;

export interface PhotoPlacement {
  /** Sign position on the photo, in world units from the photo's centre. */
  x: number;
  y: number;
  /** Extra scale on top of true size (1 once the photo is measured). */
  scale: number;
  /** Turn about the vertical axis, degrees: fakes the photo's perspective. */
  yaw: number;
  /** Turn in the picture plane, degrees. */
  roll: number;
}

interface PhotoSceneProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  texture: THREE.Texture;
  /** Photo size in world units. */
  size: { w: number; h: number };
  placement: MutableRefObject<PhotoPlacement>;
}

// Night: the photo dims and cools so the sign carries the picture.
const NIGHT_PHOTO = new THREE.Color(0.1, 0.12, 0.2);
const DAY_PHOTO = new THREE.Color(1, 1, 1);

/** The customer's photo as the wall, with the sign standing in front of it: same material, glow and shadow code as the main preview. */
export default function PhotoScene({ shapes, config, state, texture, size, placement }: PhotoSceneProps) {
  const dark = emitsLight(config);
  const gap = wallGapFor(state.mounting, state.sizeIn);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);

  const rig = useRef<THREE.Group>(null); // moves with the sign: the lights and the shadow catcher follow it
  const sign = useRef<THREE.Group>(null); // scale and rotation of the sign itself
  const ambient = useRef<THREE.AmbientLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const sunTarget = useRef<THREE.Object3D>(null);
  const point = useRef<THREE.PointLight>(null);
  const photo = useRef<THREE.MeshBasicMaterial>(null);
  const shadow = useRef<THREE.ShadowMaterial>(null);
  const shown = useRef({ scale: -1 });

  useLayoutEffect(() => {
    camera.position.set(0, 0, distanceToFill(size.h, PHOTO_FOV));
    camera.updateProjectionMatrix();
  }, [camera, size.h]);

  useEffect(() => {
    if (sun.current && sunTarget.current) sun.current.target = sunTarget.current;
  }, []);

  useFrame(() => {
    const p = placement.current;
    rig.current?.position.set(p.x, p.y, 0);
    if (sign.current) {
      sign.current.scale.setScalar(p.scale);
      sign.current.rotation.set(0, (p.yaw * Math.PI) / 180, (p.roll * Math.PI) / 180);
    }
    // The shadow map has to cover the sign at its current scale.
    const light = sun.current;
    if (light && shown.current.scale !== p.scale) {
      shown.current.scale = p.scale;
      const b = 3 * Math.max(1, p.scale) + 0.5;
      light.shadow.camera.left = -b;
      light.shadow.camera.right = b;
      light.shadow.camera.top = b;
      light.shadow.camera.bottom = -b;
      light.shadow.camera.updateProjectionMatrix();
    }
  });

  useNightEffect((n) => {
    const a = atmosphereFor(n, dark);
    if (ambient.current) ambient.current.intensity = a.ambient;
    if (sun.current) sun.current.intensity = a.directional;
    if (point.current) point.current.intensity = a.point;
    scene.environmentIntensity = a.environment;
    photo.current?.color.lerpColors(DAY_PHOTO, NIGHT_PHOTO, n);
    if (shadow.current) shadow.current.opacity = lerp(0.35, 0.12, n);
  });

  const catcher = useMemo(() => new THREE.PlaneGeometry(60, 60), []);
  useEffect(() => () => catcher.dispose(), [catcher]);

  return (
    <>
      <color attach="background" args={["#000000"]} />
      {/* The photo itself: unlit, so it keeps the colours it was taken with. */}
      <mesh position={[0, 0, -gap - 0.002]}>
        <planeGeometry args={[size.w, size.h]} />
        <meshBasicMaterial ref={photo} map={texture} toneMapped={false} />
      </mesh>

      <group ref={rig}>
        <ambientLight ref={ambient} intensity={0.05} />
        <directionalLight
          ref={sun}
          position={[3, 5, 4]}
          intensity={0.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-bias={-0.0004}
          shadow-normalBias={0.004}
        />
        <object3D ref={sunTarget} />
        <pointLight ref={point} position={[-1.8, 1.5, 1.8]} intensity={9} />
        {/* Catches the sign's shadow on the photo without lighting it. */}
        <mesh geometry={catcher} position={[0, 0, -gap - 0.001]} receiveShadow>
          <shadowMaterial ref={shadow} transparent opacity={0.35} />
        </mesh>
        <group ref={sign}>
          <ConfigScene shapes={shapes} config={config} state={state} bare />
        </group>
      </group>
      <Environment files="/configurator/studio.hdr" />
    </>
  );
}
