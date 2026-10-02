import { Package } from "lucide-react";

export default function DeliverySection() {
  return (
    <section className="py-8 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex items-start gap-4 bg-card border border-border rounded-xl p-4 md:p-6">
          <Package className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1">Shipped Ready-to-Install</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Every sign ships with a drill template and wiring plan, delivered to your shop, warehouse, or project site.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
