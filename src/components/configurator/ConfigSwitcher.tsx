import { useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { configurations } from "../../data/configurations";

interface ConfigSwitcherProps {
  value: string;
  onChange: (configId: string) => void;
}

const arrowClass =
  "inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

/** Compact configuration picker at the top of the options panel: a select plus previous/next steppers. */
export default function ConfigSwitcher({ value, onChange }: ConfigSwitcherProps) {
  const id = useId();
  const index = Math.max(0, configurations.findIndex((c) => c.id === value));
  const step = (delta: number) =>
    onChange(configurations[(index + delta + configurations.length) % configurations.length].id);

  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="sr-only">
        Configuration
      </label>
      <button type="button" aria-label="Previous configuration" onClick={() => step(-1)} className={arrowClass}>
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-0 flex-1 truncate rounded-md border border-input bg-background px-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        {configurations.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} · {c.subtitle}
          </option>
        ))}
      </select>
      <button type="button" aria-label="Next configuration" onClick={() => step(1)} className={arrowClass}>
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
