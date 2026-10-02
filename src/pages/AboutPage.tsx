import { useEffect } from "react";
import ProductionSection from "../components/ProductionSection";
import DeliverySection from "../components/DeliverySection";
import ProcessSection from "../components/ProcessSection";
import TargetGroups from "../components/TargetGroups";
import FinalCTA from "../components/FinalCTA";
import Seo from "../components/Seo";

export default function AboutPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Seo
        title="How We Work — Our Manufacturing Process"
        description="From CNC programming to final quality check: how Sunlite Signs fabricates, wires and ships UL 48 listed channel letters and illuminated signage ready-to-install."
        path="/about"
      />
      <section className="pt-24 pb-12 bg-secondary">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">How We Work</h1>
          <p className="text-muted-foreground text-lg">
            From CNC programming to final quality check — here's how your signage gets made and shipped ready-to-install.
          </p>
        </div>
      </section>
      <ProductionSection />
      <DeliverySection />
      <ProcessSection />
      <TargetGroups />
      <FinalCTA />
    </>
  );
}
