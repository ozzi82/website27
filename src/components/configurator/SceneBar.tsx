import { Minus, Moon, Plus, RotateCcw, Sun } from "lucide-react";
import { BACKGROUNDS } from "./backgrounds";
import type { ConfiguratorState, DayNight } from "./types";

interface SceneBarProps {
  state: ConfiguratorState;
  onChange: (state: ConfiguratorState) => void;
  camera: { zoomIn: () => void; zoomOut: () => void; reset: () => void };
}

/** Day | Night and the wall behind the sign, as one floating bar over the preview (desktop). */
export default function SceneBar({ state, onChange, camera }: SceneBarProps) {
  const set = (patch: Partial<ConfiguratorState>) => onChange({ ...state, ...patch });
  const btn =
    "flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
  const divider = <span aria-hidden="true" className="hidden h-7 w-px bg-border sm:block" />;
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-3xl border border-border bg-card/95 px-3 py-2 shadow-[0_8px_24px_-12px_rgba(23,27,39,0.35)] backdrop-blur sm:rounded-full">
      <div role="radiogroup" aria-label="Day or night" className="flex rounded-full bg-muted p-0.5">
        {(["day", "night"] as DayNight[]).map((v) => (
          <label
            key={v}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground has-[:checked]:bg-card has-[:checked]:text-foreground has-[:checked]:shadow-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
          >
            <input type="radio" name="scene-daynight" value={v} checked={state.dayNight === v} onChange={() => set({ dayNight: v })} className="sr-only" />
            {v === "day" ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
            {v === "day" ? "Day" : "Night"}
          </label>
        ))}
      </div>
      {divider}
      <div role="radiogroup" aria-label="Background" className="flex items-center gap-2">
        <span aria-hidden="true" className="text-xs text-muted-foreground">Wall material</span>
        {BACKGROUNDS.map((b) => (
          <label
            key={b.id}
            title={b.label}
            style={{ background: b.thumb }}
            className="relative block h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-border has-[:checked]:ring-2 has-[:checked]:ring-brand has-[:checked]:ring-offset-2 has-[:checked]:ring-offset-card has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
          >
            <input type="radio" name="scene-background" value={b.id} aria-label={b.label} checked={state.background === b.id} onChange={() => set({ background: b.id })} className="sr-only" />
          </label>
        ))}
      </div>
      {divider}
      <button type="button" onClick={camera.reset} className={btn}>
        <RotateCcw aria-hidden="true" className="h-4 w-4" />
        Reset
      </button>
      <div className="flex items-center rounded-full bg-muted">
        <button type="button" aria-label="Zoom out" onClick={camera.zoomOut} className={`${btn} px-2.5`}>
          <Minus aria-hidden="true" className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Zoom in" onClick={camera.zoomIn} className={`${btn} px-2.5`}>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
