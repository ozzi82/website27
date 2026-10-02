import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
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
  type View,
} from "./cameraMath";

/** What the buttons and keys outside the canvas can ask of the camera. */
export interface CameraApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  rotate: (dTheta: number, dPhi: number) => void;
}

const ZOOM_STEP = 0.78;

/**
 * Orbit camera: drag to rotate, wheel / pinch to zoom, no panning, damped, limited so the
 * sign cannot be lost or the camera pushed behind the wall. Commands from outside the
 * canvas ease toward a goal view instead of jumping; grabbing the scene cancels them.
 */
const CameraRig = forwardRef<CameraApi>(function CameraRig(_props, ref) {
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<View | null>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const current = () => viewFromPosition(camera.position, VIEW_TARGET);
  // Successive presses build on the pending goal rather than where the camera happens to be mid-ease.
  const base = () => goal.current ?? current();

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => (goal.current = zoomView(base(), ZOOM_STEP)),
      zoomOut: () => (goal.current = zoomView(base(), 1 / ZOOM_STEP)),
      reset: () => (goal.current = HOME_VIEW),
      rotate: (dTheta, dPhi) => (goal.current = rotateView(base(), dTheta, dPhi)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camera]
  );

  // Runs before the controls' own update so the controls always damp from where the camera is.
  useFrame((_, delta) => {
    const target = goal.current;
    if (!target) return;
    const next = dampView(current(), clampView(target), delta);
    positionFromView(next, VIEW_TARGET, camera.position);
    controls.current?.update();
    if (viewsClose(next, target)) goal.current = null;
  }, -2);

  // The wheel zooms the preview; once it can zoom no further, let the page scroll instead of trapping it.
  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (!host) return;
    const onWheel = (e: WheelEvent) => {
      if (shouldPassWheelToPage(camera.position.distanceTo(VIEW_TARGET), e.deltaY)) e.stopPropagation();
    };
    host.addEventListener("wheel", onWheel, { capture: true });
    return () => host.removeEventListener("wheel", onWheel, { capture: true });
  }, [gl, camera]);

  return (
    <OrbitControls
      ref={controls}
      target={VIEW_TARGET}
      enablePan={false}
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
      }}
    />
  );
});

export default CameraRig;
