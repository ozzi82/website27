# Sign Configurator — Design

Status: approved
Date: 2026-10-01

## Purpose

A self-serve, public-facing tool where a prospect uploads their logo (SVG or PDF) and sees it
rendered as a photoreal 3D channel-letter sign, with a handful of real configuration options
(illumination style, depth, face/return color, day/night toggle). It's a lead-qualification and
engagement tool for the marketing site — not a quoting engine and not a CAD tool. The goal is to
let a prospect visualize "what would my logo look like as a Sunlite sign" before they ever talk to
sales, then hand them off to the existing `/contact` quote flow.

## Scope (v1)

**In scope:**
- Product lines: channel letters only — Trimless Letters and Cast Block Acrylic Letters (not
  Cabinet Signs; different 3D shape, deferred).
- Upload formats: SVG and PDF only. AI/EPS are out of scope for v1 — they require server-side
  conversion (Ghostscript/Inkscape or a paid API), which this project currently has no
  infrastructure for (fully static hosting, no backend).
- Config variables: illumination style (face-lit / halo-lit / dual-lit), letter depth (3 discrete
  presets, not a continuous slider — see Architecture), face color and return color (chosen from a
  curated swatch list, not a free color picker — see "Face/return materials"), day/night toggle.
  Finish/texture (matte/brushed/gloss) is a future enhancement, not built in v1. **This full set
  applies to Trimless Letters only** — Cast Block Acrylic Letters gets a smaller, product-accurate
  set (acrylic color + day/night only); see "Face/return materials" and "Product selection" below.
- Rendering fidelity: photoreal product render (PBR materials, environment reflections) — the
  highest-fidelity option considered, selected deliberately over cheaper "schematic" or "neon
  glow" stylizations.
- Viewer: opens on a pre-tuned 3/4 front view (matching the angle used in the site's existing
  product photography) with a day/night toggle. *Superseded by Revision 3: the camera is now a
  limited orbit/zoom camera that starts on that view.* Originally a single fixed angle, chosen because
  it is far easier to guarantee looks good than a model that has to look good from every angle.
- Placement: a new dedicated page (`/configurator`), with a nav entry and a "See it on your sign"
  link from the two eligible product pages.
