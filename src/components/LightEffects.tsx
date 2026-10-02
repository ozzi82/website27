import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { configurations } from "../data/configurations";

export default function LightEffects() {
  return (
    <section id="light-effects" className="py-24 md:py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 border-b border-border pb-8">
          <p className="mono-label text-primary mb-4">04 / EdgeLuxe letter systems</p>
          <h2 className="text-5xl md:text-7xl">Choose your<br />letter system</h2>
          <p className="text-muted-foreground mt-6 max-w-xl">12 German-engineered, UL Listed configurations, from flat cutouts to halo-lit stainless steel and sealed block acrylic. Open any one for depths, materials and limits.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {configurations.map((c) => (
            <Link key={c.id} to={`/light-effects/${c.id}`} className="group bg-card flex flex-col rounded-xl overflow-hidden border border-border hover:border-primary/60 transition-colors">
              <div className="aspect-square overflow-hidden relative">
                <img src={c.img} alt={`${c.title} — ${c.subtitle}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
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
