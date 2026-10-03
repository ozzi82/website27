import type { ReactNode } from "react";

/** A figure: a technical diagram above a numbered caption block (optionally with one spec row). */
export default function DiagramCard({
  index,
  title,
  diagram,
  meta,
  children,
}: {
  index: string;
  title: string;
  diagram: ReactNode;
  meta?: { label: string; value: string };
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col border border-border bg-card/50">
      <div className="corner-marks border-b border-border bg-background/60 p-4 sm:p-5">{diagram}</div>
      <div className="p-5 md:p-6 flex-1 flex flex-col">
        <p className="mono-label text-muted-foreground">{index}</p>
        <h3 className="text-2xl md:text-3xl mt-1 uppercase">{title}</h3>
        {meta && (
          <dl className="mt-3 pt-3 border-t border-border grid grid-cols-[6.5rem_1fr] gap-x-3 items-baseline">
            <dt className="mono-label text-muted-foreground">{meta.label}</dt>
            <dd className="text-sm font-medium">{meta.value}</dd>
          </dl>
        )}
        <p className="text-sm text-muted-foreground mt-3">{children}</p>
      </div>
    </article>
  );
}