- File handling: 100% client-side. The uploaded file is parsed and rendered in the browser and
  never transmitted anywhere. When the user clicks "Get a Quote," they land on the existing
  `/contact` page and re-upload the file there (HubSpot's form already accepts file uploads) —
  deliberately chosen over wiring the file through to the CRM automatically, to avoid adding any
  backend/storage infrastructure to an otherwise fully static site.
- Multi-shape/multi-color artwork: rendered as one extruded group sharing the same face/return
  materials ("flattened"), matching how channel letters are actually fabricated — not a true
  geometric boolean union of the paths (see Architecture).

**Out of scope for v1 (explicitly deferred):**
- AI/EPS upload support (needs server-side conversion infra).
- Cabinet signs / other product lines.
- Free orbit/zoom 3D viewer. *(Superseded by Revision 3: a limited orbit/zoom camera was added.)*
- Carrying the uploaded file through to the quote request automatically.
- True geometric union of overlapping vector shapes.
- Letting the user pick a page from a multi-page PDF (only page 1 is used).
- Saving/sharing a configuration via a link (no backend to persist it).

## Approaches considered

1. **(Recommended) Shared SVG pipeline for both formats.** SVG files are parsed directly with
   three.js's `SVGLoader`. PDF files are converted to SVG client-side via `pdf.js` (page 1 only),
   then fed through the exact same `SVGLoader` path. One geometry pipeline to build and test,
   regardless of upload format.
2. **Rasterize PDFs instead of parsing vectors.** Render the PDF's first page to a flat image and
   drape it over a generic sign silhouette instead of true 3D extrusion. Rejected outright, not just
   as the default: it produces a visibly worse result than true extrusion (a flat decal, not real
   sign geometry), and v1 does **not** build this as a fallback either — a file with no usable
   vector paths (e.g. a scanned logo) is simply a terminal error asking for a vector file instead
   (see `NoVectorPathsFoundError` in Error handling). Building a second, lower-fidelity rendering
   path for that case would be its own meaningful chunk of work for a case the tool's error message
   already handles honestly; it's listed as a possible future enhancement, not v1 scope.
3. **SVG-only for v1, defer PDF entirely.** Lower engineering risk, but PDF is likely the most
   common format a prospect will actually have on hand, so cutting it undercuts the tool's purpose.
   Rejected.

## Architecture

```
/configurator route (code-split / lazy-loaded — see Performance)
└─ src/components/configurator/
   ├─ UploadDropzone.tsx   — drag-and-drop + file picker; does a fast pre-check on extension and
   │                          size for immediate UX feedback before ever reading the file, but
   │                          `parseArtwork.ts` independently validates both again (defense in
   │                          depth, and so those checks are unit-testable against the parser
   │                          directly rather than only through the UI)
   ├─ parseArtwork.ts      — File -> { shapes: THREE.Shape[] } or throws a typed error:
   │                          UnsupportedFormatError | FileTooLargeError | ParseError |
   │                          TextNotOutlinedError | NoVectorPathsFoundError
   │                          (see "Parse error taxonomy" below for which case throws what)
   │                            • .svg -> three.js SVGLoader on the file text
   │                            • .pdf -> pdf.js loads page 1 -> renders to an SVG string
   │                              -> same SVGLoader path (see "PDF-to-SVG feasibility risk")
   ├─ SignPreview.tsx      — react-three-fiber <Canvas>: ExtrudeGeometry from the parsed shapes,
   │                          a camera that starts on one tuned angle (orbit/zoom since Revision 3), an environment map for reflections, a bloom
   │                          post-processing pass for the lit/glow look. Geometry/material setup
   │                          branches per product — see "Face/return materials" and "Illumination
   │                          model" below for exactly what each product renders, including the
   │                          Trimless-only depth presets (see "Trimless depth presets" below —
   │                          their exact values need confirming against real fabrication limits,
   │                          not just the preview) and
   │                          why Cast Block Acrylic has no depth control
   ├─ ConfigControls.tsx   — a product selector (Trimless Letters / Cast Block Acrylic — see
   │                          "Product selection" below for how it's set), then whichever control
   │                          set matches that product: Trimless gets illumination style, depth,
   │                          face color, return color, day/night; Cast Block Acrylic gets just an
   │                          acrylic color choice and day/night (see "Face/return materials")
   └─ types.ts             — shared parse-result types, plus a discriminated union for the two
                              products' config shapes (keyed on product id) so each product's
                              control set and renderer only has to handle its own fields

src/pages/ConfiguratorPage.tsx — page shell, Seo tags, intro copy, renders the tree above
```

**Data flow:** file in -> `parseArtwork` -> shapes held in page-level React state ->
`SignPreview` re-renders whenever shapes or config state change. No network calls, no
persistence. This is a self-contained subtree; the rest of the site only needs a nav entry and two
product-page links into it. (The two eligible pages are the Trimless Letters and Cast Block
Acrylic entries in `src/data/services.ts`, rendered by `src/pages/ServicePage.tsx` — confirm these
are still the correct ids before wiring the "See it on your sign" links, in case product data has
changed by implementation time.)

**On "flattening":** true geometric boolean-merging of arbitrary, possibly self-intersecting
vector paths is a hard problem in its own right (would need something like
`martinez-polygon-clipping` or `three-bvh-csg`). What's actually being built instead: every shape
extracted from the artwork is extruded and rendered as one group sharing the same face/return
materials described below. This is visually indistinguishable for typical logos and avoids taking
on a much harder, higher-risk problem for marginal benefit.

### Face/return materials — and why the two in-scope products need different config models

The illumination-style and face/return model described below is physically accurate for **Trimless
Letters** (a hollow fabricated can: separate face and return surfaces, independently paintable,
genuinely supports face-lit/halo-lit/dual-lit — this matches `src/data/services.ts`'s own spec data
for that product: `Lighting: "Face lit / halo / dual lit"`, `Finishes: "Custom paint / vinyl"`). It
is **not** accurate for **Cast Block Acrylic Letters** — a solid cast acrylic block with no
face/return split and no halo-lit technique, which `services.ts` itself describes as `Material:
"Cast acrylic (PMMA)"`, `Lighting: "LED translucent"`, glowing "evenly throughout," with
`Colors: "Clear / Opal / Custom"`. Applying the Trimless config model to Cast Block Acrylic would
visualize a product Sunlite doesn't actually make.

So `ConfigControls` and `SignPreview` branch on which product the user is configuring:

- **Trimless Letters:** the full model — illumination style (face-lit/halo-lit/dual-lit), two
  material slots (face color, return color) from a curated paint/vinyl swatch list, letter depth
  presets (see "Trimless depth presets" below), day/night toggle. This is the model described in
  "Illumination model" below.
- **Cast Block Acrylic Letters:** a reduced model matching how the product actually works — one
  material (the acrylic itself, no face/return split), a translucency/color choice from `Clear /
  Opal / Custom` (not the paint/vinyl swatch list), no illumination-style selector (it only glows
  one way: evenly, from within), and the same day/night toggle (off = daylight, on = glowing). No
  backdrop plane applies, since there's no halo-lit option for this product. **No depth control
  either**: `services.ts` doesn't publish a real depth/thickness spec for this product at all (its
  "Letter Height" field is a placeholder), and an acrylic block's thickness is a far less visually
  dramatic preview variable than a hollow channel letter's depth — so v1 renders it at a single
  fixed thickness (placeholder: ~3/4", also needing confirmation against real fabrication limits,
  same caveat as the Trimless depth presets below) rather than inventing a configurable range with
  no real spec behind it.

