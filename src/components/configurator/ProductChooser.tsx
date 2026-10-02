import type { Product } from "./types";

interface ProductChooserProps {
  onSelect: (product: Product) => void;
}

export default function ProductChooser({ onSelect }: ProductChooserProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <button
        onClick={() => onSelect("trimless-letters")}
        className="text-left p-6 rounded-xl border border-border bg-card hover:border-primary/60 transition-colors"
      >
        <h3 className="text-xl font-semibold mb-1">Trimless Letters</h3>
        <p className="text-sm text-muted-foreground">
          Ultra-slim channel letters — face-lit, halo-lit, or dual-lit.
        </p>
      </button>
      <button
        onClick={() => onSelect("cast-block-acrylic")}
        className="text-left p-6 rounded-xl border border-border bg-card hover:border-primary/60 transition-colors"
      >
        <h3 className="text-xl font-semibold mb-1">Cast Block Acrylic</h3>
        <p className="text-sm text-muted-foreground">
          Solid cast acrylic letters with even internal glow.
        </p>
      </button>
    </div>
  );
}
