import { PrimaryCta } from "../CtaButton";

export default function TradeStatement() {
  return (
    <section id="trade-only" className="border-t border-border bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
        <h2 className="text-4xl sm:text-5xl md:text-7xl uppercase">
          We don't compete with our partners.
          <br />
          We build for them.
        </h2>
        <div>
          <p className="text-lg opacity-90">
            Sunlite is trade-only. We manufacture for sign companies and industry professionals — we don't compete for their end customers.
          </p>
          <p className="mono-label mt-5 mb-8 font-bold">Your customer stays your customer.</p>
          <PrimaryCta tone="inverse" />
        </div>
      </div>
    </section>
  );
}
