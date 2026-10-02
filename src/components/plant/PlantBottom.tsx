import { Link } from "react-router-dom";
import { Button } from "@project/components/ui/button";
import { ArrowRight, Cpu, ShieldCheck, Truck, Wrench, FileCheck2, Handshake } from "lucide-react";
import { SectionTitle } from "./PlantTop";

const P = "https://images.fillout.com/orgid-779834/flowpublicid-qfzct8lfax/widgetid-default/";
const CNC = "/images/pasted-image-1787755330414-fxpkbj9m.png";
const ASSEMBLY = "/images/pasted-image-1787755199271-ob18hn5t.png";

const caps = [
  { icon: Cpu, title: "CNC & Laser Fabrication", text: "Precision-routed aluminum returns, faces and backs built to your shop drawings." },
  { icon: ShieldCheck, title: "UL 48 Listed", text: "Every illuminated sign ships with electrical sign certification and labels." },
  { icon: FileCheck2, title: "48h Tailored Quotes", text: "Send dimensions, illumination and materials — pricing back within 48 hours." },
  { icon: Truck, title: "3–4 Week Dock Delivery", text: "Crated, protected and delivered to your dock from approved PO." },
  { icon: Wrench, title: "Ready to Install", text: "Pre-wired, with templates and hardware so your crew installs, not fixes." },
  { icon: Handshake, title: "3-Year Warranty", text: "LED modules and power supplies covered against manufacturing defects." },
];

export function Facility() {
  return (
    <section className="py-24 md:py-32 border-t border-border steel-plate">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle no="02" kicker="Facility" title={<>The production floor<br /><span className="text-primary">behind your brand</span></>} />
        <div className="grid lg:grid-cols-5 gap-6">
          <figure className="lg:col-span-3 rounded-xl overflow-hidden border border-border">
            <img src={CNC} alt="CNC fabrication" className="w-full h-full object-cover aspect-[16/10]" />
            <figcaption className="mono-label p-3 border-t border-border bg-card">FIG. A — CNC routing & fabrication</figcaption>
          </figure>
          <figure className="lg:col-span-2 rounded-xl overflow-hidden border border-border flex flex-col">
            <img src={ASSEMBLY} alt="Assembly and wiring" className="w-full flex-1 object-cover aspect-[4/3] lg:aspect-auto" />
            <figcaption className="mono-label p-3 border-t border-border bg-card">FIG. B — Assembly, wiring & QC</figcaption>
          </figure>
        </div>
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {caps.map((c, i) => (
            <div key={c.title} className="rounded-xl border border-border p-7 bg-card/70 hover:bg-card transition-colors">
              <div className="flex justify-between mb-6">
                <c.icon className="w-6 h-6 text-primary" />
                <span className="mono-label text-muted-foreground">CAP.{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="text-2xl mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  ["Drawings in", "Send shop drawings, dimensions, illumination type and materials."],
  ["Quote in 48h", "Itemized pricing tailored to your spec — no guesswork."],
  ["Approval & PO", "We confirm proofs and lock the production schedule."],
  ["Fabrication", "CNC, forming, assembly, LED wiring and UL 48 labeling."],
  ["Crated to dock", "Protected, labeled and delivered in 3–4 weeks."],
];

export function Workflow() {
  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle no="03" kicker="Workflow" title={<>From file<br />to freight</>} />
        <ol className="grid md:grid-cols-5 border-t-2 border-primary/50">
          {steps.map(([t, d], i) => (
            <li key={t} className="pt-6 pr-6 pb-8 md:border-r border-border last:border-r-0 md:pl-6 first:md:pl-0">
              <span className="font-heading text-6xl font-bold text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-2xl mt-2 mb-2">{t}</h3>
              <p className="text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function TradeStatement() {
  return (
    <section className="border-t border-border bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
        <h2 className="text-5xl md:text-7xl">We don't compete with our partners. We build for them.</h2>
        <div>
          <p className="text-lg mb-8 opacity-80">
            Sunlite works exclusively with sign companies, graphics shops and industry professionals. Send us the drawing — we'll send back a quote in 48 hours.
          </p>
          <Button asChild size="lg" className="h-14 px-8 uppercase tracking-wider font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link to="/contact">Send Your Drawings <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
