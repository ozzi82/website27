# Wholesale repositioning: plan (Phase 1 inspection)

Source: `2026-10-03-wholesale-repositioning-brief.md`. Branch: `feature/wholesale-repositioning`.
Phase 1 = inspection, shared foundations, header/footer, homepage. Phase 2 = product, projects and manufacturing pages. Phase 3 = quote page, SEO plumbing, QA.

## What exists today

- Vite 6 + React 18 + TS + Tailwind 3, `react-router` 6, `react-helmet-async` (`<Seo>`), framer-motion (hero entrance only), static prerender at build (`scripts/prerender.mjs`, routes from `getPrerenderRoutes()` in `entry-server.tsx`, checked by `scripts/verify-prerender.mjs`). Hosts: Cloudflare Pages style `_redirects` + nginx (`nginx.conf`, Coolify).
- Routes: `/`, `/services/:id` (generic `ServicePage` driven by `data/services.ts`), `/light-effects/:id` (12 EdgeLuxe pages from `data/configurations.ts`), `/about` ("How We Work"), `/gallery`, `/contact` (HubSpot form + configurator hand-over), `/configurator` (WebGL, client-only).
- Homepage = `plant/PlantTop` (hero with an autoplaying YouTube iframe, spec rail, product grid driven by `services`), `plant/PlantBottom` (facility, workflow, trade statement) and `LightEffects` (12-system grid). `FAQSection`, `GallerySection`, `ProductionSection`, `ProcessSection`, `FinalCTA` are older, differently styled sections used only by `/about`, `/gallery`, `/contact`.
- Visual language: dark charcoal, orange `--primary`, Barlow Condensed headings, JetBrains Mono `mono-label`, `steel-plate` grid, `caution-tape` rule.
- Header: `<button onClick=navigate>` nav items (not crawlable links), two hover-only dropdowns (Services, Light Effects), "Get a Quote" CTA hidden below `lg`.
- Primary CTA wording is inconsistent today ("Request a Quote", "Get a Quote", "Start Your Project", "Send Your Drawings", "Quote this letter system", "Get a Quote for a Similar Project").
- `services` holds trimless, cast block acrylic and cabinet signs. Cabinet signs also appear in the homepage JSON-LD/meta, `index.html`, `sitemap.xml`, `llms.txt`.
- Tests: 401 passing at the start (configurator-heavy; no homepage/header/data tests).

## What Phase 1 changes

1. Shared foundations (separate commits, tested):
   - `lib/cta.ts` + `components/CtaButton.tsx`: single source for the primary CTA ("Request Wholesale Pricing" -> `/contact`) and the secondary/informational labels. A test fails if a retired phrase reappears in non-configurator source.
   - `data/products.ts`: the four homepage/nav product categories + legacy redirect map.
   - `data/services.ts`: cabinet signs removed; `trimless-letters` becomes `ultra-slim-trimless-channel-letters` (25-30 mm, specialised option); new `channel-letters` entry (interim data for the generic `ServicePage`; Phase 2 replaces the page); cast acrylic reconciled with LP 11-F.
   - `data/projects.ts` + `ProjectCard`; `data/production.ts` + `ProductionStageCard` + `MediaFrame`; `data/process.ts`.
   - `DepthComparison` (inline SVG, reusable by the ultra-slim page).
   - `lib/routes.ts`: prerender route list moved out of `entry-server.tsx` so tests and the sitemap check can import it.
2. Header (Products dropdown, Projects, Manufacturing, About, CTA; real `<Link>`s; keyboard-reachable dropdown), footer wording per brief section 19.
3. Homepage rebuilt in `components/home/*`, replacing `plant/*`. Order: Hero, Trust strip, Products, Ultra-slim, Built for the trade, Manufacturing, Projects, EdgeLuxe letter systems + configurator link, Process, Trade-only statement, FAQ, Final CTA.
4. Hero video becomes poster-first: a compressed still of the existing production image paints immediately; the YouTube iframe mounts only after window load + idle, on viewports >= 768 px, without reduced-motion/save-data.

## Decisions

- Cabinet signs: removed from data, nav, grid, sitemap, llms.txt, `index.html`, JSON-LD. `/services/cabinet-signs` redirects to `/services/channel-letters` (client `Navigate`, plus 301 in `public/_redirects` and `nginx.conf`). `/services/trimless-letters` redirects to the ultra-slim URL the same way.
- "Custom Sign Fabrication": no dedicated page exists and none is invented. Card and nav item link to `/contact` (custom logos and illuminated letter projects are quoted per drawing). Phase 2 may add a section on the channel-letter page and re-point it.
- Nav targets in Phase 1: PROJECTS -> `/gallery`; MANUFACTURING -> `/#manufacturing`; ABOUT -> `/about`. Intended final targets: PROJECTS -> `/gallery` (or `/projects` if Phase 2 adds it), MANUFACTURING -> a manufacturing page or `/about`, ABOUT -> `/about`. Phase 2 decides; the targets live in `data/nav.ts`.
- Configurator stays discoverable: Products dropdown ("3D Configurator") and a link in the letter-systems section. EdgeLuxe 12-system grid stays on the homepage (`#light-effects` anchor kept because `ConfigurationPage` breadcrumbs use it) but is not a header dropdown any more.
- Project metadata is blank on purpose for all existing images (see claims below).

