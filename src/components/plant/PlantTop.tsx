import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@project/components/ui/button";
import { services } from "../../data/services";
const VIDEO_ID = "QsF9N8ym39k";
export function PlantHero() {
  return <section className="relative min-h-[92vh] flex flex-col overflow-hidden border-b border-border">
      <div className="absolute inset-0 pointer-events-none">
        <iframe title="Sunlite production floor" className="absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2" src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&modestbranding=1&playsinline=1&rel=0`} allow="autoplay; encrypted-media" />
        <div className="absolute inset-0 bg-background/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/40" />
      </div>
      <div className="relative flex-1 max-w-7xl w-full mx-auto px-6 pt-36 pb-16 flex flex-col justify-end">
        <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className='mono-label mb-6 font-bold text-base text-[#ffffff]'>Wholesale sign manufacturer · Trade only</motion.p>
        <motion.h1 initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.7
      }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl max-w-4xl">
          Engineered signs.<br />
          <span className="text-primary">Built at volume.</span>
        </motion.h1>
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }} className="mt-10 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <p className='text-lg text-muted-foreground max-w-xl'>Channel letters, trimless letters, flat cut out letters and illuminated tagline letters — fabricated to your shop drawings, UL 48 listed.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-14 px-8 uppercase tracking-wider font-semibold">
              <Link to="/contact">Request a Quote <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 uppercase tracking-wider font-semibold bg-transparent">
              <a href="#products">Product Lines</a>
            </Button>
          </div>
        </motion.div>
      </div>
      <div className="caution-tape h-2 relative" />
    </section>;
}
const specs = [["UL 48", "Wholesale only production"], ["48 H", "Quote turnaround"], ["3–4 WK", "Approval to dock"], ["3 YR", "LED + power supply warranty"], ["100%", "Trade-only production"]];
export function SpecRail() {
  return <section className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5">
        {specs.map(([v, l], i) => <div key={v} className={`px-6 py-8 border-border ${i ? "md:border-l" : ""} ${i % 2 ? "border-l md:border-l" : ""} ${i > 1 ? "border-t md:border-t-0" : ""}`}>
            <div className="font-heading text-4xl md:text-5xl font-bold">{v}</div>
            <div className="mono-label text-muted-foreground mt-2">{l}</div>
          </div>)}
      </div>
    </section>;
}
export function SectionTitle({
  no,
  kicker,
  title
}: {
  no: string;
  kicker: string;
  title: React.ReactNode;
}) {
  return <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border pb-8">
      <div>
        <p className="mono-label text-primary mb-4">{no} / {kicker}</p>
        <h2 className="text-5xl md:text-7xl">{title}</h2>
      </div>
    </div>;
}
export function ProductLines() {
  return <section id="products" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle no="01" kicker="Product lines" title={<>What leaves<br />our floor</>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => <Link key={s.id} to={`/services/${s.id}`} className="group bg-card flex flex-col rounded-xl overflow-hidden border border-border hover:border-primary/60 transition-colors">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src={s.img} alt={s.title} className="w-full h-full object-cover grayscale-[60%] group-hover:grayscale-0 group-hover:scale-105 transition duration-700" />
                <span className="absolute top-3 left-3 mono-label bg-background/90 px-2 py-1 rounded-md">SL-{String(i + 1).padStart(3, "0")}</span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl md:text-3xl">{s.shortTitle}</h3>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground mt-3">{s.desc}</p>
                <dl className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-3">
                  {s.details.specs.slice(0, 2).map(sp => <div key={sp.label}>
                      <dt className="mono-label text-muted-foreground">{sp.label}</dt>
                      <dd className="text-sm font-medium mt-1">{sp.value}</dd>
                    </div>)}
                </dl>
              </div>
            </Link>)}
        </div>
      </div>
    </section>;
}