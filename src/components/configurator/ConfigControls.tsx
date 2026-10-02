import { useId, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { LightConfig } from "../../data/configurations";
import { BACKGROUNDS } from "./backgrounds";
import DayNightToggle from "./DayNightToggle";
import SegmentedControl from "./SegmentedControl";
import { GLOW_SWATCHES, PAINT_SWATCHES, type Swatch } from "./swatches";
import { thinStrokeAdvice } from "./strokeGuard";
import { emitsLight, formatDepth, type ConfiguratorState } from "./types";

interface ConfigControlsProps {
  config: LightConfig;
  state: ConfiguratorState;
  onChange: (state: ConfiguratorState) => void;
  /** Average stroke width over artwork height (see strokeHeightRatio); null/undefined when unknown. */
  strokeRatio?: number | null;
}

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
}

function ColorRow({ label, legend, value, swatches, onChange }: ColorRowProps) {
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
        <input
          type="color"
          aria-label={`Custom ${legend.toLowerCase()}`}
          title="Any color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
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

export default function ConfigControls({ config, state, onChange, strokeRatio = null }: ConfigControlsProps) {
  const set = (patch: Partial<ConfiguratorState>) => onChange({ ...state, ...patch });

  const brightnessId = useId();
  const lights = emitsLight(config);
  const hasPaint = config.profile !== "tube"; // the whole tube glows: nothing painted to colour
  const illustrative = config.profile === "tube" || config.profile === "conical";
  const advice = thinStrokeAdvice(config, strokeRatio);
  const singleDepth = config.depthOptionsMm.length === 1;

  return (
    <div className="space-y-2.5 [@media(min-height:830px)]:space-y-4">
      <Row label="Depth" labelId="depth-label">
        <SegmentedControl
          label="Depth"
          value={state.depthMm}
          disabled={singleDepth}
          onChange={(depthMm) => set({ depthMm })}
          options={config.depthOptionsMm.map((mm) => ({
            value: mm,
            label: <DepthLabel mm={mm} />,
            ariaLabel: formatDepth(mm),
          }))}
        />
      </Row>

      {hasPaint && (
        <ColorRow
          label="Paint"
          legend="Paint color"
          value={state.color}
          swatches={PAINT_SWATCHES}
          onChange={(hex) => set({ color: hex })}
        />
      )}

      {lights && (
        <ColorRow
          label="Glow"
          legend="Glow color"
          value={state.glowColor}
          swatches={GLOW_SWATCHES}
          onChange={(hex) => set({ glowColor: hex })}
        />
      )}

      {lights && (
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

      {advice && (
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

      <p className="text-[11px] leading-snug text-muted-foreground">
        Minimum letter height {formatDepth(config.minHeightMm)} · minimum stroke width {formatDepth(config.minStrokeMm)}
      </p>

      <details className="group text-[11px] leading-snug text-muted-foreground">
        <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <Info aria-hidden="true" className="h-3.5 w-3.5" />
          About this preview
        </summary>
        <div className="mt-1.5 space-y-1">
          <p>Depth is drawn against a nominal 12″ letter, so the preview is illustrative.</p>
          {singleDepth && <p>This is the only standard depth for this configuration.</p>}
          {config.customDepth && <p>Custom depths available — ask us.</p>}
          {illustrative && <p>Illustrative preview — this profile is approximated.</p>}
          <p>Paint color applies to the sides and any face that isn’t lit; glow color is the pigmented acrylic or vinyl.</p>
          <p>The brightness slider dims the LEDs in the night view.</p>
        </div>
      </details>
    </div>
  );
}
