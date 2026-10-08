import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { Camera, Download, Ruler, X } from "lucide-react";
import * as THREE from "three";
import PhotoScene, { PHOTO_FOV, type PhotoPlacement } from "./PhotoScene";
import { NightProvider } from "./NightContext";
import { SnapshotBridge, type CaptureSnapshot } from "./SignPreview";
import { fitInside, photoWorldSize, pxPerInFromReference, scaleToMaxSide, startPxPerIn, type Point } from "./photoMath";
import { photoTexture } from "./photoTone";
import { aspectOf, clampSizeIn, formatSize, sizeFromWidthIn, dimensionsIn, formatInches } from "./realSize";
import { trackEvent } from "../../lib/tracking";
import type { ConfiguratorState } from "./types";
import type { LightConfig } from "../../data/configurations";

interface PhotoViewProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  onSizeChange: (sizeIn: number) => void;
  onClose: () => void;
}

interface Loaded {
  texture: THREE.DataTexture;
  w: number;
  h: number;
}

const DPR: [number, number] = [1, 1.5];
const RANGE = "w-full accent-[hsl(var(--primary))]";

async function loadPhoto(file: File): Promise<Loaded | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { w, h } = scaleToMaxSide(bitmap.width, bitmap.height);
    const texture = photoTexture(bitmap, w, h);
    bitmap.close();
    return texture ? { texture, w, h } : null;
  } catch {
    return null;
  }
}

/**
 * "See it on your building": the visitor's own photo with their sign on it. The photo is read and drawn in the browser
 * and never uploaded. Measuring something of known length in the photo makes the sign true to size; without that the
 * visitor sizes it by eye.
 */
