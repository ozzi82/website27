import { DISCLAIMER_TEXT } from "./disclaimer";

export interface SummaryItem {
  label: string;
  value: string;
}

/** The choices so far under the preview, with a small picture of the sign, and the standing caveat. */
export default function ConfigSummaryCard({ items, thumb }: { items: SummaryItem[]; thumb?: string | null }) {
  return (
    <section aria-label="Current configuration" className="flex shrink-0 items-center gap-5 rounded-2xl border border-border bg-card px-5 py-4">
      {thumb && <img src={thumb} alt="" width={112} height={76} className="hidden h-[76px] w-28 shrink-0 rounded-lg border border-border object-cover sm:block" />}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold">Current configuration</h2>
        <dl className="mt-2 flex flex-wrap gap-x-7 gap-y-2">
          {items.map((i) => (
            <div key={i.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{i.label}</dt>
              <dd className="max-w-[14rem] truncate text-sm font-semibold" title={i.value}>
                {i.value}
              </dd>
            </div>
          ))}
        </dl>
        <p role="note" className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </section>
  );
}
