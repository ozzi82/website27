import { Download, FileText } from "lucide-react";
import { Button } from "@project/components/ui/button";
import { cn } from "@project/lib/utils";
import { SPEC_GUIDE } from "../lib/specGuide";

/**
 * Download card for the PDF spec guide. "banner" is a full-width band for a page section; "inline" is a compact card for
 * the spec sections of the product pages. It is a plain link to the file (no form), so it also works without JavaScript.
 */
export default function SpecGuide({ variant = "inline", className }: { variant?: "banner" | "inline"; className?: string }) {
  const banner = variant === "banner";
  const button = (
    <Button asChild size="lg" className={cn("uppercase tracking-wider font-semibold shrink-0", banner ? "h-14 px-8" : "h-11 px-6")}>
      <a href={SPEC_GUIDE.href} target="_blank" rel="noopener" download="Sunlite-Signs-EdgeLuxe-Spec-Guide.pdf">
        <Download aria-hidden="true" /> Download PDF
      </a>
    </Button>
  );
  const body = (
    <div className="flex items-start gap-4 min-w-0">
      <FileText aria-hidden="true" className={cn("shrink-0 text-primary", banner ? "w-10 h-10" : "w-8 h-8")} />
      <div>
        <p className="mono-label text-primary">Spec guide · PDF · {SPEC_GUIDE.pages} pages · {SPEC_GUIDE.size}</p>
        <p className={cn("font-heading uppercase leading-tight mt-1", banner ? "text-2xl md:text-3xl" : "text-xl")}>Download the {SPEC_GUIDE.title}</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">{SPEC_GUIDE.summary}</p>
      </div>
    </div>
  );
  if (banner) {
    return (
      <section aria-label="Spec guide download" className={cn("border-y border-border steel-plate", className)}>
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {body}
          {button}
        </div>
      </section>
    );
  }
  return (
    <div className={cn("border border-border bg-card/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5", className)}>
      {body}
      {button}
    </div>
  );
}