export default function PhotoView({ shapes, config, state, onSizeChange, onClose }: PhotoViewProps) {
  const [photo, setPhoto] = useState<Loaded | null>(null);
  const [error, setError] = useState(false);
  const [night, setNight] = useState(false);
  const [measure, setMeasure] = useState<{ picking: boolean; points: Point[]; inches: number | null }>({ picking: false, points: [], inches: null });
  const [lengthText, setLengthText] = useState("");
  const [ui, setUi] = useState({ scale: 1, yaw: 0, roll: 0 });
  const [widthText, setWidthText] = useState("");
  const placement = useRef<PhotoPlacement>({ x: 0, y: 0, scale: 1, yaw: 0, roll: 0 });
  const capture = useRef<CaptureSnapshot | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState({ w: 800, h: 500 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const aspect = useMemo(() => aspectOf(shapes), [shapes]);
  const dims = dimensionsIn(state.sizeIn, aspect);

  useEffect(() => {
    trackEvent("configurator_photo_view", { configuration: config.id });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [config.id, onClose]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBoxSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [photo]);

  useEffect(() => () => photo?.texture.dispose(), [photo]);

  const measured = measure.points.length === 2 && measure.inches ? pxPerInFromReference(
    { x: measure.points[0].x * (photo?.w ?? 1), y: measure.points[0].y * (photo?.h ?? 1) },
    { x: measure.points[1].x * (photo?.w ?? 1), y: measure.points[1].y * (photo?.h ?? 1) },
    measure.inches
  ) : null;

  // One pixel-per-inch for the whole scene: the measured one, or one that starts the sign at a natural size.
  const pxPerIn = useMemo(
    () => measured ?? (photo ? startPxPerIn(photo.w, photo.h, state.sizeIn, aspect) : 1),
    [measured, photo, state.sizeIn, aspect]
  );
  const world = useMemo(() => (photo ? photoWorldSize(photo.w, photo.h, pxPerIn, state.sizeIn) : { w: 1, h: 1 }), [photo, pxPerIn, state.sizeIn]);
  const stage = photo ? fitInside(boxSize.w, boxSize.h, photo.w, photo.h) : { w: 0, h: 0 };
  const worldPerPx = photo ? world.h / stage.h : 0;

  // Measured: true size, so no extra scale. Otherwise the slider's.
  placement.current.scale = measured ? 1 : ui.scale;
  placement.current.yaw = ui.yaw;
  placement.current.roll = ui.roll;

  useEffect(() => {
    setWidthText(String(Math.round(dims.width * 10) / 10));
  }, [dims.width]);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(false);
    const loaded = await loadPhoto(file);
    if (!loaded) {
      setError(true);
      return;
    }
    placement.current = { x: 0, y: 0, scale: 1, yaw: 0, roll: 0 };
    setUi({ scale: 1, yaw: 0, roll: 0 });
    setMeasure({ picking: false, points: [], inches: null });
    setPhoto(loaded);
  }, []);

  function pointFromEvent(e: ReactPointerEvent<HTMLDivElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (measure.picking) {
      const p = pointFromEvent(e);
      setMeasure((m) => ({ ...m, points: m.points.length >= 2 ? [p] : [...m.points, p], inches: null }));
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    const p = placement.current;
    p.x = Math.max(-world.w / 2, Math.min(world.w / 2, p.x + dx * worldPerPx));
    p.y = Math.max(-world.h / 2, Math.min(world.h / 2, p.y - dy * worldPerPx));
  }

  function commitLength() {
    const v = Number(lengthText.replace(",", "."));
    if (Number.isFinite(v) && v > 0) {
      setMeasure((m) => ({ ...m, picking: false, inches: v }));
      trackEvent("configurator_photo_measured", { configuration: config.id });
    }
  }

  function commitWidth() {
    const v = Number(widthText.replace(",", "."));
    if (Number.isFinite(v) && v > 0) {
      const next = sizeFromWidthIn(v, aspect);
      if (clampSizeIn(next) !== state.sizeIn) onSizeChange(next);
    }
  }

  async function download() {
    const url = await capture.current?.();
    if (!url) return;
    trackEvent("configurator_photo_download", { configuration: config.id });
    const a = document.createElement("a");
    a.href = url;
    a.download = "sunlite-sign-on-my-building.jpg";
    a.click();
  }

  const pts = measure.points;
  const sizeText = formatSize(state.sizeIn, aspect);

  return (
    <div role="dialog" aria-modal="true" aria-label="Your sign on your own photo" className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <div className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <p className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/90 sm:text-sm">
          {photo ? "Drag the sign to where it should go." : "Your sign on your own building."}
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {!photo ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Camera className="h-10 w-10 text-primary" aria-hidden />
          <h2 className="font-heading text-3xl uppercase">Add a photo of the building</h2>
          <p className="max-w-md text-sm text-white/70">
            Take or choose a straight-on photo of the wall, fascia or storefront. Your photo stays in this browser: it is not uploaded or sent to us.
          </p>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Choose a photo
          </button>
          {error && <p role="alert" className="text-sm text-red-300">That file could not be read as a photo. Try a JPG or PNG.</p>}
        </div>
      ) : (
        <>
          <div ref={box} className="flex min-h-0 flex-1 items-center justify-center px-3 sm:px-4">
            <div
              className="relative touch-none select-none overflow-hidden rounded-lg bg-neutral-900"
              style={{ width: stage.w, height: stage.h, cursor: measure.picking ? "crosshair" : "grab" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
            >
              <Canvas camera={{ fov: PHOTO_FOV, near: 0.05, far: 4000, position: [0, 0, 10] }} dpr={DPR} shadows gl={{ antialias: true }}>
                <NightProvider isNight={night}>
                  <PhotoScene shapes={shapes} config={config} state={state} texture={photo.texture} size={world} placement={placement} />
                  <SnapshotBridge captureRef={capture} width={2000} quality={0.92} />
                </NightProvider>
              </Canvas>
              {pts.length > 0 && (
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
                  {pts.length === 2 && <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke="#f47c20" strokeWidth="0.004" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />}
                  {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="0.008" fill="#f47c20" stroke="#fff" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }} />
                  ))}
                </svg>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
            {measure.picking ? (
              <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-lg bg-white/10 p-3 text-sm">
                <Ruler className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  {pts.length < 2 ? `Tap the two ends of something you know the length of, like a door (about 80″ tall). ${pts.length}/2` : "How long is that, in inches?"}
                </span>
                {pts.length === 2 && (
                  <>
                    <input
                      inputMode="decimal"
                      value={lengthText}
                      onChange={(e) => setLengthText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commitLength()}
                      aria-label="Length in inches"
                      placeholder="inches"
                      className="h-10 w-24 rounded-md border border-white/30 bg-black/40 px-2 text-white"
                    />
                    <button type="button" onClick={commitLength} className="h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground">Set</button>
                  </>
                )}
                <button type="button" onClick={() => setMeasure({ picking: false, points: [], inches: null })} className="h-10 rounded-md bg-white/15 px-3">Cancel</button>
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                <label className="text-[11px] uppercase tracking-wider text-white/70">
                  Sign width (in)
                  <input
                    inputMode="decimal"
                    value={widthText}
                    onChange={(e) => setWidthText(e.target.value)}
                    onBlur={commitWidth}
                    onKeyDown={(e) => e.key === "Enter" && commitWidth()}
                    className="mt-1 h-9 w-full rounded-md border border-white/30 bg-black/40 px-2 text-sm normal-case text-white"
                  />
                </label>
                {!measured ? (
                  <label className="text-[11px] uppercase tracking-wider text-white/70">
                    Size on photo
                    <input type="range" min={0.3} max={3} step={0.01} value={ui.scale} onChange={(e) => setUi((u) => ({ ...u, scale: Number(e.target.value) }))} className={RANGE} />
                  </label>
                ) : (
                  <p className="self-end text-xs text-white/70">True size: {formatInches(dims.width)} × {formatInches(dims.height)}</p>
                )}
                <label className="text-[11px] uppercase tracking-wider text-white/70">
                  Angle
                  <input type="range" min={-60} max={60} step={1} value={ui.yaw} onChange={(e) => setUi((u) => ({ ...u, yaw: Number(e.target.value) }))} className={RANGE} />
                </label>
                <label className="text-[11px] uppercase tracking-wider text-white/70">
                  Tilt
                  <input type="range" min={-25} max={25} step={0.5} value={ui.roll} onChange={(e) => setUi((u) => ({ ...u, roll: Number(e.target.value) }))} className={RANGE} />
                </label>
              </div>
            )}

            <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2">
              <div role="group" aria-label="Time of day" className="flex rounded-full bg-white/10 p-1 text-sm">
                {(["Day", "Night"] as const).map((l) => (
                  <button key={l} type="button" aria-pressed={night === (l === "Night")} onClick={() => setNight(l === "Night")} className={`rounded-full px-4 py-1.5 font-semibold ${night === (l === "Night") ? "bg-white text-black" : "text-white/80"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setMeasure((m) => ({ ...m, picking: true, points: [], inches: null }))} className="flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold hover:bg-white/25">
                <Ruler className="h-4 w-4" aria-hidden />
                {measured ? "Measure again" : "Set true size"}
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="h-10 rounded-full bg-white/15 px-4 text-sm font-semibold hover:bg-white/25">Change photo</button>
              <button type="button" onClick={download} className="ml-auto flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <Download className="h-4 w-4" aria-hidden />
                Download picture
              </button>
            </div>
            <p className="mx-auto max-w-3xl text-center text-[11px] text-white/60">
              Illustration of {sizeText}. {measured ? "Sized from your measurement." : "Sized by eye until you set a true size."} Lighting and glow on site depend on the surroundings.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
