# Artwork files in the configurator: PDF, AI, EPS

## What works today (client side, no server)
- **SVG**: best. **PDF** with vector shapes (text converted to outlines). **AI** (Illustrator saved with PDF compatibility, the
  default) is read as a PDF.
- Not read: **EPS** (and DXF/CDR). The page now says so in plain words and tells the visitor to export SVG/PDF or send the file
  with the quote; the site's FAQ already states that Sunlite quotes from AI, EPS and vector PDF.
- Why a PDF can still fail: live text (fonts not outlined), stroke-only artwork (lines without fill), embedded images, or
  clipping masks. The messages say which one.

## Should we add a converter / checker?
Yes, as a **second phase on a small server**, because the browser cannot do EPS and cannot reliably outline text or expand strokes:
- A tiny service (Docker, about 100 lines) that takes an upload and runs **Inkscape** (CLI) or **Ghostscript + pdftocairo**
  to: convert EPS/AI/PDF to SVG, outline text (`--export-text-to-path`), expand strokes (`--actions=select-all;object-stroke-to-path`),
  union overlapping shapes, and return clean SVG.
- A **file checker** on the same service: reports open paths, tiny strokes below the system's minimum stroke width, hairlines,
  duplicate/overlapping shapes, raster images, missing outlines, and the artwork size, so sales gets a pass/fail with the quote.
- Cost: a 5 USD VPS or a serverless container; no licence fees (Inkscape and Ghostscript are open source; check Ghostscript's AGPL
  terms if the service is public).
- To decide the failing cases, please send two or three PDFs that did not work (put them in the repo under `docs/inbox/`).
