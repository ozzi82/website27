# Price estimator: working notes (PRIVATE, do not publish)

Contains the owner's supplier prices. The repo is private; `docs/` is not copied into the Docker image (only `dist/` is), so none of this is served by the site.
Never put these rates into the public website bundle. The internal estimator must be a separate, access-controlled app. The customer-facing estimate (with markup) comes later.

Owner rules: ask before uploading anything; blind test = owner sends the drawing (prices blanked) and the assistant guesses first.
Supplier: Enping Charming Sign Co. All figures are single-order, **DDP, DHL air freight**, US$, unit price and freight are separate columns on the invoice.

## Data (10 quotes, 9 jobs; `blind-log.csv` has the guesses and errors)

| Job | System | Size | Face area m² | Pieces | Edge m | Unit $ | Freight $ | Total $ |
|---|---|---|---|---|---|---|---|---|
| Auris | LP 11-B, 30 mm acrylic back-lit | 42x8 in | 0.089 | 10 | 5.9 | 183 | 152 | 335 |
| Ergodyne | LP 5, SS 50 mm | 60x14 in | 0.198 | 8 | 7.4 | 255 | 231 | 486 |
| Kidstruction | LP 5, SS 75 mm, vinyl face | 125x25 in | 0.914 | 12 | 27.7 | 714 | 730 | 1,444 |
| Mayo A | LP 5, SS 50 mm | 224x42 in | 1.29 | 23 | 57.7 | 1,245 | 956 | 2,201 |
| Mayo B | LP 5, SS 50 mm | 256x48 in | 1.715 | 23 | 67.8 | 1,798 | 1,247 | 3,045 |
| Dockzilla | LP 3.2, SS 65 mm returns + 10 mm acrylic back, copper front, RGBW | 360x42 in | 4.0 | 10 | 56.9 | 3,920 | 2,730 | 6,650 |
| Yakima opt 1 | 30 mm acrylic front lit | 62x36 in | 0.727 (plate only) | 2 | 21.5 | 1,078 | 568 | 1,646 |
| Yakima opt 2 | LP 5, SS 50 mm | 62x36 in | 0.727 (plate only) | 2 | 21.5 | 719 | 512 | 1,231 |
| Numbers 1-20 | 30 mm acrylic half-side lit (LP 11-S/FS), 12 in digits | 126x80 in layout | ~0.65 | ~31 | ~58 | 1,815 | 743 | 2,558 |

Owner facts: LP 5 = 10 mm acrylic face; LP 3.2 = 10 mm acrylic on the back; standard LP 5 return is 50 mm; 50 vs 75 mm depth changes shipping, not the unit price.

## Working rules (tentative; 9 jobs)

- **Stainless channel (LP 5, LP 3.2): unit price ≈ $970-990 per m² of face area**, no depth term, no per-piece term. Fits within 0-6% except Kidstruction (+26%, letters touch so the area was probably over-measured). Small signs cost more per m² (Ergodyne $1,290/m²).
- **30 mm cast acrylic: unit price ≈ $1,460 per m² + about $26 per piece** (fits Yakima and Numbers within 4%; Auris, 0.09 m², is about 2x off, so tiny signs need a minimum). Only three jobs behind this.
- **Count the plate only** when words are knocked out of a plate (Yakima): letters are openings, not extra area.
- **Freight ≈ estimated weight x $20-25 per kg** (multi-piece sets up to $29), floor of about $150-230 for a small single crate. Weight = side strip (edge m x depth x 1.0-1.2 mm SS x 8 g/cm³) + face acrylic (10 mm x 1.19) + 1 mm SS back plate; for 30 mm acrylic, area x 30 mm x 1.19. DHL charges the larger of actual and volumetric weight, so very long crates will cost more.
- Total landed price per inch of width was $8-12 for plain stainless jobs but $18.5 for Dockzilla (width alone is a poor predictor).
- Blind-guess errors so far: Auris 2.1x high, Mayo 1.4x/1.66x low, Dockzilla 13% low, Ergodyne 7% low, Yakima +3% / +42%, Numbers 30% low. Calibration is still moving.

## Measuring tool (`nest.py`)

Reads a drawing (rasterised at a known dpi), finds the outline pieces, and returns face area, edge length and a rough 4x8 ft (1219x2438 mm) shelf-nesting sheet count. It needs ImageMagick (`convert`) and Python.
Steps used per job: `pdftoppm -r <dpi> -x -y -W -H` crop of the artwork -> neutral dark-line mask (exclude coloured dimension text and phase lines; keep light cyan outlines if present) -> `python3 nest.py <name> <mask.png> <real width mm> <depth mm>`. Scale was calibrated from the stated overall width (Mayo drawings are 1:10, others 1:1). Perimeter = skeleton pixel count x mm/px (matches area/line-thickness within a few %).
Known limits: touching letters merge into one piece; very small pieces inside a notch are classed as holes; light outlines can break; shelf nesting uses bounding boxes only (real nesting is tighter).

## Next

1. More samples (blind): aluminium channel, flat cutouts (LP 1), LP 11-F, LP 11-B, quantity above 1, small signs under 0.3 m², sea freight, and more acrylic. Owner blanks the price columns; the assistant must only open the drawing (do not crop the invoice, the first Kidstruction crop leaked its prices).
2. Real-size input in the configurator: DONE 2026-10-07 (`sizeIn` in the configurator state, `realSize.ts`). The internal estimator can read the real width/height from the same state.
3. Internal configurator (private): upload SVG/PDF -> area, edge, pieces -> factory price + freight, with the rules above and the owner's own rates stored outside the public bundle. Ask the owner where it should be hosted/uploaded before building.
4. Customer-facing estimate with markup, only after the internal one has held up on blind tests.
