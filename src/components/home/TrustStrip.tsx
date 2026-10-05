/**
 * Capability strip directly under the hero. Only claims the owner has confirmed:
 * UL 48 listed, German-engineered, quotes in 24 to 48 hours (most times 24), 3-4 week production + delivery,
 * 3-year LED & power-supply warranty, trade only (the site's "your customer stays your customer" promise).
 */
const items = [
  { value: "UL 48 Listed", label: "Electrical sign certification" },
  { value: "German-engineered", label: "EdgeLuxe letter systems" },
  { value: "24–48 H", label: "Quotes in 24–48 hours, most within 24" },
  { value: "3–4 WK", label: "Typical production + delivery" },
  { value: "3 YR", label: "LED & power supply warranty" },
  { value: "Trade only", label: "Your customer stays your customer." },
];

export default function TrustStrip() {
  return (
    <section aria-label="Capabilities" className="border-b border-border bg-card">
      <dl className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-6 gap-px bg-border">
        {items.map((item) => (
          <div key={item.value} className="bg-card px-5 py-7 md:py-8">
            <dt className="font-heading text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold uppercase leading-none flex items-center gap-3 [overflow-wrap:anywhere]">
              {item.value === "UL 48 Listed" && (
                // The UL mark supplied by the owner (public/images/ul-mark.svg), shown unaltered.
                <img src="/images/ul-mark.svg" alt="UL mark" width={40} height={40} className="h-9 w-9 md:h-10 md:w-10 shrink-0" />
              )}
              <span>{item.value}</span>
            </dt>
            <dd className="mono-label text-muted-foreground mt-3">{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
