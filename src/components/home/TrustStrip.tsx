/**
 * Capability strip directly under the hero. Only claims the owner has confirmed:
 * UL 48 listed, German engineered, quotes in 24 to 48 hours (most times 24), 3-4 week production + delivery,
 * 3-year LED & power-supply warranty, trade only (the site's "your customer stays your customer" promise).
 */
const items = [
  { value: "UL 48 Listed", label: "Electrical sign certification" },
  { value: "German engineered", label: "EdgeLuxe letter systems" },
  { value: "24–48 H", label: "Tailored quotes, most times 24 h" },
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
            <dt className="font-heading text-2xl md:text-3xl font-bold uppercase leading-none">{item.value}</dt>
            <dd className="mono-label text-muted-foreground mt-3">{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