Both pickers (whichever set is shown) are curated swatch/option lists matching what Sunlite can
actually fabricate or the material's real color options — never a free RGB picker — so no one can
visualize and request a sign that can't actually be produced.

### Trimless depth presets

`services.ts`'s own catalog data defines this product by its depth: "Under 1 1/4"... trimless,
seamless face." A preset range that goes meaningfully deeper (the design spike that led to this
spec, before being caught in review, proposed presets up to 8") would let a prospect configure and
request a sign outside what Sunlite's real Trimless line actually is — the same mistake already
caught and fixed for Cast Block Acrylic's depth question above. Since trimless letters are
specifically a thin profile, a defensible v1 preset range stays inside that definition rather than
reaching into standard (non-trimless) channel-letter depths — for example three sub-1.5" presets
spanning roughly 3/4" to 1 1/4". **The exact values are a placeholder here and need confirming with
Sunlite's own fabrication limits before implementation** — unlike the rest of this spec's numbers
(which were checked against `services.ts`), real depth tolerances aren't published there and
shouldn't be guessed further in a design document.

### Product selection

`ConfiguratorPage` needs a selected product (`"trimless-letters" | "cast-block-acrylic"`) before
`ConfigControls` knows which control set to render:

- Arriving from the plain `/configurator` nav entry: no product is pre-selected, so the page shows
  a simple two-option chooser (Trimless Letters / Cast Block Acrylic) before or alongside the
  upload step, defaulting to nothing selected.
- Arriving from a product page's "See it on your sign" link: the link passes which product it came
  from (route state or a query param), so that product is pre-selected and the chooser is skipped.
- Switching products after a file is already uploaded: the parsed shapes from `parseArtwork` are
  product-agnostic (parsing only cares about file format, not which sign product is being
  previewed), so the same shapes are reused — only the config state resets to the newly-selected
  product's defaults. No re-upload is required to switch products mid-session.

### Illumination model (Trimless Letters)

This section describes the Trimless Letters config model only — see above for how Cast Block
Acrylic differs. Day/night and the three illumination styles are two different, orthogonal axes:

- **Day/night** controls whether anything is lit at all — day means the LEDs are conceptually off,
  so nothing is emissive and there is no bloom, regardless of illumination style; night means the
  LEDs are on and the style below determines what glows.
- **Illumination style** controls *which geometry exists and would glow once night lighting is
  active*:
  - **Face-lit:** the face material's emissive channel lights up at night; the returns stay
    non-emissive (ordinary painted-metal material) in both day and night.
  - **Halo-lit (reverse channel):** the face is never emissive. A thin backdrop plane is added to
    the scene — representing the wall the sign mounts to — positioned a short distance behind the
    extrusion. This plane is present in **both** day and night views whenever halo-lit or dual-lit
    is selected (it's part of the sign's mounting context, not a lighting effect), but a soft
    point/area light behind the shape that makes it glow is only switched on at night.
  - **Dual-lit:** both of the above together — face emissive at night, plus the backdrop plane
    (present day and night) with its light switched on at night.

So "day" always renders the same geometry as "night" for a given illumination style, just with all
emissive channels and the bloom pass off — the backdrop plane's presence is purely a function of
illumination style, never of day/night.

A bloom post-processing pass (via `@react-three/postprocessing`, added to Dependencies below) is
applied whenever any emissive surface is active at night — the Trimless face glow, the halo rim
light, or Cast Block Acrylic's even internal glow — and is skipped entirely in the daytime view and
on the low-end-GPU degradation path described in Error handling.

### Parse error taxonomy

To keep "a file that fails to parse" and "a file that parses but has nothing usable in it" from
being conflated (both in code and in the testing fixtures):

- `UnsupportedFormatError` — wrong file extension/MIME type; rejected before parsing is attempted.
- `FileTooLargeError` — over the ~10MB cap; rejected before parsing is attempted.
- `ParseError` — the file claims to be an SVG or PDF but is malformed/corrupt and the underlying
  parser (SVGLoader or pdf.js) throws while reading it.
- `TextNotOutlinedError` — the SVG contains one or more live `<text>` elements. Three.js's
  `SVGLoader` only reads path-like shape elements (path/circle/rect/polygon/etc.) and silently
  ignores `<text>` nodes — and many real-world logo exports, especially from prospects who haven't
  pre-converted their type to outlines, will hit exactly this case. This check fires whenever
  `<text>` is present **regardless of whether other usable shapes also exist** in the same file —
  a logo with some outlined shapes and some live text still throws this error rather than silently
  rendering only the outlined part and dropping the text, since a sign missing letters it doesn't
  know it's missing is worse than an upfront error. It gets its own error (rather than falling
  through to the generic "no shapes" case) so the message can say the specific, actionable thing:
  *"Your file has text that hasn't been converted to outlines. In most design tools this is called
  'Create Outlines' or 'Convert to Path' — re-export and try again."*
