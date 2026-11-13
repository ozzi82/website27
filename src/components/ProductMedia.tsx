import { useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@project/lib/utils";
import type { LightConfig } from "../data/configurations";
import { DRAWING_FORMATS, drawingImageUrl, drawingUrl, technicalViewUrl, type DrawingKind } from "../lib/technicalView";
import { startDepth } from "./ProductConstruction";
import SegmentedControl from "./configurator/SegmentedControl";
import SystemImage from "./SystemImage";

type Tab = "photo" | "exploded" | "section";
const inches = (mm: number) => `${(mm / 25.4).toFixed(1).replace(/\.0$/, "")}″`;
const chip = "rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

function Files({ code, depthMm, kind, label }: { code: string; depthMm?: number; kind: DrawingKind; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-28 text-xs text-muted-foreground">{label}</span>
      {DRAWING_FORMATS.filter((f) => kind === "section" || f.format !== "svg").map((f) => (
        <a key={f.format} href={drawingUrl(code, f.format, depthMm, undefined, kind)} target="_blank" rel="noopener" className={chip} aria-label={`${code} ${label.toLowerCase()} as ${f.label}`}>
          {f.label}
        </a>
      ))}
    </div>
  );
}

/**
 * The picture area of a product page, as tabs so the page does not grow: the photo, the 3D view with the parts
 * pulled apart (loaded when its tab is opened; nothing moves until Play), and the section drawing. Depth and the
 * drawing files sit under it. Without the quoting system's address only the photo is shown.
 */
export default function ProductMedia({ config }: { config: LightConfig }) {
  const depths = config.depthOptionsMm;
  const [tab, setTab] = useState<Tab>("photo");
  const [depth, setDepth] = useState<number | undefined>(depths.length > 1 ? startDepth(depths) : undefined);
  const view = technicalViewUrl(config.code, depth);
  if (!view) return <SystemImage config={config} />;
  return (
    <div className="self-start lg:sticky lg:top-24" data-testid="product-media">
      <SegmentedControl<Tab>
        label="What to show"
        value={tab}
        onChange={setTab}
        fill
        options={[
          { value: "photo", label: "Photo" },
          { value: "exploded", label: "Exploded 3D" },
          { value: "section", label: "Section" },
        ]}
      />
      <div className="mt-3">
        {tab === "photo" && <SystemImage config={config} />}
        {tab === "exploded" && (
          <figure className="overflow-hidden rounded-xl border border-border bg-card">
            <iframe title={`${config.code} 3D exploded view`} src={view} className="block h-[640px] w-full" />
            <figcaption className="border-t border-border px-4 py-2.5 mono-label text-muted-foreground">Drag to turn · tap a number to see that part · a sample letter shows the construction</figcaption>
          </figure>
        )}
        {tab === "section" && (
          <figure className="overflow-hidden rounded-xl border border-border bg-card">
            <a href={drawingUrl(config.code, "pdf", depth)} target="_blank" rel="noopener" className="block bg-white p-3" aria-label={`${config.code} section drawing as PDF`}>
              <img src={drawingImageUrl(config.code, depth)} alt={`Section drawing of ${config.code}: a cut through one stroke with its parts and dimensions`} className="mx-auto max-h-[560px] w-full object-contain" />
            </a>
            <figcaption className="border-t border-border px-4 py-2.5 mono-label text-muted-foreground">Section through a stroke · real size in the files, mm and inches</figcaption>
          </figure>
        )}
      </div>

      <div className="mt-4 space-y-2.5 rounded-xl border border-border bg-card/50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Download aria-hidden="true" className="h-4 w-4 text-primary" />
          Drawings for your own drawings and permit sets
        </p>
        {depths.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Depth">
            <span className="w-28 text-xs text-muted-foreground">Depth</span>
            {depths.map((d) => (
              <button key={d} type="button" aria-pressed={d === depth} onClick={() => setDepth(d)} className={cn(chip, d === depth && "border-primary bg-primary/15 text-primary")}>
                {d} mm ({inches(d)})
              </button>
            ))}
          </div>
        )}
        <Files code={config.code} depthMm={depth} kind="section" label="Section drawing" />
        <Files code={config.code} depthMm={depth} kind="exploded" label="Exploded view" />
        <p className="text-xs text-muted-foreground">Dimensions marked typ. are typical values, confirmed with the order.</p>
      </div>
    </div>
  );
}
