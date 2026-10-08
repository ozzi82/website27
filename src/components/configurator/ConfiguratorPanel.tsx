import { useState, type ReactNode } from "react";
import { cn } from "@project/lib/utils";

export interface PanelTab {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

interface ConfiguratorPanelProps {
  tabs: PanelTab[];
  /** Always-visible primary action (Get a Quote). */
  action: ReactNode;
}

/**
 * Options laid out like an app. Desktop (lg+): every section stacked in the side column, scrolling, with the action pinned under it.
 * Tablet / phone: the controls open as a short sheet under the preview, the tab bar sits at the bottom with the action beside it,
 * and tapping the active tab again folds the sheet away so the preview gets the whole screen.
 * Every tab stays mounted (inactive ones are only hidden by CSS), so nothing is lost when switching.
 */
export default function ConfiguratorPanel({ tabs, action }: ConfiguratorPanelProps) {
  const [active, setActive] = useState(tabs[0].id);
  const [open, setOpen] = useState(true);

  function choose(id: string) {
    if (id === active) setOpen((o) => !o);
    else {
      setActive(id);
      setOpen(true);
    }
  }

  return (
    <div className="grid min-h-0 grid-cols-1 gap-y-2 lg:h-full lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-y-3">
      <div
        className={cn(
          "order-1 max-h-[40svh] min-h-0 overflow-y-auto rounded-xl border border-border bg-card/70 p-3 lg:order-1 lg:max-h-none lg:border-0 lg:bg-transparent lg:p-0 lg:pr-1",
          !open && "max-lg:hidden"
        )}
      >
        {tabs.map((t) => (
          <div key={t.id} id={`panel-${t.id}`} role="group" aria-label={t.label} className={cn("space-y-3", t.id !== active && "hidden lg:block")}>
            {t.content}
          </div>
        ))}
      </div>

      <nav aria-label="Sign options" className="order-2 flex min-w-0 gap-1 lg:hidden">
        {tabs.map((t) => {
          const on = t.id === active && open;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={t.label}
              title={t.label}
              aria-pressed={t.id === active}
              aria-expanded={t.id === active ? open : undefined}
              aria-controls={`panel-${t.id}`}
              onClick={() => choose(t.id)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:flex-row lg:gap-1.5 lg:py-2 lg:text-xs",
                on ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <span aria-hidden="true" className="[&>svg]:h-5 [&>svg]:w-5 lg:[&>svg]:h-4 lg:[&>svg]:w-4">
                {t.icon}
              </span>
              <span className="hidden truncate sm:inline">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="order-3 flex gap-2 lg:order-2 [&>*]:flex-1">{action}</div>
    </div>
  );
}
