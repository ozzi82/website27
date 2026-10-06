import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Download, Pause, Play, RotateCcw, X } from "lucide-react";
import * as THREE from "three";
import BuildingScene from "./BuildingScene";
import { NightProvider } from "./NightContext";
import { SnapshotBridge, type CaptureSnapshot } from "./SignPreview";
import { BUILDING_SECONDS, SCENE_SHARE, cameraPoseAt, timeOfDay } from "./buildingTime";
import { trackEvent } from "../../lib/tracking";
import type { ConfiguratorState } from "./types";
import type { LightConfig } from "../../data/configurations";

interface BuildingViewProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  onClose: () => void;
}

const CAMERA = { position: cameraPoseAt(0).position, fov: 35, near: 0.05, far: 1500 };
const DPR: [number, number] = [1, 1.5];
/** Slider stops the labels sit under. */
const MARKS = [
  { t: 0, label: "Day" },
  { t: 0.6 * SCENE_SHARE, label: "Sunset" },
  { t: SCENE_SHARE, label: "Night" },
];
/** Where reduced-motion visitors start: the finished picture, sign on, rather than a film that moves by itself. */
const STILL_TIME = SCENE_SHARE;

function prefersStill(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Full-screen "see it on the building": the customer's sign on a glass tower, a 15 second day-to-night film they can scrub, pause, orbit and save as a picture. */
export default function BuildingView({ shapes, config, state, onClose }: BuildingViewProps) {
  const still = useRef(prefersStill());
  const clock = useRef(still.current ? STILL_TIME : 0);
  const nightRef = useRef(timeOfDay(clock.current).night);
  const capture = useRef<CaptureSnapshot | null>(null);
  const [t, setT] = useState(clock.current);
  const [playing, setPlaying] = useState(!still.current);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    trackEvent("configurator_building_view", { configuration: config.id });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [config.id, onClose]);

  const handleEnd = useCallback(() => setPlaying(false), []);

  function seek(value: number) {
    clock.current = value;
    setT(value);
    setPlaying(false);
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (clock.current >= 1) {
      clock.current = 0;
      setT(0);
    }
    setPlaying(true);
  }

  async function download() {
    const url = await capture.current?.();
    if (!url) return;
    trackEvent("configurator_building_download", { configuration: config.id });
    const a = document.createElement("a");
    a.href = url;
    a.download = "sunlite-sign-on-building.jpg";
    a.click();
  }

  const ended = !playing && t >= 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="Your sign on a glass tower" className="fixed inset-0 z-[100] bg-black text-white">
      <Canvas camera={CAMERA} dpr={DPR} className="!absolute inset-0" gl={{ antialias: true }}>
        <NightProvider isNight={false} driven={nightRef}>
          <BuildingScene shapes={shapes} config={config} state={state} clock={clock} playing={playing} onTime={setT} onEnd={handleEnd} nightRef={nightRef} />
          <SnapshotBridge captureRef={capture} width={1600} quality={0.9} />
        </NightProvider>
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
        <p className="pointer-events-auto rounded-full bg-black/55 px-4 py-2 text-xs text-white/90 backdrop-blur sm:text-sm">
          Your sign at the entrance. Drag to look around once the film stops.
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 sm:p-5">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : ended ? "Play again" : "Play"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {playing ? <Pause className="h-5 w-5" aria-hidden /> : ended ? <RotateCcw className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5" aria-hidden />}
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={t}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Time of day"
              aria-valuetext={`${Math.round(t * BUILDING_SECONDS)} of ${BUILDING_SECONDS} seconds, ${t < 0.42 ? "daytime" : t < 0.62 ? "sunset" : t < SCENE_SHARE ? "night" : "close-up"}`}
              className="w-full accent-[hsl(var(--primary))]"
            />
            <div className="relative mt-0.5 h-4 text-[11px] uppercase tracking-wider text-white/70">
              {MARKS.map((m) => (
                <span key={m.label} className="absolute -translate-x-1/2" style={{ left: `${m.t * 100}%`, ...(m.t === 0 ? { transform: "none" } : {}) }}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={download}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold backdrop-blur hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Download className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Download this picture</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
        <p className="mx-auto max-w-3xl text-center text-[11px] text-white/60">
          Illustration. The sign is drawn about 100 in (2.5 m) wide on a typical lobby entrance; the glow you see on site depends on the surroundings.
        </p>
      </div>
    </div>
  );
}
