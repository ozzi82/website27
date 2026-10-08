import { DISCLAIMER_TEXT } from "./disclaimer";

export interface SummaryItem {
  label: string;
  value: string;
}

/** One slim line under the preview with the choices so far, and the standing caveat beside it. */
export default function ConfigSummaryCard({ items }: { items: SummaryItem[] }) {
  return (
    <section aria-label="Current configuration" className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-border bg-card/60 px-4 py-3">
      <dl className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm font-semibold">
        {items.map((i, n) => (
          <div key={i.label} className="flex items-center gap-2">
            {n > 0 && <span aria-hidden="true" className="text-muted-foreground">•</span>}
            <dt className="sr-only">{i.label}</dt>
            <dd className="max-w-[16rem] truncate" title={`${i.label}: ${i.value}`}>
              {i.value}
            </dd>
          </div>
        ))}
      </dl>
      <p role="note" className="min-w-0 flex-1 text-[11px] leading-snug text-muted-foreground">
        {DISCLAIMER_TEXT}
      </p>
    </section>
  );
}