- `NoVectorPathsFoundError` — parsing succeeded, no `<text>` elements were involved, but zero usable
  shapes resulted anyway (e.g. a scanned/rasterized PDF, or an SVG that's just a wrapped `<image>`).
  This is the generic "please send us a vector file instead" fallback.

### PDF-to-SVG feasibility risk

The recommended approach depends on `pdf.js` rendering a PDF page to an SVG string via its
`SVGGraphics` backend. That backend has been deprecated/removed in some `pdf.js` releases in favor
of canvas-only rendering, and since this is the *only* PDF path for v1 (rasterizing is a fallback
for content, not a substitute pipeline), this needs to be confirmed before the rest of the pipeline
is built on top of it. The implementation plan's first task must be a short feasibility spike:
confirm a specific `pdfjs-dist` version that still exposes SVG export, or — if none does — fall
back to extracting vector paths from `pdf.js`'s lower-level `getOperatorList()` API (more work, but
always available) instead of changing the PDF scope commitment made in this spec.

## Error handling

Each case below maps to one of the typed errors in "Parse error taxonomy" above, so the UI always
knows exactly which message to show rather than falling back to a generic failure:

- **Unsupported file type** (AI, EPS, PNG, JPG, etc.) -> `UnsupportedFormatError`: rejected at the
  dropzone before any parsing is attempted. Message: "We support SVG and PDF right now. Export your
  logo as SVG, or send it to us directly and we'll quote it by hand," linking to `/contact`.
- **File too large** (>10MB) -> `FileTooLargeError`: rejected before parsing, same style of message.
- **Malformed/corrupt file** (claims to be SVG/PDF but the parser throws) -> `ParseError`: "That
  file couldn't be read — it may be corrupted. Try re-exporting it," linking to `/contact`.
- **Live `<text>` elements, not outlined** -> `TextNotOutlinedError`: the specific "convert text to
  outlines" guidance described above.
- **No usable vector paths found** (scanned/rasterized PDF, a photo embedded in a PDF, an SVG that
  is itself just an embedded raster image) -> `NoVectorPathsFoundError`: "we couldn't find a clean
  outline in this file," linking to `/contact`.
- **Multi-page PDF**: only page 1 is used; a small inline note says so (not an error case).
- **WebGL unavailable** (old browser, disabled GPU): feature-detected on page load; shows a static
  "3D preview isn't supported in this browser" message with a plain link to `/contact` — never a
  blank canvas or a crash.
- **WebGL available but underpowered** (low-end mobile GPU): not reliably feature-detectable in
  advance, so this isn't a hard gate — but the renderer caps device-pixel-ratio and disables the
  bloom pass above a conservative draw-call/complexity threshold as a basic degradation path, rather
  than assuming every WebGL-capable device can run full bloom + PBR + reflections smoothly.

## Testing

- **Unit tests for `parseArtwork.ts`** (this is where the real logic/risk lives), one fixture per
  typed error plus the happy path:
  - clean single-path SVG -> shapes returned
  - multi-shape/multi-color SVG -> shapes returned (all flattened to shared materials downstream)
  - SVG containing only live `<text>` (not outlined) -> `TextNotOutlinedError`
  - SVG containing a mix of outlined shapes and live `<text>` -> `TextNotOutlinedError` (confirms
    the "fires even when other usable shapes exist" rule from the Parse error taxonomy)
  - vector-based PDF -> shapes returned via the PDF-to-SVG path
  - rasterized/scanned PDF (no real vector content) -> `NoVectorPathsFoundError`
  - truncated/corrupt SVG and PDF files -> `ParseError`
  - oversized file -> `FileTooLargeError` (checked before parsing)
  - wrong file extension -> `UnsupportedFormatError` (checked before parsing)
  - a letter with counters/holes (e.g. O, A, B, R) with correct hole winding -> renders with the
    hole intact. A file with malformed/inconsistent path winding (a plausible real-world export
    issue, since SVGLoader derives holes from path winding and fill-rule) is an accepted v1
    limitation, not a detected error: reliably distinguishing "malformed winding" from "intentional
    solid shape" isn't practical without deep geometry analysis, so it renders whatever SVGLoader
    produces (possibly a solid letter missing its hole) rather than being caught and reported. This
    fixture exists to confirm that failure mode is a wrong-looking render, not a crash.
