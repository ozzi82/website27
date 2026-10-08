import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Picture from "../Picture";
import { projectsByIds } from "../../data/projects";

/** Real installed signs in a swipeable carousel straight under the capability strip, so the proof is visible without a click. */
const IDS = [
  "heller", "tradebyte", "inspire", "shake-it-up", "stroh-scheuerpflug", "argo-hytos", "arch-logo", "itonics", "macs",
  "event-stand", "interior-wall-graphic", "jentower", "concourse-column", "acorn-crest",
];
const AUTO_MS = 4500;

export default function PhotoStrip() {
  const items = projectsByIds(IDS);
  const track = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  function page(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  useEffect(() => {
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* no matchMedia: keep auto-advance */
    }
    if (paused || reduced) return;
    const id = setInterval(() => page(1), AUTO_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Recent installed signs"
      className="relative border-b border-border bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <ul ref={track} className="flex snap-x snap-mandatory gap-px overflow-x-auto bg-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <li key={p.id} className="relative aspect-[4/3] w-[72vw] shrink-0 snap-start overflow-hidden bg-card sm:w-[38vw] lg:w-[24vw]">
            <Picture src={p.image} alt={p.alt} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 38vw, 72vw" className="h-full w-full object-cover" />
            <span className="absolute bottom-0 left-0 bg-background/80 px-2.5 py-1 mono-label text-foreground backdrop-blur-sm">{p.title}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => page(-1)} aria-label="Previous photos" className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button type="button" onClick={() => page(1)} aria-label="Next photos" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </section>
  );
}
