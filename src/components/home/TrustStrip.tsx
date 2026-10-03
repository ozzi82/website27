/**
 * Capability strip directly under the hero (brief section 2). Only claims that already exist on the site:
 * UL 48 listed, 48 h quotes, 3-4 week production + delivery, 3-year LED & power-supply warranty, trade only
 * (the trade-only line is the site's existing "your customer stays your customer" promise).
 */
const items = [
  { value: "UL 48 Listed", label: "Electrical sign certification" },
  { value: "48 H", label: "Tailored quotes" },
  { value: "3–4 WK", label: "Typical production + delivery" },
  { value: "3 YR", label: "LED & power supply warranty" },
  { value: "Trade only", label: "Your customer stays your customer." },
];

export default function TrustStrip() {
  return (
    <section aria-label="Capabilities" className="border-b border-border bg-card">
      <dl className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5">
        {items.map((item, i) => (
          <div
            key={item.value}
            className={[
              "px-6 py-7 md:py-8 border-border",
              i % 2 === 1 ? "border-l" : "",
              i > 1 ? "border-t lg:border-t-0" : "",
              i > 0 ? "lg:border-l" : "",
              i === items.length - 1 ? "col-span-2 lg:col-span-1 border-l-0 lg:border-l" : "",
            ].join(" ")}
          >
            <dt className="font-heading text-3xl md:text-4xl font-bold uppercase leading-none">{item.value}</dt>
            <dd className="mono-label text-muted-foreground mt-3">{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