- **Manual/visual QA for `SignPreview`**: not practical to unit test meaningful 3D rendering output;
  verified by eye across Chrome, Firefox, Safari, mobile Safari, and Android Chrome with a handful
  of real sample logos, covering both products' full option spaces separately since they render
  differently:
  - **Trimless Letters:** illumination style x day/night x face color x return color
  - **Cast Block Acrylic:** acrylic color x day/night
  - **Product switching:** confirm `ConfigControls` actually shows/hides the right controls when
    switching products (no leftover Trimless-only controls visible while Cast Block Acrylic is
    selected, and vice versa), and that an already-uploaded file's shapes carry over correctly.
- **Two end-to-end smoke tests**, one per product (they exercise different control sets):
  - Trimless: upload a known-good SVG -> preview renders -> toggle day/night -> change illumination
    style -> "Get a Quote" link lands on `/contact`.
  - Cast Block Acrylic: upload a known-good SVG -> preview renders -> change acrylic color -> toggle
    day/night -> "Get a Quote" link lands on `/contact`.

## Dependencies & performance

New JS dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
(+ its `postprocessing` peer dependency, for the bloom pass described in "Illumination model"),
`pdfjs-dist` (plus three's bundled `SVGLoader` addon). This is a non-trivial bundle size addition
(three.js alone is several hundred KB gzipped), so the `/configurator` route must be lazy-loaded
(`React.lazy` + dynamic `import()`) so visitors to the homepage or product pages never pay for this
weight.

New binary asset: one small CC0-licensed HDRI environment map (e.g. from Poly Haven) for the PBR
reflections — since it's only used for lighting/reflections rather than shown as a visible
background, a low resolution (around 512px–1k equirectangular, compressed to roughly 100–300KB) is
enough. It ships alongside the `/configurator` route's lazy-loaded chunk, not in the main bundle.

## Accessibility

`UploadDropzone` must be operable without a mouse (a real `<input type="file">` under the hood,
keyboard-focusable, properly labeled) and not rely on drag-and-drop as the only way to select a
file. `ConfigControls`'s product selector, illumination-style choice, the swatch pickers, and the
day/night toggle are standard form controls and must be similarly keyboard-operable and labeled.
Both are called out explicitly here since it's easy to lose standard accessible-input behavior when
styling custom dropzones and swatch pickers. The 3D canvas itself can remain decorative/unlabeled,
since the WebGL-unavailable fallback already provides a non-visual path for that case.

## Open questions / explicit non-goals for this spec

- Whether to eventually support Cabinet Signs (different geometry: a backing panel behind routed
  letters) is a separate future scope, not this spec.
- Whether to eventually add a backend to carry the uploaded file through to the CRM automatically
  is a separate future decision (would also unlock "share a configuration via link").
- AI/EPS support is blocked on adding any server-side conversion capability, which this project
  does not currently have (confirmed: fully static hosting, no backend, per the existing
  `DEPLOY.md`).

## Implementation notes (post-build deviations)

Recorded after implementation so the spec matches what shipped:

- **Cast Block Acrylic backdrop.** The spec says no backdrop plane for this product. Visual tuning found
  clear acrylic reads as a flat dark card with nothing behind it to show through, so the shipped
  `AcrylicScene` renders a plain backdrop wall (and a subtle colored glow spill at night). This is a
  rendering aid for translucency, not a halo-lit option; it can be removed if undesired.
- **Artwork normalization.** Uploaded artwork is centered, uniformly scaled so its larger dimension is
  2.4 world units, and Y-flipped (SVG/PDF are Y-down) before rendering (`normalizeShapes.ts`).
- **PDF live text** now throws `TextNotOutlinedError`, matching the SVG rule.
- **SVG hostile-file caps:** max 20,000 elements, 50 `<use>` elements, 500 shapes (all `ParseError`).
- **HDRI asset** is ~1.6MB (Poly Haven studio_small_03, 1k), above the 100-300KB budget; it only loads on
  the lazy `/configurator` route. A smaller HDRI could be swapped in later.
- **PDF limitations (v1, accepted):** counters (O, A, B, R) render filled; nested content-stream
  transforms are ignored; clip rectangles / stroke-only paths become shapes. SVG is the recommended
  format and has none of these limits.
- **Not built:** multi-page-PDF note, underpowered-GPU degradation beyond a capped device pixel ratio.
- Trimless depth presets and swatch hex values remain placeholders pending real fabrication limits.

## Revision 2 (supersedes the two-product model above)

The company's "European Wholesale Signage Spec Guide" (2026-27 brochure) defines the real product
range: 12 EdgeLuxe letter configurations. The original Trimless / Cast Block Acrylic split, the
Face/Return/illumination-style model and the placeholder depth presets were assumptions made without
that guide and are replaced by the following. Everything else (client-side only, SVG/PDF parsing and
its error taxonomy, normalization, the 3/4 starting camera view, day/night toggle, error handling, a11y, no backend)
is unchanged.

**Single source of truth:** `src/data/configurations.ts` (12 `LightConfig` entries). The configurator, the
`/light-effects/:id` product pages, the home grid and the nav all read it. Each entry carries
`light: {face, halo, side}`, `profile` (flat | standard | tube | conical), `mount`
(flat | standoff | flush), allowed `depthOptionsMm`, `minHeightMm`, `minStrokeMm`.

**Flow:** choose a configuration (all 12, with the brochure photo and one-line summary) → upload SVG/PDF →
preview. `?config=<id>` preselects one (product pages link here via "See it with your logo").
Switching configuration keeps the uploaded artwork.

**Controls (all configurations):**
- Depth — only that configuration's allowed depths, shown as inches with mm in parentheses (US-first).
  Configurations with `customDepth` show a note "custom depths available — ask us".
- Color — the brochure says "painted in any PMS color", so a swatch list plus a free color input is
  correct here (the earlier "curated swatches only" rule is dropped). Applies to the opaque painted
  parts (face for non-glowing faces, side walls, returns).
- Glow color — for configurations whose face/halo/sides emit light: white by default plus the brochure's
  "pigmented translucent acrylic" colored options (free color input).
- Day / Night toggle.
- ~~Letter height (inches)~~ — **dropped** (see Revision 3 below). The configuration's minimum letter height
  (`minHeightMm`, inches first) and minimum stroke width are shown as plain guidance text instead.

**Rendering model (one data-driven scene replaces TrimlessScene/AcrylicScene):**
- `light.face === "glow"` → face emissive at night (colored by glow color).
- `light.halo === "standoff"` → letter stands off the wall on spacers; wall halo glow behind at night.
- `light.side` → a glowing band on the side wall: `full` = whole side wall; `partial-back` = thin band at
  the back edge (flush-mounted: letter sits flush to the wall so the band lights the wall edge);
  `partial-front` = thin band at the front edge.
- `mount`: `flat` = on the wall; `standoff` = gap behind; `flush` = flush to wall.
- `profile`: `flat` = thin sheet, no light; `standard` = straight extrusion; `conical` and `tube` are
  approximations (tapered/bevelled face; heavily rounded bevel to suggest a neon tube) — true conical and
  routed-tube geometry need centerline/offset operations not available from arbitrary outlines. These two
  are visually approximate and should be labelled "illustrative" in the UI.
- Depth maps to real millimetres relative to the entered letter height (depth/height ratio), so 1.2" depth
  on a 2" letter looks very different from 1.2" on a 24" letter.
- LP 1 (flat cutout) has no illumination: day/night shows the unlit letter only.

### Revision 2 implementation notes

- `ConfiguratorState` (`configId, depthMm, color, glowColor, dayNight`; `background` is added in Revision 3) replaces the Product/ProductConfig
  union. Depth renders as `depthMm / NOMINAL_LETTER_HEIGHT_MM` (300) of the artwork height, clamped to 0.01-0.6.
- `ConfigScene` builds one `ExtrudeGeometry` per profile (conical = single-segment bevel with the widest layer at the wall
  plane so the mirrored taper hides behind the wall; tube = 8-segment bevel). Bevel/taper sizes are limited by an
  area/perimeter half-stroke estimate so thin strokes don't fold over. Both remain approximations.
- Side bands (`partial-back`, `partial-front`, `full`) are an `onBeforeCompile` mask on the side material keyed to
  object-space z; band thickness is the brochure's 10 mm scaled to the letter, clamped to 15-40% of the depth.
- Night uses bloom plus Khronos "neutral" tone mapping (ACES pulled cyan/red toward white).
- The paint colour control is hidden for LP 11-N (the whole tube glows, nothing is painted).
- Unlit LP 1 keeps a dim key light at night so the letter stays readable.

## Revision 3 (height removed, orbit camera, backgrounds, day/night fade)

Feedback on Revision 2: changing the entered letter height changed the apparent thickness (the higher
the height, the thinner the letter), so the input is dropped; zoom and rotate were wanted; a choice of
backgrounds; and a fade instead of a snap when toggling day/night. This revision supersedes the parts of
the spec above that say "single fixed camera / no orbit controls", and the Revision 2 letter-height input.

**1. No letter height.** `letterHeightIn`, `isBelowMinHeight` and the below-minimum warning are gone.
Depth is drawn against one fixed nominal letter height, `NOMINAL_LETTER_HEIGHT_MM = 300` (about 12"):
`depthRatioFor(depthMm) = clamp(depthMm / 300, 0.01, 0.6)`. A deeper depth always looks thicker and nothing
else changes it, so the preview is illustrative and the controls say so ("Depth is drawn against a nominal
12" letter"). The configuration's `minHeightMm` (inches first) and `minStrokeMm` are plain guidance text.
The glowing side-band thickness (10 mm) is scaled against the same nominal height.

**2. Orbit / zoom camera.** drei `OrbitControls` (in `CameraRig`) replaces the fixed camera and opens on the
same 3/4 view (`HOME_POSITION`). Drag rotates; wheel or pinch zooms; panning is off; damping is on.
Limits (`VIEW_LIMITS` in `cameraMath.ts`): distance 2.4-9.5 (the artwork is normalised to 2.4 units, so the
camera cannot enter the sign or lose it), azimuth +-60 degrees (stay in front of the wall), polar 40-98
degrees (no looking from under the sign). One-finger drag rotates and two-finger pinch zooms on touch.
`PreviewFrame` adds overlay buttons (Zoom in, Zoom out, Reset view, all labelled) and keyboard control while
the preview has focus (arrows rotate, +/- zoom, 0 resets). Button and key commands ease toward a goal view
(`dampView`) rather than jumping; grabbing the scene cancels them. **Scroll tradeoff:** the wheel zooms while
the pointer is over the canvas, which can intercept page scrolling there; to limit that, once the camera is at
the zoom limit in the direction of the wheel the event is handed back to the page
(`shouldPassWheelToPage`), and the rest of the layout is unaffected. On touch, one-finger drags on the canvas
rotate rather than scroll, so the page is scrolled from outside the preview.
The wall is 120 x 60 units so its edges never show at the widest angles.

**3. Backgrounds.** `ConfiguratorState.background` (default `concrete`) selects one of four procedurally
generated walls (`backgrounds.ts`): Concrete (brochure look, with panel joints and form-tie holes), Brick
(red clay, running bond), Wood slats (vertical, warm) and White plaster. Textures are 512 px seamless canvas
textures built from seeded tileable noise (`wallNoise.ts`, `wallTextures.ts`), cost roughly 50-90 ms to
generate, tile across the wall in world units (a tile is centred on the artwork so seams never cross it) and
double as bump and faint emissive maps, so each wall keeps its texture at night. Each background defines its
own day and night wall, backdrop colour and how strongly the halo spill is modulated by the wall's luminance
(light visibly catches mortar lines and wood grain). No external images; textures, geometry and halo textures
are disposed with the scene. The picker is a radio group and the choice survives switching configuration.

**4. Day/night fade.** A damped `nightAmount` (0 day, 1 night) owned by `NightProvider` (a ref, not React
state, advanced once per frame by `stepProgress` at constant rate over `FADE_SECONDS = 0.9` then eased with
`easeInOut`) drives, via `useNightEffect`: ambient / directional / key point light and environment intensity
(`atmosphereFor`), the scene and wall colours, face / side / tube emissives and diffuse tint, the side-band
shader's night uniform, halo opacity, bloom intensity (`bloomIntensityFor`) and a crossfade from ACES (day) to
Khronos neutral (night) tone mapping (`DayNightToneMapping`). The EffectComposer and the key point light stay
mounted for both states so toggling never pops a pass in or out or recompiles materials. Reversing mid-fade
continues from the current value.

## Revision 4 (typed text as artwork)

Visitors can type text instead of uploading a logo. An "Artwork source" radio group ("Upload logo" | "Type text",
default upload) sits above the preview and stays available after artwork exists.

- **Text -> shapes.** `textToShapes.ts` lays the text out with opentype.js (centre-aligned lines, 1.2em line height,
  per-glyph advance and pair kerning; GSUB features are deliberately skipped because opentype.js 2.0 throws on some
  lookup types, e.g. Oswald's), writes one SVG path and feeds `<svg><path/></svg>` through the existing `parseSvg` +
  `normalizeShapes`, so holes, centring and size behave exactly like an upload. Limits: 3 lines, 40 characters per line,
  100 in all. Emoji and control characters are dropped silently; characters the font lacks are skipped and listed to the
  visitor; text with nothing drawable raises `TextRenderError`, shown as "Couldn't render that text with this font. Try
  different characters or another font." opentype.js 2.0.0's own `Path.toPathData` can emit `NaN`, so path data is
  written by hand.
- **Fonts** (Latin subset WOFF from `@fontsource/*`, all SIL OFL 1.1, bundled and hashed by Vite, never fetched from
  Google): Montserrat 700, Poppins 700, Bebas Neue 400, Oswald 600, Playfair Display 700, Arvo 700 (the slab; Roboto
  Slab is Apache-2.0 rather than OFL), Pacifico 400, Lobster 400. Font files, the picker's `@font-face` rules and
  opentype.js are all behind dynamic imports and load only when text mode is used.
- **UI.** In text mode the page always shows the preview slot (a prompt while the text is empty) with a text panel
  (textarea, font radio group with each name set in its own font, aria-live "Preview updated") above the configuration
  controls in the right column, so editing never remounts the input and depth/colour/background persist. Typing is
  debounced (250 ms); stale results are discarded. The typed text, font and the last uploaded artwork are kept
  separately, so the sign shown always belongs to the selected source.
- **Known limitation.** Script fonts draw some letters as one self-looping stroke, so their counters are narrow slits
  rather than separate holes (Lobster's O); the extrusion matches what the font fills (verified per glyph against the
  font's non-zero fill in `textToShapes.test.ts`) but thin script strokes are fragile at the minimum stroke width.

## Revision 5 (compact layout, quote carry-over, backgrounds, dimmer, day/night button, thin strokes)

**1. Compact layout.** Once there is artwork (or the text source is chosen) the page is a two-column workspace: the 3D
preview on the left fills the viewport (`100svh` minus the site header, at least 500 px), a 440 px options column on
the right holds every control, one row each: artwork source toggle, depth chips, paint and glow swatches (24 px rounds plus
a custom picker), a Brightness slider, four background thumbnails, a Day | Night toggle, the thin-stroke note when due, a one-line size
guidance, a collapsed "About this preview" `<details>` (depth note, custom depths, illustrative note, colour hints) and Get a Quote.
Measured with headless Chrome: 1366x768, 1440x900 and 1366x657 need no internal scroll in upload mode (text mode needs
none at 1366x657 either unless a thin-stroke note is also showing); the document only scrolls to reach the footer. The column
scrolls internally only below that. On phones the preview is sticky under the header (36svh) and the options scroll beneath it, with
Get a Quote pinned to the bottom of the viewport. Built on a shared `SegmentedControl` (real radio inputs, arrow keys work).

**2. Get a Quote carries the configuration.** Clicking it captures a snapshot of the canvas, saves a `QuoteSnapshot`
(plain-text summary, label/value rows, JPEG data URL) to `sessionStorage` (`sls.quote.v1`) and navigates to `/contact` with
the same object in router state (state wins on arrival, storage covers a refresh). Modified clicks (new tab) skip the snapshot
but still store the summary. The snapshot is reliable because it is read inside a `useFrame` callback at priority 2, after the
EffectComposer's priority-1 render and in the same task, so the drawing buffer is still valid without `preserveDrawingBuffer`;
it is downscaled to 720 px wide JPEG (about 25 KB), falls back to no image after 2.5 s, and a failed capture never blocks the quote.
`/contact` shows a "Your configuration" card (rows with colour chips, snapshot, Copy summary, Clear). The HubSpot form renders in a
same-origin iframe, so `ContactForm` finds its `message` textarea inside that iframe's document, fills it from `onFormReady`
(native value setter plus `input`/`change` events) and empties it again on Clear, never replacing text the visitor typed. The summary
is `formatConfigSummary(state, config, artwork)`: configuration, depth (US first), paint (omitted on the neon tube), glow colour and
LED brightness (omitted on unlit LP 1), artwork (file name, or typed text and font), optional note. Background and day/night are left out.
The nav bar's own Get a Quote button does not carry a configuration (only the configurator's button does).

**3. Backgrounds.** Concrete (unchanged, default), Light concrete (lighter cool grey) and Warm concrete (beige grey) share one painter
(different seeds and contrast), and Brick is a small format, 8 bricks by 16 courses per tile (half the former size). Wood slats and White
plaster are removed (`getBackground` falls back to Concrete for an unknown id).

**4. LED dimmer.** `ConfiguratorState.brightness` (0-100, default 100). `brightnessFactor(p) = (p/100)^2` scales the face and tube
emissive, the side-band glow, the halo spill opacity and the bloom intensity, all multiplied by the night amount, so it has no visible
effect in day mode. At 0% the side band's milky base also darkens at night so nothing looks lit. Hidden for LP 1; listed in the quote summary.

**5. Day | Night** is a segmented radio group (sun / moon icons) over the unchanged 0.9 s fade.

**6. Thin strokes.** `strokeHeightRatio(shapes)` = average stroke (2 x area/perimeter, `estimateHalfStroke`) over artwork height; typed text is
multiplied by `lineStackFactor(lines)` so the ratio refers to one line's letters. `neededLetterHeightMm = minStrokeMm / ratio`
(a 12 mm minimum needs a 12 in letter at 4% and a 6 in letter at 8%). LP 11-N and 11-C (tube / conical) get a prominent amber note below 6%
("... would need to be at least about X tall"); every other configuration gets a quiet note only when X exceeds 24 in. The 3D approximation
degrades with `bevelStrength(ratio)` (0 below 2%, 1 above 8%, smoothstep between): tube radius and cone inset are scaled by it and hairline art
becomes a plain straight extrusion. Known limit: the estimate is the mean stroke, so a mixed-weight typeface (thin hairlines on thick stems)
can still carry a thinner stroke than reported.
