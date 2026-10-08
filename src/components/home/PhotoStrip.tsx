import Picture from "../Picture";
import { projectsByIds } from "../../data/projects";

/** Real installed signs drifting slowly under the capability strip, so the proof is visible without a click. Hover pauses; reduced motion shows a plain scrollable row. */
const IDS = [
  "heller", "tradebyte", "inspire", "shake-it-up", "stroh-scheuerpflug", "argo-hytos", "arch-logo", "itonics", "macs",
  "event-stand", "interior-wall-graphic", "jentower", "concourse-column", "acorn-crest",
];

export default function PhotoStrip() {
  const items = projectsByIds(IDS);
  const row = (copy: number) =>
    items.map((p) => (
      <li key={`${copy}-${p.id}`} aria-hidden={copy === 1 || undefined} className="relative aspect-[4/3] w-[44vw] shrink-0 overflow-hidden bg-card sm:w-[22vw] lg:w-[14vw]">
        <Picture src={p.image} alt={copy === 1 ? "" : p.alt} sizes="(min-width: 1024px) 14vw, (min-width: 640px) 22vw, 44vw" className="h-full w-full object-cover" />
        <span className="absolute bottom-0 left-0 bg-background/80 px-2 py-0.5 text-[10px] mono-label text-foreground backdrop-blur-sm">{p.title}</span>
      </li>
    ));
  return (
    <section aria-label="Recent installed signs" className="group overflow-hidden border-b border-border bg-background motion-reduce:overflow-x-auto">
      <ul className="photo-marquee flex w-max gap-px bg-border group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
        {row(0)}
        {row(1)}
      </ul>
    </section>
  );
}
