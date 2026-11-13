import { useState } from "react";
import { Box, Download } from "lucide-react";
import { cn } from "@project/lib/utils";
import type { LightConfig } from "../data/configurations";
import { DRAWING_FORMATS, drawingImageUrl, drawingUrl, technicalViewUrl, type DrawingKind } from "../lib/technicalView";
import TechnicalView from "./configurator/TechnicalView";

const inches = (mm: number) => `${(mm / 25.4).toFixed(1).replace(/\.0$/, "")}″`;
const linkClass = "rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

/** The depth shown first: 50 mm where it is offered (fabricated letters), else the deepest (the 30 mm block). */
export const startDepth = (depths: number[]) => (depths.includes(50) ? 50 : depths[depths.length - 1]);

function Downloads({ code, depthMm, kind, label }: { code: string; depthMm?: number; kind: DrawingKind; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex w-36 items-center gap-1.5 text-sm text-muted-foreground">
        <Download aria-hidden="true" className="h-4 w-4" />
        {label}
      </span>
      {DRAWING_FORMATS.filter((f) => kind === "section" || f.format !== "svg").map((f) => (
        <a key={f.format} href={drawingUrl(code, f.format, depthMm, undefined, kind)} target="_blank" rel="noopener" className={linkClass} aria-label={`${code} ${label.toLowerCase()} as ${f.label}`}>
          {f.label}
        </a>
      ))}
    </div>
  );
}

/**
 * How one product is built, on its own page: the 3D view that opens into numbered parts (loaded only when asked
 * for), the section drawing, and both drawings as files for the visitor's own drawings. Everything comes from the
 * one description of the construction that the quoting system holds.
 */
export default function ProductConstruction({ config, className }: { config: LightConfig; className?: string }) {
  const depths = config.depthOptionsMm;
  const [depth, setDepth] = useState<number | undefined>(depths.length > 1 ? startDepth(depths) : undefined);
  const [open3d, setOpen3d] = useState(false);
  const view = technicalViewUrl(config.code, depth);
  if (!view) return null;
  return (
    <section className={cn("mt-16", className)} aria-labelledby="construction-heading" data-testid="product-construction">
      <p className="mono-label text-primary mb-3">Construction</p>
      <h2 id="construction-heading" className="text-3xl md:text-4xl mb-4">How {config.code} is built.</h2>
      <p className="max-w-3xl text-muted-foreground">
        Open the letter into its numbered parts in 3D, and download the section drawing and the exploded view for your own drawings and permit sets. Dimensions marked typ. are typical values, confirmed with the order.
      </p>

      {depths.length > 1 && (
        <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Depth">
          <span className="text-sm text-muted-foreground">Depth</span>
          {depths.map((d) => (
            <button key={d} type="button" aria-pressed={d === depth} onClick={() => setDepth(d)} className={cn(linkClass, d === depth && "border-primary bg-primary/15 text-primary")}>
              {d} mm ({inches(d)})
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <figure className="border border-border bg-card/50">
          {open3d ? (
            <iframe title={`${config.code} 3D exploded view`} src={view} loading="lazy" className="h-[640px] w-full bg-white" />
          ) : (
            <button
              type="button"
              onClick={() => setOpen3d(true)}
              className="flex h-[320px] w-full flex-col items-center justify-center gap-3 bg-background/60 text-center hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:h-full lg:min-h-[420px]"
            >
              <Box aria-hidden="true" className="h-10 w-10 text-primary" />
              <span className="text-lg font-semibold">Open the 3D exploded view</span>
              <span className="max-w-xs text-sm text-muted-foreground">Turn the letter, pull it apart, tap a number to see that part, switch day and night.</span>
            </button>
          )}
          <figcaption className="px-4 py-2.5 border-t border-border mono-label text-muted-foreground">3D view · a sample letter shows the construction</figcaption>
        </figure>

        <figure className="border border-border bg-card/50">
          <a href={drawingUrl(config.code, "pdf", depth)} target="_blank" rel="noopener" className="block bg-white p-3" aria-label={`${config.code} section drawing as PDF`}>
            <img src={drawingImageUrl(config.code, depth)} alt={`Section drawing of ${config.code}: a cut through one stroke with its parts and dimensions`} loading="lazy" className="mx-auto max-h-[560px] w-full object-contain" />
          </a>
          <figcaption className="px-4 py-2.5 border-t border-border mono-label text-muted-foreground">Section through a stroke · real size in the files, mm and inches</figcaption>
        </figure>
      </div>

      <div className="mt-6 space-y-3">
        <Downloads code={config.code} depthMm={depth} kind="section" label="Section drawing" />
        <Downloads code={config.code} depthMm={depth} kind="exploded" label="Exploded view" />
      </div>
    </section>
  );
}

/**
 * The same for a family page: one line per product with its 3D view (in a window) and the drawing files.
 */
export function ConstructionList({ configs, className }: { configs: LightConfig[]; className?: string }) {
  if (!technicalViewUrl("LP 1")) return null;
  return (
    <ul className={cn("divide-y divide-border border-y border-border", className)} data-testid="construction-list">
      {configs.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
          <div className="min-w-0 flex-1 basis-64">
            <p className="font-semibold">{c.code}</p>
            <p className="text-sm text-muted-foreground">{c.subtitle}</p>
          </div>
          <TechnicalView code={c.code} name={c.title} />
          <a href={drawingUrl(c.code, "pdf")} target="_blank" rel="noopener" className={linkClass} aria-label={`${c.code} section drawing as PDF`}>
            Section PDF
          </a>
          <a href={drawingUrl(c.code, "dxf")} target="_blank" rel="noopener" className={linkClass} aria-label={`${c.code} section drawing as DXF`}>
            DXF (CAD)
          </a>
          <a href={drawingUrl(c.code, "pdf", undefined, undefined, "exploded")} target="_blank" rel="noopener" className={linkClass} aria-label={`${c.code} exploded view as PDF`}>
            Exploded PDF
          </a>
        </li>
      ))}
    </ul>
  );
}
