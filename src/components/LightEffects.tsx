import ULBadge from "./ULBadge";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { configurations } from "../data/configurations";
import SectionHeader from "./SectionHeader";
import { ArrowLink } from "./CtaButton";
import { CTA_LINKS } from "../lib/cta";

export default function LightEffects() {
  return (
    <section id="light-effects" className="py-14 md:py-28 border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="EdgeLuxe letter systems"
          title={
            <>
              Choose your
              <br />
              letter system
            </>
          }
          intro="12 German-engineered, UL Listed configurations, from flat cutouts to halo-lit stainless steel and sealed block acrylic. Open any one for depths, materials and limits."
          action={<ArrowLink label={CTA_LINKS.tryConfigurator.label} to={CTA_LINKS.tryConfigurator.to} />}
        />
        <ULBadge label="Every system UL Listed" className="mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {configurations.map((c) => (
            <Link key={c.id} to={`/light-effects/${c.id}`} className="group bg-card flex flex-col rounded-xl overflow-hidden border border-border hover:border-primary/60 transition-colors">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src={c.img} alt={`${c.title} — ${c.subtitle}`} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                <span className="absolute top-3 left-3 mono-label bg-background/90 px-2 py-1 rounded-md">{c.code}</span>
              </div>
              <div className="p-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-primary transition shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
