# Project status (2026-10-03)

Live repo: https://github.com/ozzi82/website27 (`master`). Target domain: sunlitesigns.com (not deployed yet; see DEPLOY.md).

## Done
- Softer design, SEO and AI-visibility pass (per-page meta, JSON-LD, sitemap, llms.txt, robots, prerendered pages).
- Product taxonomy (owner clarification, `docs/briefs/2026-10-03-product-taxonomy-clarification.md`): ultra-slim LP 11 (cast block
  acrylic) is the main focus, classic trimless = LP 5 / 3.1 / 3.2, LP 1 = non-illuminated, blade and push-through cabinet signs only on
  `/services/custom-sign-fabrication`. Trim caps appear only as a labelled "not offered" comparison.
- 12 real EdgeLuxe configurations from the brochure: `src/data/configurations.ts` is the single source of truth.
- 3D configurator "Build Your Sign" at `/configurator`: SVG/PDF upload or typed text, 12 configurations, depth, paint and glow colour,
  LED dimmer, Day|Night fade, backgrounds, orbit/zoom, thin-stroke warnings, quote hand-over into the HubSpot form.
  Part B (2026-10-03):
  - Real glow at night (strong emissive, bloom, soft light spill on the wall) for face-lit, side-lit and halo letters.
  - LP 11-N: only the front edge is rounded (at most 0.5", never more than half the thickness); the face and the front half of the side
    wall are lit, the back half is unlit (`sideBand` in the light model).
  - Steel letters (LP 3.1, 3.2, 5) default to 75 mm, clearly thicker than LP 11 (30 mm).
  - LP 1 finishes (wood, mirror gold stainless, brushed stainless, corten, clear acrylic, clear with coloured front, coloured acrylic) with
    Solid (3/5/10/20 mm) and Fabricated (20/50/100/200 mm, metals only) builds. Deep links: `?config=<id>&finish=<finish>&build=<solid|fabricated>`.
- Configurator promoted across the site: header button, hero link, homepage showcase section with a looping demo (frames of the real
  renders, `public/images/configurator-demo.*`, about 100 KB, still poster for reduced motion), promo modules on the ultra-slim, classic and
  every EdgeLuxe system page with `?config=` deep links, FinalCTA, contact page, footer, WebApplication JSON-LD, llms.txt.
- Animated light-direction diagrams (CSS only, stop under `prefers-reduced-motion`) driven by each configuration, plus a stand-off vs flush
  mount explanation on the ultra-slim page and the system pages (`src/components/diagrams/ConfigLightDiagram.tsx`).
- EdgeLuxe renders: owner-supplied day and night images (11 lit systems, 1200x900 JPEG) with a Day | Night switch on each system page; LP 1 uses the owner-supplied gold "S" photo (single image, no day/night switch).
- 657 tests pass; `npm run build`, `npm run verify:prerender` (22 checks) and `npm run export:content` are clean.

- Mounting (owner list, 2026-10-03): LP 3.1, LP 11-B and LP 11-FB are stand-off only; every other system (LP 1, 3.2, 5, 11-F, 11-BS, 11-FS, 11-S, 11-N, 11-C)
  can be flush or stand-off. Data: `mounts` in `src/data/configurations.ts`; configurator has a Mounting control (and `&mount=flush|standoff` deep link);
  specs, diagrams and page copy follow the data.
- The product page image card no longer stretches to the height of the text column.

- Final touches (2026-10-05): quotes "24 to 48 hours, most times 24"; every sign comes with touch-up paint and a printed installation template ("pre-wired" removed);
  "German engineered" in the capability strip and hero; Tampa address removed everywhere (it is a mailbox); LP 5+3.1 option (face + halo, acrylic back and front,
  stand-off only) in the configurator and on the LP 5 page; LP 1 finish gallery (placeholder renders); configurator: canvas stays mounted while typing (no vanishing
  preview), disclaimer (preview colours are not the real acrylic colours; every order needs proper artwork), Playfair removed, single-line neon fonts for LP 11-N only,
  glow limited to 3000/4000/5000/6000 K whites plus yellow, orange, red, pink, green, blue (no colour picker), unlit coloured acrylic keeps its colour.

- 2026-10-05 (2): mounting per owner list (flush only: LP 3.2, 5, 11-F, 11-S, 11-N, 11-C; either: LP 1, 11-BS, 11-FS; stand-off only: LP 3.1, 11-B, 11-FB, LP 5+3.1) with
  1" x 0.4" clear plastic spacer tubes drawn in the preview; only halo and back-side-lit letters light the wall (no more halo look on face-lit or side-lit);
  Build Your Sign starts in text mode with "SUNLITE" (`?source=upload` opens the upload); `.ai` upload; cookie banner + Consent Mode + tracking module
  (see docs/ANALYTICS-PLAN.md); smaller trust badge. Docs: ANALYTICS-PLAN, LAUNCH-CHECKLIST, LIVE-CHAT, ARTWORK-FILES.

## Owner confirmations still open
- UL label: owner offered to share it for use as a badge (not yet received).
- LP 11-B depths 10/15/20/30 mm versus the H1 "25-30 mm".
- Wording "trimless" for cast acrylic: owner says it is not really used for cast block acrylic but is not wrong, so it stays.
- `/services/cabinet-signs` now redirects to the custom fabrication page.
- Photo labels on the product pages.
- Custom fabrication page facts: UL 48, warranty, and that no lead time is stated.
- LP 1 materials: depth ranges per build, and which finishes are solid-only versus fabricated (currently only the metals can be fabricated).
- The configurator copy says "a 3D sign configurator built for sign companies"; no "only company" claim is made anywhere.

## Next
- Test one real HubSpot submission with an SVG attachment (SVG is not in the field's allowed-types text).
- Live chat / messaging beyond WhatsApp (recommended: HubSpot chat + booking button + SMS link).
- Replace the placeholder gallery with the brochure's project photos.
- Deploy to the domain; Search Console and Bing. `/configurator` is not in the sitemap (it is a client-rendered shell); add it if wanted.
- Real-device testing of the configurator (only software WebGL tested so far; clear acrylic is plain transparency, not transmission, to stay light).

## Known small issues
- Nav "Request Wholesale Pricing" does not carry the configuration (only the configurator's own button does).
- Mobile: the sticky quote button overlaps the last row of options while scrolling.
- PDF import is limited (overlapping shapes extrude as stacked solids; stroke-only art and images are skipped).

Design/spec history: `docs/superpowers/specs/2026-10-01-sign-configurator-design.md` (Revisions 2-6 at the end).
