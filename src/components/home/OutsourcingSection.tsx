import SectionHeader from "../SectionHeader";

const benefits = [
  { title: "More production capacity", text: "Take on additional projects without expanding your own production floor." },
  { title: "Ready to install", text: "Receive fabricated signage prepared for efficient installation." },
  { title: "Trade-only", text: "We manufacture for sign companies and industry professionals." },
  { title: "Your customer stays yours", text: "We don't compete with our partners." },
];

export default function OutsourcingSection() {
  return (
    <section id="trade" className="py-14 md:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Built for the trade"
          title={
            <>
              More capacity.
              <br />
              <span className="text-primary">Without more overhead.</span>
            </>
          }
          intro="Take on more illuminated-sign projects without adding fabrication equipment, inventory or production staff."
        />
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-primary/50">
          {benefits.map((b, i) => (
            <li key={b.title} className="pt-6 pb-8 pr-6 sm:pl-6 border-border sm:odd:pl-0 sm:even:border-l lg:odd:pl-6 lg:first:pl-0 lg:border-l lg:first:border-l-0">
              <span className="mono-label text-muted-foreground">0{i + 1}</span>
              <h3 className="text-2xl md:text-3xl mt-2 uppercase">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-3 max-w-xs">{b.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
