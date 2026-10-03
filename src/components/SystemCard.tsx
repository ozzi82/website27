import { ArrowLink } from "./CtaButton";

export interface SystemCardProps {
  /** "LP 11-FS" */
  code: string;
  title: string;
  img: string;
  /** Brochure render of the letter (852 x 1331, portrait). */
  alt: string;
  /** One-line description shown under the title. */
  text: string;
  rows: { label: string; value: string }[];
  links: { label: string; to: string }[];
}

/** One EdgeLuxe letter system as a catalogue card: render, code, how it lights, key facts and links. */
export default function SystemCard({ code, title, img, alt, text, rows, links }: SystemCardProps) {
  return (
    <article className="grid grid-cols-[6.75rem_1fr] sm:flex sm:flex-col border border-border bg-card/50 h-full" data-system={code}>
      <div className="relative overflow-hidden sm:aspect-[3/4] max-sm:min-h-[11rem] max-sm:border-r sm:border-b border-border bg-card">
        <img src={img} alt={alt} width={852} height={1331} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-[50%_35%]" />
        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 mono-label bg-background/90 px-1.5 sm:px-2 py-1">{code}</span>
      </div>
      <div className="p-4 sm:p-5 flex-1 flex flex-col min-w-0">
        <h3 className="text-lg sm:text-2xl leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{text}</p>
        {rows.length > 0 && (
          <dl className="mt-4 pt-3 border-t border-border grid gap-1.5">
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[4.75rem_1fr] gap-x-2 items-baseline">
                <dt className="mono-label text-muted-foreground">{r.label}</dt>
                <dd className="text-sm">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-auto pt-5 flex flex-col gap-2">
          {links.map((l) => (
            <ArrowLink key={l.to} label={l.label} to={l.to} />
          ))}
        </div>
      </div>
    </article>
  );
}
