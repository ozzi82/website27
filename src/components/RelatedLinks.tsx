import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionHeader from "./SectionHeader";

export interface RelatedItem {
  to: string;
  title: string;
  text: string;
}

/**
 * Quiet "where next" block for the end of a page (brief section 15): two to four ruled links, no images.
 * Each tile is one link, so the whole tile is the click target.
 */
export default function RelatedLinks({
  items,
  eyebrow = "Related",
  title = "Keep exploring.",
  id,
}: {
  items: RelatedItem[];
  eyebrow?: string;
  title?: string;
  id?: string;
}) {
  return (
    <section id={id} aria-label="Related pages" className="py-14 md:py-24 border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow={eyebrow} title={title} titleClassName="text-3xl sm:text-4xl md:text-5xl lg:text-5xl" className="mb-8 md:mb-10 pb-6" />
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-border">
          {items.map((item) => (
            <li key={item.to} className="border-r border-b border-border">
              <Link to={item.to} className="group flex h-full flex-col p-5 md:p-6 hover:bg-card transition-colors">
                <h3 className="text-xl md:text-2xl uppercase leading-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.text}</p>
                <span className="mono-label mt-auto pt-5 inline-flex items-center gap-2 text-primary group-hover:text-foreground transition-colors">
                  Open
                  <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
