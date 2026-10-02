import { useId } from "react";
import type { LightConfig } from "../../data/configurations";
import {
  emitsLight,
  formatDepth,
  type ConfiguratorState,
} from "./types";

interface ConfigControlsProps {
  config: LightConfig;
  state: ConfiguratorState;
  onChange: (state: ConfiguratorState) => void;
}

// The brochure paints in "any PMS color", so these are just quick picks next to a free colour input.
const PAINT_SWATCHES = [
  { name: "Charcoal", hex: "#4b5059" },
  { name: "Black", hex: "#15161a" },
  { name: "White", hex: "#f2f2f2" },
  { name: "Silver", hex: "#aeb3ba" },
  { name: "Red", hex: "#b4332a" },
  { name: "Burgundy", hex: "#6a1f33" },
  { name: "Navy", hex: "#1f3a68" },
  { name: "Gold", hex: "#b8903a" },
];

const GLOW_SWATCHES = [
  { name: "White", hex: "#ffffff" },
  { name: "Warm white", hex: "#ffd9a0" },
  { name: "Red", hex: "#ff1a1a" },
  { name: "Amber", hex: "#ff9a1a" },
  { name: "Green", hex: "#20e060" },
  { name: "Cyan", hex: "#19e0ff" },
  { name: "Blue", hex: "#2d5bff" },
  { name: "Magenta", hex: "#ff2bd6" },
];

const FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

interface ColorFieldProps {
  legend: string;
  hint: string;
  value: string;
  swatches: { name: string; hex: string }[];
  onChange: (hex: string) => void;
}

function ColorField({ legend, hint, value, swatches, onChange }: ColorFieldProps) {
  const hintId = useId();
  return (
    <fieldset aria-describedby={hintId} className="space-y-2">
      <legend className="text-sm font-medium mb-2">{legend}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((s) => (
          <button
            key={s.hex}
            type="button"
            title={s.name}
            aria-label={`${legend}: ${s.name}`}
            aria-pressed={value.toLowerCase() === s.hex}
            onClick={() => onChange(s.hex)}
            style={{ backgroundColor: s.hex }}
            className="h-8 w-8 rounded-full border border-border aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        ))}
        <input
          type="color"
          aria-label={`Custom ${legend.toLowerCase()}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        {hint}
      </p>
    </fieldset>
  );
}

export default function ConfigControls({ config, state, onChange }: ConfigControlsProps) {
  const set = (patch: Partial<ConfiguratorState>) => onChange({ ...state, ...patch });

  const depthId = useId();
  const lights = emitsLight(config);
  const hasPaint = config.profile !== "tube"; // the whole tube glows: nothing painted to colour
  const illustrative = config.profile === "tube" || config.profile === "conical";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor={depthId}>
          Depth
        </label>
        <select
          id={depthId}
          value={state.depthMm}
          disabled={config.depthOptionsMm.length === 1}
          onChange={(e) => set({ depthMm: Number(e.target.value) })}
          className={FIELD}
        >
          {config.depthOptionsMm.map((mm) => (
            <option key={mm} value={mm}>
              {formatDepth(mm)}
            </option>
          ))}
        </select>
        {config.depthOptionsMm.length === 1 && (
          <p className="text-xs text-muted-foreground">This is the only standard depth for this configuration.</p>
        )}
        {config.customDepth && (
          <p className="text-xs text-muted-foreground">Custom depths available — ask us.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Depth is drawn against a nominal 12″ letter, so the preview is illustrative.
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Size guidance</p>
        <p className="text-xs text-muted-foreground">Minimum letter height: {formatDepth(config.minHeightMm)}.</p>
        <p className="text-xs text-muted-foreground">
          Minimum stroke width: {formatDepth(config.minStrokeMm)}. We don't check stroke width automatically, so keep
          your thinnest strokes at least this thick.
        </p>
      </div>

      {hasPaint && (
        <ColorField
          legend="Paint color"
          hint="Applies to the painted surfaces: sides and any face that isn't lit."
          value={state.color}
          swatches={PAINT_SWATCHES}
          onChange={(hex) => set({ color: hex })}
        />
      )}

      {lights && (
        <ColorField
          legend="Glow color"
          hint="The color of the light, from pigmented translucent acrylic or vinyl."
          value={state.glowColor}
          swatches={GLOW_SWATCHES}
          onChange={(hex) => set({ glowColor: hex })}
        />
      )}

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={state.dayNight === "night"}
          onChange={(e) => set({ dayNight: e.target.checked ? "night" : "day" })}
        />
        Day / Night
      </label>

      {illustrative && (
        <p className="text-xs text-muted-foreground">Illustrative preview — this profile is approximated.</p>
      )}
    </div>
  );
}
