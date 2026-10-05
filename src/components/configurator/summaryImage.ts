import { DISCLAIMER_TEXT } from "./disclaimer";
import type { QuoteSnapshot } from "./quoteStorage";

export const SUMMARY_IMAGE_NAME = "sign-configuration-summary.jpg";

const WIDTH = 1200;
const PAD = 48;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Breaks `text` into lines no wider than `maxWidth` for the context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/**
 * The configuration as one picture, to travel with the quote next to the artwork file: the 3D preview snapshot (when
 * there is one), every choice as a label/value row, and the preview disclaimer. Returns null, never throws, where
 * canvas is unavailable or drawing fails (the quote then simply goes without the picture).
 */
export async function renderSummaryImage(quote: Pick<QuoteSnapshot, "rows" | "image">): Promise<File | null> {
  try {
    if (typeof document === "undefined") return null;
    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) return null;

    const preview = quote.image ? await loadImage(quote.image) : null;
    const previewHeight = preview ? Math.round((WIDTH - 2 * PAD) * (preview.height / preview.width)) : 0;

    const LABEL_W = 240;
    const ROW_FONT = "26px Arial, Helvetica, sans-serif";
    const measure = document.createElement("canvas").getContext("2d")!;
    measure.font = ROW_FONT;
    const rows = quote.rows.map((r) => ({ ...r, lines: wrap(measure, r.value, WIDTH - 2 * PAD - LABEL_W - 36) }));
    const rowsHeight = rows.reduce((h, r) => h + r.lines.length * 34 + 12, 0);
    measure.font = "20px Arial, Helvetica, sans-serif";
    const disclaimer = wrap(measure, DISCLAIMER_TEXT, WIDTH - 2 * PAD);

    const headerH = 96;
    const height = headerH + (preview ? previewHeight + 28 : 0) + rowsHeight + 28 + disclaimer.length * 28 + PAD;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, height);
    ctx.fillStyle = "#f58220";
    ctx.fillRect(0, 0, WIDTH, 12);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 40px Arial, Helvetica, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Sign configuration", PAD, 66);
    ctx.font = "20px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "right";
    ctx.fillText("Sunlite 3D configurator", WIDTH - PAD, 64);
    ctx.textAlign = "left";

    let y = headerH;
    if (preview) {
      ctx.drawImage(preview, PAD, y, WIDTH - 2 * PAD, previewHeight);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(PAD, y, WIDTH - 2 * PAD, previewHeight);
      y += previewHeight + 28;
    }

    ctx.font = ROW_FONT;
    for (const r of rows) {
      ctx.fillStyle = "#6b7280";
      ctx.fillText(r.label, PAD, y + 26);
      let x = PAD + LABEL_W;
      if (r.swatch) {
        ctx.fillStyle = r.swatch;
        ctx.beginPath();
        ctx.arc(x + 14, y + 17, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 2;
        ctx.stroke();
        x += 36;
      }
      ctx.fillStyle = "#111827";
      r.lines.forEach((line, i) => ctx.fillText(line, x, y + 26 + i * 34));
      y += r.lines.length * 34 + 12;
    }

    y += 28;
    ctx.font = "20px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#6b7280";
    disclaimer.forEach((line, i) => ctx.fillText(line, PAD, y + i * 28));

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    return blob ? new File([blob], SUMMARY_IMAGE_NAME, { type: "image/jpeg", lastModified: Date.now() }) : null;
  } catch (err) {
    console.error("Could not make the configuration picture:", err);
    return null;
  }
}
