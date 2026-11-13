/**
 * The technical view and the section drawings of an EdgeLuxe product. Both are served by the CRM, which holds the
 * one description of each construction (parts, depths, lighting), so the website and the CRM cannot drift apart.
 */
export const TECHNICAL_BASE: string = ((import.meta.env.VITE_CRM_URL as string | undefined) ?? "https://crm.sunlitesigns.com").replace(/\/$/, "");

export const DRAWING_FORMATS = [
  { format: "pdf", label: "PDF" },
  { format: "dxf", label: "DXF (CAD)" },
  { format: "svg", label: "SVG" },
] as const;
export type DrawingFormat = (typeof DRAWING_FORMATS)[number]["format"];

/** "LP 11-FS" → "lp11-fs", "LP 3.1" → "lp3-1"; a combined build ("LP 5+3.1") is shown by its first product. */
export function technicalSlug(code: string): string {
  return code.split("+")[0]!.trim().toLowerCase().replace(/\s+/g, "").replace(/\./g, "-");
}

/** The turning, self-opening view of the product, made to be framed. Empty when the hand-over is switched off. */
export function technicalViewUrl(code: string, depthMm?: number, base: string = TECHNICAL_BASE): string {
  if (!base) return "";
  // In the website's own colours, the parts pulled apart, and nothing moving until the visitor presses Play.
  const depth = depthMm && Number.isFinite(depthMm) ? `&depth=${Math.round(depthMm)}` : "";
  return `${base}/edgeluxe/${technicalSlug(code)}/embed?theme=site&explode=100&play=0${depth}`;
}

export type DrawingKind = "section" | "exploded";

/** The section drawing (or the exploded view with numbered parts) as a file, at the chosen depth. */
export function drawingUrl(code: string, format: DrawingFormat, depthMm?: number, base: string = TECHNICAL_BASE, kind: DrawingKind = "section"): string {
  if (!base) return "";
  const depth = depthMm && Number.isFinite(depthMm) ? `&depth=${Math.round(depthMm)}` : "";
  return `${base}/edgeluxe/${technicalSlug(code)}/drawing?format=${format}${depth}${kind === "exploded" ? "&drawing=exploded" : ""}`;
}

/** The drawing as a picture to show on a page (SVG, served inline). */
export function drawingImageUrl(code: string, depthMm?: number, kind: DrawingKind = "section", base: string = TECHNICAL_BASE): string {
  const url = drawingUrl(code, "svg", depthMm, base, kind);
  return url ? `${url}&view=1` : "";
}
