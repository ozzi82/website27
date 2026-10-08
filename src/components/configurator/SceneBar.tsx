import { Moon, Sun } from "lucide-react";
import { BACKGROUNDS } from "./backgrounds";
import type { ConfiguratorState, DayNight } from "./types";

interface SceneBarProps {
  state: ConfiguratorState;
  onChange: (state: ConfiguratorState) => void;
}

/** Day | Night and the wall behind the sign, as one floating bar over the preview (desktop). */
export default function SceneBar({ state, onChange }: SceneBarProps) {
  const set = (patch: Partial<ConfiguratorState>) => onChange({ ...state, ...patch });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Day or night" className="flex rounded-full border border-border bg-background/85 p-1 backdrop-blur">
        {(["day", "night"] as DayNight[]).map((v) => (
          <label
            key={v}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-muted-foreground has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
          >
            <input type="radio" name="scene-daynight" value={v} checked={state.dayNight === v} onChange={() => set({ dayNight: v })} className="sr-only" />
            {v === "day" ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
            {v === "day" ? "Day" : "Night"}
          </label>
        ))}
      </div>
      <div role="radiogroup" aria-label="Background" className="flex items-center gap-2.5 rounded-full border border-border bg-background/85 py-1.5 pl-4 pr-2 backdrop-blur">
        <span aria-hidden="true" className="text-xs text-muted-foreground">Wall material</span>
        {BACKGROUNDS.map((b) => (
          <label
            key={b.id}
            title={b.label}
            style={{ background: b.thumb }}
            className="relative block h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-border has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:ring-offset-2 has-[:checked]:ring-offset-background has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
          >
            <input type="radio" name="scene-background" value={b.id} aria-label={b.label} checked={state.background === b.id} onChange={() => set({ background: b.id })} className="sr-only" />
          </label>
        ))}
      </div>
    </div>
  );
}
