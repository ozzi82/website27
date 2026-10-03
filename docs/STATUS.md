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
- EdgeLuxe renders: owner-supplied day and night images (11 lit systems, 1200x900 JPEG) with a Day | Night switch on each system page; LP 1 keeps its single photo.
- 631 tests pass; `npm run build`, `npm run verify:prerender` (22 checks) and `npm run export:content` are clean.

## Owner confirmations still open
- LP 11-B depths 10/15/20/30 mm versus the H1 "25-30 mm".
- Wording "trimless" for cast acrylic: owner says it is not really used for cast block acrylic but is not wrong, so it stays.
- `/services/cabinet-signs` now redirects to the custom fabrication page.
- Photo labels on the product pages.
- Custom fabrication page facts: UL 48, warranty, and that no lead time is stated.
- "Mounts flat" wording for the LP 11 variants that are not flush or stand-off.
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
