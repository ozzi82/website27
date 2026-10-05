import SectionHeader from "../SectionHeader";

/**
 * Why a sign company should outsource to Sunlite: five short benefits. Every line restates something already on the
 * site (ships ready to install with touch-up paint, ultra-slim as a specialized option, trade-only) or is a plain statement of
 * what outsourcing means for the shop; nothing here is a number or a claim about Sunlite's equipment.
 */
export const outsourcingBenefits = [
  { title: "Win more jobs", text: "Quote projects without worrying about internal production capacity." },
  { title: "Keep your crew installing", text: "We fabricate and pre-wire the signage and ship it ready to install." },
  { title: "Handle overflow", text: "Use Sunlite when your own production floor is full." },
  { title: "Add specialty capability", text: "Offer ultra-slim and specialty illuminated letters without developing the manufacturing process yourself." },
  { title: "Your customer stays yours", text: "We're trade-only and don't compete with our partners." },
];

/** Column rules without odd/even pseudo-classes (their specificity would beat the lg: rules): two columns from sm, five from lg. */
const itemClass = (i: number) =>
  [
    "pt-6 pb-8 pr-6 border-border lg:pr-5",
    i % 2 === 0 ? "sm:pl-0 sm:border-l-0" : "sm:pl-6 sm:border-l",
    i === 0 ? "lg:pl-0 lg:border-l-0" : "lg:pl-6 lg:border-l",
    i === outsourcingBenefits.length - 1 ? "sm:col-span-2 lg:col-span-1" : "", // the odd one out spans the row on two columns
  ].join(" ");

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
        <ol className="grid sm:grid-cols-2 lg:grid-cols-5 border-t-2 border-primary/50">
          {outsourcingBenefits.map((b, i) => (
            <li key={b.title} className={itemClass(i)}>
              <span className="mono-label text-muted-foreground">0{i + 1}</span>
              <h3 className="text-2xl lg:text-[1.65rem] xl:text-3xl mt-2 uppercase leading-[1.05]">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-3 max-w-xs">{b.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
