import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Download, Sparkles, Square, X } from "lucide-react";
import * as THREE from "three";
import { WebGLPathTracer } from "three-gpu-pathtracer";
import PathTraceScene, { type RenderPose } from "./PathTraceScene";
import { TARGET_SAMPLES, canPathTrace } from "./pathTraceSupport";
import { trackEvent } from "../../lib/tracking";
import type { ConfiguratorState } from "./types";
import type { LightConfig } from "../../data/configurations";

interface PhotoRenderProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  pose: RenderPose;
  onClose: () => void;
}

interface DriverProps {
  ready: boolean;
  running: boolean;
  onSamples: (n: number) => void;
  onDone: () => void;
  onError: () => void;
}

/** Hands the frame loop to the path tracer: builds its acceleration structure once the scene is ready, then adds a sample per frame. */
function Driver({ ready, running, onSamples, onDone, onError }: DriverProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const tracer = useRef<WebGLPathTracer | null>(null);

  useEffect(() => {
    if (!ready) return;
    try {
      const warn = console.warn;
      console.warn = () => {}; // the library announces its own deprecation on every start
      const t = new WebGLPathTracer(gl);
      console.warn = warn;
      t.bounces = 5;
      t.renderScale = 1;
      t.tiles.set(2, 2);
      t.setScene(scene, camera);
      tracer.current = t;
    } catch (e) {
      console.error("Path tracer could not start:", e);
      onError();
    }
    return () => {
      tracer.current?.dispose?.();
      tracer.current = null;
    };
    // The scene is built once per render window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, gl, scene, camera]);

  // A positive priority takes over the render: r3f then leaves drawing to us.
  useFrame(() => {
    const t = tracer.current;
    if (!t || !running) return;
    try {
      if (t.samples >= TARGET_SAMPLES) {
        onDone();
        return;
      }
      t.renderSample();
      onSamples(Math.floor(t.samples));
    } catch (e) {
      console.error("Path tracing failed:", e);
      onError();
    }
  }, 1);
  return null;
}

/**
 * "Photo render": the current sign and view, path traced on the visitor's own graphics card. It starts grainy and refines
 * for about half a minute; the visitor can stop whenever it looks good enough and save the picture.
 */
export default function PhotoRender({ shapes, config, state, pose, onClose }: PhotoRenderProps) {
  const supported = useRef(canPathTrace()).current;
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(true);
  const [samples, setSamples] = useState(0);
  const [failed, setFailed] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);
  const done = samples >= TARGET_SAMPLES || !running;

  useEffect(() => {
    trackEvent("configurator_photo_render", { configuration: config.id, mode: state.dayNight });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [config.id, state.dayNight, onClose]);

  function save() {
    const canvas = canvasBox.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `sunlite-sign-render-${state.dayNight}.jpg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        trackEvent("configurator_photo_render_download", { configuration: config.id, samples });
      },
      "image/jpeg",
      0.93
    );
  }

  const percent = Math.min(100, Math.round((samples / TARGET_SAMPLES) * 100));
  const status = failed
    ? "The render could not run on this device."
    : !ready
      ? "Preparing the scene…"
      : samples === 0
        ? "Building the light model…"
        : done
          ? "Finished."
          : `Rendering… ${percent}%`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Photo render" className="fixed inset-0 z-[100] flex flex-col bg-background/95 text-foreground backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Photo render</h2>
        </div>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-auto p-4">
        {!supported || failed ? (
          <div role="alert" className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-lg font-semibold">Photo render needs a graphics card</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This device or browser cannot run it. The live 3D preview and “Download image” still work, and we are happy to render it for you with your quote.
            </p>
          </div>
        ) : (
          <>
            <div ref={canvasBox} className="relative aspect-video w-[min(94vw,1280px)] max-h-[70vh] overflow-hidden rounded-xl border border-border bg-black">
              <Canvas
                dpr={1}
                camera={{ fov: 35, near: 0.03, far: 200 }}
                gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
                style={{ width: "100%", height: "100%" }}
              >
                <PathTraceScene shapes={shapes} config={config} state={state} pose={pose} onReady={onReady} />
                <Driver ready={ready} running={running} onSamples={setSamples} onDone={() => setRunning(false)} onError={() => setFailed(true)} />
              </Canvas>
            </div>
            <div className="w-[min(94vw,1280px)]">
              <div role="progressbar" aria-label="Render progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p role="status" className="text-sm text-muted-foreground">
                  {status}
                </p>
                <div className="ml-auto flex gap-2">
                  {!done && (
                    <button type="button" onClick={() => setRunning(false)} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">
                      <Square aria-hidden="true" className="h-4 w-4" />
                      Stop here
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={save}
                    disabled={samples === 0}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Download picture
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Rendered in your browser with light physics, so it takes about half a minute and looks grainy at first. Nothing is uploaded. It shows the sign as drawn here; real signs vary slightly.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
