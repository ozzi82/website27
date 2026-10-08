import { useEffect, useId, useState, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { LightConfig } from "../../data/configurations";
import { BACKGROUNDS } from "./backgrounds";
import DayNightToggle from "./DayNightToggle";
import SegmentedControl from "./SegmentedControl";
import { GLOW_SWATCHES, PAINT_SWATCHES, VINYL_SWATCHES, type Swatch } from "./swatches";
import { thinStrokeAdvice } from "./strokeGuard";
import { depthOptionsFor, effectiveConfig, emitsLight, formatDepth, hasFaceVinyl, withBuild, withFinish, withVariant, type ConfiguratorState } from "./types";
import { MOUNT_LABEL } from "../../data/configurations";
import { LP1_FINISHES, getLp1Finish, isLp1, type Lp1Build } from "./lp1Materials";
import { MAX_SIZE_IN, MIN_SIZE_IN, MM_PER_INCH, dimensionsIn, sizeFromHeightIn, sizeFromWidthIn } from "./realSize";

interface ConfigControlsProps {
  config: LightConfig;
  state: ConfiguratorState;
  onChange: (state: ConfiguratorState) => void;
  /** Average stroke width over artwork height (see strokeHeightRatio); null/undefined when unknown. */
  strokeRatio?: number | null;
  /** The thin-stroke advice is shown over the 3D preview instead of here (see ThinStrokeNotice). */
  adviceInPreview?: boolean;
  /** Width over height of the artwork, for the size inputs (1 when unknown). */
  aspect?: number;
  /** Typed lines in the artwork (1 for an uploaded file): letter height is one line of the artwork's height. */
  lines?: number;
  /** Show only one tab's controls (the tabbed layout); "all" shows everything. */
  group?: ControlGroup;
}

export type ControlGroup = "all" | "size" | "colour" | "light" | "look";

/** Bigger, easier to see segments for the choices that matter most (depth, mounting, lighting, build). */
const BIG = "[&_label]:py-1.5 [&_label]:text-sm [&_label]:font-semibold";

/** One compact row: a short label on the left, the control on the right. */
function Row({ label, htmlFor, labelId, children }: { label: string; htmlFor?: string; labelId?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-center gap-x-3">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      ) : (
        <span id={labelId} className="text-sm font-medium">
          {label}
        </span>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

interface ColorRowProps {
  /** Short visible label ("Paint"). */
  label: string;
  /** Accessible name of the group and base of each swatch's name ("Paint color"). */
  legend: string;
  value: string;
  swatches: Swatch[];
  onChange: (hex: string) => void;
  /** Offer the free colour picker next to the swatches (paint only: the glow is a fixed set). */
  allowCustom?: boolean;
}

function ColorRow({ label, legend, value, swatches, onChange, allowCustom = true }: ColorRowProps) {
  const labelId = useId();
  return (
    <Row label={label} labelId={labelId}>
      <div role="group" aria-label={legend} className="flex flex-wrap items-center gap-1.5">
        {swatches.map((s) => (
          <button
            key={s.hex}
            type="button"
            title={s.name}
            aria-label={`${legend}: ${s.name}`}
            aria-pressed={value.toLowerCase() === s.hex}
            onClick={() => onChange(s.hex)}
            style={{ backgroundColor: s.hex }}
            className="h-6 w-6 rounded-full border border-border aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        ))}
        {allowCustom && <input
          type="color"
          aria-label={`Custom ${legend.toLowerCase()}`}
          title="Any color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />}
      </div>
    </Row>
  );
}

/** "1.2″" in the segment with the metric size beside it in the same text: `1.2″ (30 mm)`. */
function DepthLabel({ mm }: { mm: number }) {
  const [inches, rest] = formatDepth(mm).split(" (");
  return (
    <span>
      {inches}
      <span className="font-normal opacity-75"> ({rest}</span>
    </span>
  );
}

const SIZE_PRESETS_IN = [24, 48, 100, 200];

/** Width and height in inches, editable either way (the artwork's proportions stay), plus a few common widths. */
function SizeInputs({ sizeIn, aspect, onSize }: { sizeIn: number; aspect: number; onSize: (sizeIn: number) => void }) {
  const { width, height } = dimensionsIn(sizeIn, aspect);
  const show = (n: number) => String(n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);
  const [w, setW] = useState(show(width));
  const [h, setH] = useState(show(height));
  useEffect(() => {
    setW(show(width));
    setH(show(height));
  }, [width, height]);

  const commitWidth = () => {
    const n = parseFloat(w);
    if (Number.isFinite(n) && n > 0) {
      const next = sizeFromWidthIn(n, aspect);
      if (next !== sizeIn) onSize(next);
      else setW(show(width)); // clamped back to the same size: show the real number
    } else setW(show(width));
  };
  const commitHeight = () => {
    const n = parseFloat(h);
    if (Number.isFinite(n) && n > 0) {
      const next = sizeFromHeightIn(n, aspect);
      if (next !== sizeIn) onSize(next);
      else setH(show(height));
    } else setH(show(height));
  };
  const field = "w-[4.4rem] rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
  const key = (commit: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Width
          <input type="number" inputMode="decimal" aria-label="Width in inches" min={MIN_SIZE_IN} max={MAX_SIZE_IN} step="any" value={w} onChange={(e) => setW(e.target.value)} onBlur={commitWidth} onKeyDown={key(commitWidth)} className={field} />
          <span aria-hidden="true">″</span>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Height
          <input type="number" inputMode="decimal" aria-label="Height in inches" min={MIN_SIZE_IN} max={MAX_SIZE_IN} step="any" value={h} onChange={(e) => setH(e.target.value)} onBlur={commitHeight} onKeyDown={key(commitHeight)} className={field} />
          <span aria-hidden="true">″</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {SIZE_PRESETS_IN.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onSize(sizeFromWidthIn(p, aspect))}
            aria-label={`Set the width to ${p} inches`}
            aria-pressed={Math.round(width) === p}
            className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground aria-pressed:border-primary aria-pressed:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {p}″
          </button>
        ))}
        <span className="text-[11px] text-muted-foreground">
          {Math.round(width * MM_PER_INCH)} × {Math.round(height * MM_PER_INCH)} mm
        </span>
      </div>
    </div>
  );
}

export default function ConfigControls({ config, state, onChange, strokeRatio = null, adviceInPreview = false, aspect = 1, lines = 1, group = "all" }: ConfigControlsProps) {
  const g = (...names: ControlGroup[]) => group === "all" || names.includes(group);
  const set = (patch: Partial<ConfiguratorState>) => onChange({ ...state, ...patch });

  const brightnessId = useId();
  const lights = emitsLight(effectiveConfig(config, state));
  const mounts = effectiveConfig(config, state).mounts;
  const flat = isLp1(config);
  const finish = getLp1Finish(state.finish);
  // LP 1 is painted only where the finish takes a colour; every lit letter has painted parts (even the neon one: the back half of its side).
  const hasPaint = flat ? finish.usesPaint : true;
  const depthOptions = depthOptionsFor(config, state);
  const illustrative = config.profile === "tube" || config.profile === "conical";
  const advice = thinStrokeAdvice(config, strokeRatio, dimensionsIn(state.sizeIn, aspect).height * MM_PER_INCH, lines);
  const singleDepth = depthOptions.length === 1;

  return (
    <div className="space-y-2 [@media(min-height:830px)]:space-y-4">
      {/* The choices that change what is built (and the price): kept together in one highlighted block. */}
      {g("size", "colour") && (
      <section aria-label="Size and mounting" className={group === "all" ? "space-y-2.5 rounded-xl border border-primary/40 bg-primary/5 p-3" : "space-y-3"}>
      {group === "all" && <p className="mono-label text-primary">Size · mounting</p>}
      {flat && g("colour") && (
          <Row label="Finish" labelId="finish-label">
            <div role="radiogroup" aria-label="Finish" className="flex flex-wrap items-center gap-1.5">
              {LP1_FINISHES.map((f) => (
                <label
                  key={f.id}
                  title={f.label}
                  style={{ background: f.swatch }}
                  className="relative h-6 w-6 cursor-pointer rounded-full border border-border has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:ring-offset-2 has-[:checked]:ring-offset-background has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
                >
                  <input
                    type="radio"
                    name="configurator-finish"
                    value={f.id}
                    aria-label={f.label}
                    checked={state.finish === f.id}
                    onChange={() => onChange(withFinish(state, f.id))}
                    className="sr-only"
                  />
                </label>
              ))}
              <span aria-hidden="true" className="ml-1 truncate text-[11px] text-muted-foreground">
                {finish.short}
              </span>
            </div>
          </Row>
      )}
      {flat && g("size") && (
          <Row label="Build" labelId="build-label">
            <SegmentedControl<Lp1Build>
              label="Build"
              className={BIG}
              value={state.build}
              onChange={(build) => onChange(withBuild(state, build))}
              disabled={finish.builds.length === 1}
              options={[
                { value: "solid", label: "Solid", title: "Cut from solid material: thinner" },
                { value: "fabricated", label: "Fabricated", title: "Hollow fabricated body: thicker" },
              ]}
            />
          </Row>
      )}

      {config.variant && g("size") && (
        <Row label="Lighting" labelId="variant-label">
          <SegmentedControl<"face" | "face-halo">
            label="Lighting"
            className={BIG}
            value={state.variant ? "face-halo" : "face"}
            onChange={(v) => onChange(withVariant(config, state, v === "face-halo"))}
            options={[
              { value: "face", label: "Face", ariaLabel: `${config.code} face lit`, title: `${config.code}: face lit` },
              { value: "face-halo", label: "Face + halo", ariaLabel: `${config.variant.code} face and halo lit`, title: `${config.variant.code}: ${config.variant.note}` },
            ]}
          />
        </Row>
      )}

      {mounts.length > 1 && g("size") && (
        <Row label="Mounting" labelId="mounting-label">
          <SegmentedControl
            label="Mounting"
            className={BIG}
            value={state.mounting}
            onChange={(mounting) => set({ mounting })}
            options={mounts.map((m) => ({
              value: m,
              label: MOUNT_LABEL[m],
              title: m === "flush" ? "Against the wall" : "Held off the wall on spacers",
            }))}
          />
        </Row>
      )}

      {g("size") && (
      <>
      <Row label="Depth" labelId="depth-label">
        <SegmentedControl
          label="Depth"
          value={state.depthMm}
          disabled={singleDepth}
          onChange={(depthMm) => set({ depthMm })}
          options={depthOptions.map((mm) => ({
            value: mm,
            label: <DepthLabel mm={mm} />,
            ariaLabel: formatDepth(mm),
          }))}
          className={BIG}
        />
      </Row>
      <Row label="Size" labelId="size-label">
        <SizeInputs sizeIn={state.sizeIn} aspect={aspect} onSize={(sizeIn) => set({ sizeIn })} />
      </Row>

      </>
      )}
      </section>
      )}

      {hasPaint && g("colour") && (
        <ColorRow
          label={flat ? "Colour" : "Paint"}
          legend={flat ? "Acrylic color" : "Paint color"}
          value={state.color}
          swatches={PAINT_SWATCHES}
          onChange={(hex) => set({ color: hex })}
        />
      )}

      {lights && g("light") && (
        <ColorRow
          label="Glow"
          legend="Glow color"
          value={state.glowColor}
          swatches={GLOW_SWATCHES}
          onChange={(hex) => set({ glowColor: hex })}
          allowCustom={false}
        />
      )}

      {hasFaceVinyl(config) && g("colour") && (
        <ColorRow
          label="Vinyl"
          legend="Front vinyl"
          value={state.faceVinyl}
          swatches={VINYL_SWATCHES}
          onChange={(hex) => set({ faceVinyl: hex })}
          allowCustom={false}
        />
      )}

      {lights && g("light") && (
        <Row label="Brightness" htmlFor={brightnessId}>
          <div className="flex items-center gap-2">
            <input
              id={brightnessId}
              type="range"
              min={0}
              max={100}
              step={5}
              value={state.brightness}
              onChange={(e) => set({ brightness: Number(e.target.value) })}
              aria-valuetext={`${state.brightness} percent`}
              className="h-5 min-w-0 flex-1 cursor-pointer accent-[hsl(var(--primary))]"
            />
            <span aria-hidden="true" className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {state.brightness}%
            </span>
          </div>
        </Row>
      )}

      {g("look") && (
      <>
      <Row label="Background" labelId="bg-label">
        <div role="radiogroup" aria-label="Background" className="grid grid-cols-4 gap-1.5">
          {BACKGROUNDS.map((b) => (
            <label
              key={b.id}
              title={b.label}
              style={{ background: b.thumb }}
              className="relative flex h-11 cursor-pointer sm:h-9 [@media(min-height:830px)]:sm:h-11 items-end overflow-hidden rounded-md border border-border has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name="configurator-background"
                value={b.id}
                checked={state.background === b.id}
                onChange={() => set({ background: b.id })}
                className="sr-only"
              />
              <span className="w-full bg-black/55 px-1 py-px text-center text-[10px] leading-[1.1] text-white">
                {b.label}
              </span>
            </label>
          ))}
        </div>
      </Row>

      <DayNightToggle value={state.dayNight} onChange={(dayNight) => set({ dayNight })} />
      </>
      )}

      {group === "light" && !lights && <p className="text-sm text-muted-foreground">This sign is not illuminated, so there is nothing to set here. Use the Look tab to see it by day or in the evening.</p>}

      {g("size") && advice && !adviceInPreview && (
        <p
          role="note"
          className={
            advice.severity === "strong"
              ? "flex gap-2 rounded-lg border border-amber-500/60 bg-amber-500/15 p-2.5 text-xs leading-snug text-amber-100"
              : "flex gap-2 text-[11px] leading-snug text-amber-200/90"
          }
        >
          <AlertTriangle aria-hidden="true" className={`mt-px shrink-0 text-amber-400 ${advice.severity === "strong" ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
          <span>{advice.message}</span>
        </p>
      )}

      {g("size") && (
      <p className="text-[11px] leading-snug text-muted-foreground">
        Minimum letter height {formatDepth(config.minHeightMm)} · minimum stroke width {formatDepth(config.minStrokeMm)}
      </p>
      )}

      {g("size") && (
      <details className="group text-[11px] leading-snug text-muted-foreground">
        <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <Info aria-hidden="true" className="h-3.5 w-3.5" />
          About this preview
        </summary>
        <div className="mt-1.5 space-y-1">
          <p>The preview is drawn to the size you enter: depth, spacers and the lit band are true to scale, and the wall texture is real-size too.</p>
          {singleDepth && <p>This is the only standard depth for this configuration.</p>}
          {config.customDepth && <p>Custom depths available — ask us.</p>}
          {illustrative && <p>Illustrative preview — this profile is approximated.</p>}
          <p>Paint color applies to the sides and any face that isn’t lit; glow color is the pigmented acrylic or vinyl.</p>
          <p>The brightness slider dims the LEDs in the night view.</p>
          {state.mounting === "standoff" && <p>Standoff spacers are clear plastic tubes, 1″ long and 0.4″ in diameter (drawn slightly thicker here so they can be seen).</p>}
          {mounts.length === 1 && <p>This system is mounted on standoff spacers only: the halo needs the gap to reach the wall.</p>}
          {flat && (
            <p>
              {finish.builds.length === 1
                ? `${finish.label}: solid material only.`
                : `${finish.label}: solid (thinner) or fabricated (hollow inside, so it can be thicker).`}
            </p>
          )}
        </div>
      </details>
      )}
    </div>
  );
}