## For Phase 2

- Build `/services/channel-letters` and `/services/ultra-slim-trimless-channel-letters` as dedicated routes placed before `/services/:id` in `App.tsx` (the generic page is the interim). Reuse `DepthComparison size="lg"`, `ProjectCard`, `ProductionStageCard`, `CtaButton`, `SectionHeader`, FAQ, `Seo`. Remove the interim entries' placeholders from `services.ts` or feed the new pages from them.
- Projects/manufacturing pages: reuse `data/projects.ts`, `data/production.ts`. `projectsForProduct(slug)` returns cards linked to a product once the owner supplies `productSlug`.
- Drop real production photos/video in `data/production.ts` (`image` or `video` + `poster`); no component change needed.

## For Phase 3

- `/contact`: H1 "GET YOUR WHOLESALE QUOTE", company-type field, "TRADE CUSTOMERS ONLY", submit label from `CTA_PRIMARY`; remove `ContactForm.tsx`/`ContactPage.tsx` from the allowlist in `src/lib/__tests__/cta.test.ts`. Keep HubSpot and artwork hand-over intact.
- SEO plumbing: titles/meta/JSON-LD for the two new pages, sitemap/llms.txt final pass (Phase 1 already removed cabinet and added the two URLs), canonical/SITE_URL build setting, regenerate `docs/site-content.md`.
- Configurator buttons still say "Get a Quote" (they hand the configuration over; decide whether to relabel).

## Claims: existing site vs brief

| Claim | Where it exists today | Status |
| --- | --- | --- |
| UL 48 listed | services specs, hero, facility, meta, llms.txt; configurations say "UL Listed" | Used (already on site). Owner: confirm "UL 48" vs "UL Listed" wording for EdgeLuxe systems. |
| 48 h tailored quotes | hero meta, FAQ, final CTA, llms.txt | Used. |
| 3-4 weeks | Facility cap, Workflow, llms.txt ("approved PO to dock") | Used as "typical production + delivery". Owner: confirm it covers freight. |
| 3-year LED + power-supply warranty | services specs, Facility cap | Used. |
| Nationwide shipping | homepage meta/JSON-LD, llms.txt | Used. |
| Ships ready to install, drill template + wiring plan, pre-wired | DeliverySection, Facility cap | Used in short form. |
| 25-30 mm ultra-slim trimless | Brief only. Brochure: LP 5 trimless stainless starts at 30 mm; 25 mm exists only for LP 11-F cast acrylic ("small letters") | OWNER CONFIRM that fabricated trimless letters are offered at 25-30 mm (and with face/halo/dual lighting; LP 5 lists face-lit only). Old "under 1 1/4 in" wording dropped. |
| Standard channel letters: front/halo/front+back, trimmed/trimless, raceway/remote | Brief only | Used as the brief states; no depths/materials added beyond existing "CNC-routed aluminum returns, faces and backs". OWNER CONFIRM spec details for Phase 2's page. |
| "100%" trade-only (old spec rail), "German-engineered" (letter-systems copy), "Laser fabrication", "Many sign companies use Sunlite" (FAQ) | Existing | "100%" and "Laser" and "Many" removed from rewritten sections; "German-engineered" kept in the untouched EdgeLuxe grid copy: OWNER CONFIRM. |
| Project photos and client names (Tradebyte, MACS, JenTower, ARGO-HYTOS, itonics, Stroh + Scheuerpflug, Mustang, Inspire...) | GallerySection | Kept, titles only. OWNER CONFIRM these are Sunlite-built (they came with the brochure) and that naming clients is OK. No depth/finish/mounting/product type is recorded. |
| Cast acrylic specs ("Placeholder" height, Clear/Opal colors) | services.ts | Reconciled to LP 11-F brochure data (min 2 in height, 1.2 in / 1 in depth, PMS/vinyl/pigmented acrylic). |
| Manufacturing location | none | Nowhere claims Tampa production; footer reads "Sunlite Signs LLC, Tampa, Florida" + "wholesale manufacturing partner for sign companies nationwide". `llms.txt` "shipped ... from Tampa" reworded. |
