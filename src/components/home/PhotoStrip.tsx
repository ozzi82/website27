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
      <li key={`${copy}-${p.id}`} aria-hidden={copy === 1 || undefined} className="relative aspect-[4/3] w-[52vw] shrink-0 overflow-hidden rounded-lg bg-card sm:w-[26vw] lg:w-[16vw] xl:w-[15rem]">
        <Picture src={p.image} alt={copy === 1 ? "" : p.alt} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 26vw, 52vw" className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2.5 py-0.5 text-[10px] mono-label text-foreground backdrop-blur-sm">{p.title}</span>
      </li>
    ));
  return (
    <section aria-label="Recent installed signs" className="group border-b border-border bg-background py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 mb-6 md:mb-8">
        <p className="mono-label text-primary">Recent installs</p>
      </div>
      {/* Slow endless drift, with the edges faded out. Hover pauses; reduced motion shows a plain scrollable row. */}
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]">
        <ul className="photo-marquee flex w-max gap-4 pr-4 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
          {row(0)}
          {row(1)}
        </ul>
      </div>
    </section>
  );
}
