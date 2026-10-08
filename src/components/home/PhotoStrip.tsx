import Picture from "../Picture";
import { projectsByIds } from "../../data/projects";

/** Real installed signs, shown straight under the capability strip so the proof is visible without a click. */
const IDS = ["tradebyte", "inspire", "stroh-scheuerpflug", "argo-hytos", "itonics", "macs"];

export default function PhotoStrip() {
  const items = projectsByIds(IDS);
  return (
    <section aria-label="Recent installed signs" className="border-b border-border bg-background">
      <ul className="max-w-[1600px] mx-auto grid grid-cols-3 lg:grid-cols-6 gap-px bg-border">
        {items.map((p) => (
          <li key={p.id} className="relative bg-card overflow-hidden aspect-square group">
            <Picture
              src={p.image}
              alt={p.alt}
              sizes="(min-width: 1024px) 17vw, 34vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute left-0 bottom-0 bg-background/80 backdrop-blur-sm px-2.5 py-1 mono-label text-foreground">{p.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
