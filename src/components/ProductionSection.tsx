import { PenTool, Layers, Cog, Lightbulb, ShieldCheck, Package } from "lucide-react";

const steps = [
  { icon: PenTool, title: "Design" },
  { icon: Layers, title: "Material" },
  { icon: Cog, title: "CNC" },
  { icon: Lightbulb, title: "LED" },
  { icon: ShieldCheck, title: "QC" },
  { icon: Package, title: "Shipping" },
];

export default function ProductionSection() {
  return (
    <section id="production" className="py-12 md:py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-center">Manufacturing</h2>
        <p className="text-muted-foreground text-center mb-6 md:mb-10 max-w-md mx-auto text-sm md:text-base">
          Visually striking, technically precise, reliably built.
        </p>

        <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:justify-center max-w-4xl md:mx-auto mb-6 md:mb-8">
          {steps.map(s => (
            <div key={s.title} className="flex flex-col items-center gap-1.5 md:gap-2 text-center flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                <s.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <span className="text-[10px] md:text-xs font-medium">{s.title}</span>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto">
          <div className="rounded-xl overflow-hidden group relative">
            <img
              src="/images/pasted-image-1787755330414-fxpkbj9m.png"
              alt="CNC Manufacturing"
              className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ filter: 'brightness(1.02) contrast(1.02) saturate(1.05)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-3 left-3 md:left-4 text-white text-xs md:text-sm font-medium">
              CNC Programming & Bending Machine
            </span>
          </div>
          <div className="rounded-xl overflow-hidden group relative">
            <img
              src="/images/pasted-image-1787755199271-ob18hn5t.png"
              alt="LED Assembly"
              className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ filter: 'brightness(1.02) contrast(1.02) saturate(1.05)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-3 left-3 md:left-4 text-white text-xs md:text-sm font-medium">
              Hand Assembly & Quality Control
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
