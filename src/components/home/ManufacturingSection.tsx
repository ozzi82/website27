import SectionHeader from "../SectionHeader";
import ProductionStageCard from "../ProductionStageCard";
import { PrimaryCta } from "../CtaButton";
import { productionStages } from "../../data/production";

/** "Your Drawings In. Finished Signs Out." (brief section 7). Stages and media come from data/production.ts. */
export default function ManufacturingSection() {
  return (
    <section id="manufacturing" className="py-14 md:py-28 border-t border-border steel-plate scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Manufacturing"
          title={
            <>
              Your Drawings In.
              <br />
              <span className="text-primary">Finished Signs Out.</span>
            </>
          }
          action={<PrimaryCta />}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {productionStages.map((stage) => (
            <ProductionStageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </div>
    </section>
  );
}
