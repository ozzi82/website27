import { useState } from "react";
import { Layers, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@project/components/ui/dialog";
import { cn } from "@project/lib/utils";
import { DRAWING_FORMATS, drawingUrl, technicalViewUrl } from "@project/lib/technicalView";

interface TechnicalViewProps {
  /** The product code as on the brochure, e.g. "LP 11-F". */
  code: string;
  name: string;
  depthMm?: number;
  className?: string;
}

/**
 * How the chosen product is built: the letter on its own, turning, opening into its numbered parts, and the section
 * drawing to download for the visitor's own drawings. The view loads only when asked for.
 */
export default function TechnicalView({ code, name, depthMm, className }: TechnicalViewProps) {
  const [open, setOpen] = useState(false);
  const view = technicalViewUrl(code, depthMm);
  if (!view) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
          className
        )}
      >
        <Layers aria-hidden="true" className="h-4 w-4" />
        Exploded view &amp; drawings
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92svh] w-[min(96vw,72rem)] max-w-none flex-col gap-3 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{code} · how it is built</DialogTitle>
            <DialogDescription>
              {name}. Drag to turn it, tap a number to see that part. The sample letter shows the construction, not your artwork.
            </DialogDescription>
          </DialogHeader>
          {open && <iframe title={`${code} exploded view`} src={view} loading="lazy" className="h-[62svh] min-h-[360px] w-full rounded-lg border border-border bg-white" />}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Download aria-hidden="true" className="h-4 w-4" />
              Section drawing{depthMm ? ` (${Math.round(depthMm)} mm)` : ""}:
            </span>
            {DRAWING_FORMATS.map((f) => (
              <a
                key={f.format}
                href={drawingUrl(code, f.format, depthMm)}
                target="_blank"
                rel="noopener"
                className="rounded-lg border border-border bg-card px-3 py-1.5 font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {f.label}
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
