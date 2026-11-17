import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { cn } from "@project/lib/utils";
import { useDesktop } from "./useDesktop";

export interface PanelTab {
  id: string;
  label: string;
  /** Step heading shown on desktop. */
  heading?: string;
  /** What is chosen in this step, shown beside the heading while the step is closed ("100″ × 17″"). */
  summary?: string;
  icon: ReactNode;
  content: ReactNode;
}

interface ConfiguratorPanelProps {
  tabs: PanelTab[];
  /** Always-visible primary action (Get a Quote). */
  action: ReactNode;
  /** Told which step is open (null while the sheet is folded away on a phone), so the preview can show what it is about. */
  onStep?: (id: string | null) => void;
  /** Open this step from outside (the guided tour). A new object each time, so the same step can be asked for again. */
  goTo?: { id: string } | null;
}

/**
 * The options as numbered steps, so a first-time visitor sees where to start and what comes next (owner, 2026-11-17:
 * "for first time visitors … there is no real structure").
 * Desktop (lg+): the steps stacked in the side column, one open at a time; a closed step shows what was chosen and a
 * "Next" button leads on. The action is pinned under them.
 * Tablet / phone: the open step is a short sheet under the preview, the numbered step bar sits at the bottom with the
 * action beside it, and tapping the open step again folds the sheet away so the preview gets the whole screen.
 * Every step stays mounted (closed ones are only hidden by CSS), so nothing is lost when switching.
 */
export default function ConfiguratorPanel({ tabs, action, onStep, goTo }: ConfiguratorPanelProps) {
  const [active, setActive] = useState(tabs[0].id);
  const [open, setOpen] = useState(true);
  const [seen, setSeen] = useState<string[]>([tabs[0].id]);
  const desktop = useDesktop();

  useEffect(() => {
    if (!goTo || !tabs.some((t) => t.id === goTo.id)) return;
    onStep?.(goTo.id);
    setActive(goTo.id);
    setOpen(true);
    setSeen((s) => (s.includes(goTo.id) ? s : [...s, goTo.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo]);

  function choose(id: string) {
    if (id === active) {
      onStep?.(open ? null : id);
      setOpen((o) => !o);
    } else {
      onStep?.(id);
      setActive(id);
      setOpen(true);
      setSeen((s) => (s.includes(id) ? s : [...s, id]));
    }
  }

  return (
    <div className="grid min-h-0 grid-cols-1 gap-y-2 lg:h-full lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-y-3">
      <div
        className={cn(
          "order-1 max-h-[40svh] min-h-0 overflow-y-auto rounded-xl border border-border bg-card/70 p-3 lg:order-1 lg:max-h-none lg:border-0 lg:bg-transparent lg:p-0 lg:pr-2",
          !open && "max-lg:hidden"
        )}
      >
        {desktop ? (
          <ol className="space-y-2">
            {tabs.map((t, i) => {
              const on = t.id === active && open;
              const done = !on && seen.includes(t.id);
              const next = tabs[i + 1];
              return (
                <li key={t.id} data-tour-step={t.id} className={cn("rounded-xl border bg-card transition-colors", on ? "border-brand/60" : "border-border")}>
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`panel-${t.id}`}
                    onClick={() => choose(t.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        on ? "bg-brand text-brand-foreground" : done ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="shrink-0 text-base font-semibold">
                      <span className="sr-only">Step {i + 1}: </span>
                      {t.heading ?? t.label}
                    </span>
                    {!on && t.summary && <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground">{t.summary}</span>}
                    <ChevronDown aria-hidden="true" className={cn("ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform", on && "rotate-180", !on && t.summary && "ml-0")} />
                  </button>
                  <div id={`panel-${t.id}`} role="group" aria-label={t.heading ?? t.label} className={cn("space-y-3 px-3.5 pb-3.5", !on && "hidden")}>
                    {t.content}
                    {next && (
                      <button
                        type="button"
                        onClick={() => choose(next.id)}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-input bg-background text-sm font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        Next: {next.heading ?? next.label}
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          tabs.map((t) => (
            <div key={t.id} id={`panel-${t.id}`} data-tour-step={t.id} role="group" aria-label={t.label} className={cn("space-y-3", t.id !== active && "hidden")}>
              {t.content}
            </div>
          ))
        )}
      </div>

      <nav aria-label="Sign options, step by step" className="order-2 flex min-w-0 gap-1 lg:hidden">
        {tabs.map((t, i) => {
          const on = t.id === active && open;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={`Step ${i + 1}: ${t.label}`}
              title={t.label}
              aria-pressed={t.id === active}
              aria-expanded={t.id === active ? open : undefined}
              aria-controls={`panel-${t.id}`}
              onClick={() => choose(t.id)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:text-[11px]",
                on ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <span aria-hidden="true" className="relative [&>svg]:h-5 [&>svg]:w-5">
                {t.icon}
                <span className={cn("absolute -right-2.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold leading-none", on ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
              </span>
              <span className="max-w-full truncate">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div data-tour="actions" className="order-3 flex gap-2 lg:order-2 [&>*]:flex-1">{action}</div>
    </div>
  );
}
