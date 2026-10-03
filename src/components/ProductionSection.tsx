import SectionHeader from "./SectionHeader";
import ProductionStageCard from "./ProductionStageCard";
import { productionStages } from "../data/production";

/** Manufacturing stages for the inner pages; same data as the homepage section (data/production.ts). */
export default function ProductionSection() {
  return (
    <section id="production" className="py-14 md:py-24 steel-plate bg-secondary/40">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="Manufacturing" title="Visually striking, technically precise, reliably built." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {productionStages.map((stage) => (
            <ProductionStageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </div>
    </section>
  );
}
