import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  HOME_VIEW,
  VIEW_LIMITS,
  VIEW_TARGET,
  clampTarget,
  clampView,
  dampView,
  positionFromView,
  rotateView,
  shouldPassWheelToPage,
  viewFromPosition,
  viewsClose,
  zoomView,
  type View,
} from "./cameraMath";

/** What the buttons and keys outside the canvas can ask of the camera. */
export interface CameraApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  rotate: (dTheta: number, dPhi: number) => void;
  /** Where the camera is looking from and at, for renders that start from the current view. */
  getPose: () => { position: [number, number, number]; target: [number, number, number] };
}

const ZOOM_STEP = 0.78;

/**
 * Orbit camera: drag to rotate, wheel / pinch to zoom (very close is allowed), right-drag or two fingers to pan, damped,
 * limited so the sign cannot be lost or the camera pushed behind the wall. Commands from outside the
 * canvas ease toward a goal view (and back to the middle of the sign) instead of jumping; grabbing the scene cancels them.
 */
const CameraRig = forwardRef<CameraApi>(function CameraRig(_props, ref) {
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<View | null>(null);
  const goalTarget = useRef<THREE.Vector3 | null>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const target = () => controls.current?.target ?? VIEW_TARGET;
  const current = () => viewFromPosition(camera.position, target());
  // Successive presses build on the pending goal rather than where the camera happens to be mid-ease.
  const base = () => goal.current ?? current();

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => (goal.current = zoomView(base(), ZOOM_STEP)),
      zoomOut: () => (goal.current = zoomView(base(), 1 / ZOOM_STEP)),
      reset: () => {
        goal.current = HOME_VIEW;
        goalTarget.current = VIEW_TARGET.clone();
      },
      rotate: (dTheta, dPhi) => (goal.current = rotateView(base(), dTheta, dPhi)),
      getPose: () => ({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [target().x, target().y, target().z],
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camera]
  );

  // Runs before the controls' own update so the controls always damp from where the camera is.
  useFrame((_, delta) => {
    const goalView = goal.current;
    if (!goalView) return;
    const next = dampView(current(), clampView(goalView), delta);
    const c = controls.current;
    const gt = goalTarget.current;
    if (c && gt) c.target.lerp(gt, 1 - Math.exp(-9 * delta));
    positionFromView(next, target(), camera.position);
    c?.update();
    if (viewsClose(next, goalView) && (!gt || !c || c.target.distanceTo(gt) < 0.005)) {
      goal.current = null;
      goalTarget.current = null;
    }
  }, -2);

  // The wheel zooms the preview; once it can zoom no further, let the page scroll instead of trapping it.
  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (!host) return;
    const onWheel = (e: WheelEvent) => {
      if (shouldPassWheelToPage(camera.position.distanceTo(controls.current?.target ?? VIEW_TARGET), e.deltaY)) e.stopPropagation();
    };
    host.addEventListener("wheel", onWheel, { capture: true });
    return () => host.removeEventListener("wheel", onWheel, { capture: true });
  }, [gl, camera]);

  return (
    <OrbitControls
      ref={controls}
      target={VIEW_TARGET}
      enablePan
      screenSpacePanning
      panSpeed={0.8}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      minDistance={VIEW_LIMITS.minRadius}
      maxDistance={VIEW_LIMITS.maxRadius}
      minAzimuthAngle={VIEW_LIMITS.minTheta}
      maxAzimuthAngle={VIEW_LIMITS.maxTheta}
      minPolarAngle={VIEW_LIMITS.minPhi}
      maxPolarAngle={VIEW_LIMITS.maxPhi}
      onStart={() => {
        goal.current = null;
        goalTarget.current = null;
      }}
      onChange={() => {
        // Keep the view's centre on the sign: pull the pan back inside its limits, moving the camera with it.
        const c = controls.current;
        if (!c) return;
        const clamped = clampTarget(c.target);
        const dx = clamped.x - c.target.x;
        const dy = clamped.y - c.target.y;
        const dz = clamped.z - c.target.z;
        if (dx || dy || dz) {
          camera.position.add(new THREE.Vector3(dx, dy, dz));
          c.target.copy(clamped);
        }
      }}
    />
  );
});

export default CameraRig;
