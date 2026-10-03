import SectionHeader from "./SectionHeader";

const groups = [
  "Sign Companies", "Agencies", "Shopfitters", "Interior Build-Out",
  "Architects", "Planning Firms", "Trade Show Builders", "Print Shops", "Retail Agencies",
];

/** Who Sunlite builds for (existing list of trade audiences), as a ruled editorial grid. */
export default function TargetGroups() {
  return (
    <section id="who-we-serve" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="Who we serve" title="Built for sign companies and trade professionals." titleClassName="text-3xl sm:text-4xl md:text-5xl lg:text-6xl" />
        <ul className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-border">
          {groups.map((g, i) => (
            <li key={g} className="border-r border-b border-border px-4 py-5 md:px-6 md:py-7">
              <span className="mono-label text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-heading text-xl md:text-2xl uppercase mt-1 leading-tight">{g}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
