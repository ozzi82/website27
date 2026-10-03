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

## Phase 1 outcome (as built)

- Homepage order: Hero, Trust strip, Products (`#products`), Ultra-slim (`#ultra-slim`), Built for the trade (`#trade`), Manufacturing (`#manufacturing`), Recent production (`#projects`), EdgeLuxe letter systems with a "Try the 3D Configurator" link (`#light-effects`), Process (`#process`), Trade-only statement (`#trade-only`), FAQ (`#faq`), Final CTA (`#request-pricing`). Code in `src/components/home/*`, `LightEffects`, `FAQSection`, `FinalCTA`.
- Hero: poster-first (`public/images/hero-production-poster.jpg`, derived from the existing CNC production photo); the YouTube iframe mounts after window load + idle, only on viewports >= 768 px, not with reduced motion or save-data. H1 and body are plain CSS-animated markup (no JS-gated opacity), so they are visible in the prerendered HTML and paint before hydration.
- `/services/channel-letters` and `/services/ultra-slim-trimless-channel-letters` currently render through the generic `ServicePage` from `data/services.ts` (interim). The depth drawing is not on the ultra-slim page yet: Phase 2 should add `<DepthComparison size="lg" />`.
- `framer-motion` is no longer imported anywhere in `src` (the hero was its only user). The dependency is left in `package.json`; remove it separately if wanted.
- The configurator buttons and `ContactForm`/`ContactPage` still use "Get a Quote"/"Request a Quote"; `ctaConsistency.test.ts` exempts exactly those files until Phase 3.

## Phase 2 outcome (as built)

### Routes
| Route | Page | Notes |
| --- | --- | --- |
| `/services/channel-letters` | `ChannelLettersPage` | Dedicated, routed before `/services/:id`, prerendered. Standalone Google Ads landing page. |
| `/services/ultra-slim-trimless-channel-letters` | `UltraSlimPage` | Dedicated, routed before `/services/:id`, prerendered. |
| `/projects` | `ProjectsPage` | The one canonical projects URL. `/gallery` redirects (client `Navigate` from `LEGACY_PAGE_REDIRECTS`, 301 in `public/_redirects` and `nginx.conf`); `/gallery` is no longer prerendered or in the sitemap. |
| `/manufacturing` | `ManufacturingPage` | Production proof. |
| `/about` | `AboutPage` | Kept, repurposed (see decisions). |
| `/services/cast-block-acrylic` | `ServicePage` (generic) | Gets a hero CTA and a "Related systems" block (LP 11-F, 11-B, 11-FB + channel letters). |

### Decisions
- **gallery -> projects:** renamed to `/projects` (clean URL, matches the nav label and the brief), with 301s so the old URL does not 404.
- **About vs Manufacturing:** both kept, with distinct jobs. `/manufacturing` = production proof (six stages from `data/production.ts` with real photos where they exist and typographic placeholders otherwise, "what ships with every order", process, the factual company line, trade-only note). `/about` = who Sunlite is and who it builds for (Built for the trade, Who we serve, trade-only statement, contact details, FAQ). No production stage grid on About, no company/FAQ block on Manufacturing.
- **Custom Fabrication target:** a section (`#custom-fabrication`) of the channel-letters page ("Custom logos & illuminated letter projects", wording built from the brief and the existing "we advise on materials, light effects, sizing, feasibility" FAQ). The homepage card and the nav item both point to `/services/channel-letters#custom-fabrication`.
- **Photos on product pages:** none is tagged `productSlug: "channel-letters"` (no site data supports it), so the channel-letters page shows lit-letter photos captioned only with what is visible (lit faces / halo glow) plus "Recent production" cards without category claims. The two photos that were the imagery of the old "Trimless Letters" service page (concourse column sign, event stand) are tagged `ultra-slim-trimless-channel-letters` on that basis and flagged below.
- **Exact SEO titles:** `Seo` gained `exactTitle`. The ultra-slim title is the brief's verbatim "Ultra-Slim Trimless Channel Letters | 25-30 mm Depth" with no site-name suffix (the verify script allows exactly that exception); the channel-letters title already contains the site name, so it is not duplicated.
- **Redirect plumbing:** `LEGACY_SERVICE_REDIRECTS` (services) and `LEGACY_PAGE_REDIRECTS` (pages) are the sources; `public/_redirects` and `nginx.conf` carry the matching 301s (tested).

### Final navigation / internal-link map
Header: PRODUCTS (Channel Letters `/services/channel-letters`, Ultra-Slim Trimless `/services/ultra-slim-trimless-channel-letters`, Cast Acrylic `/services/cast-block-acrylic`, Custom Fabrication `/services/channel-letters#custom-fabrication`, All 12 letter systems `/#light-effects`, 3D Configurator `/configurator`), Projects `/projects`, Manufacturing `/manufacturing`, About `/about`, CTA "Request Wholesale Pricing" -> `/contact`. Footer repeats the same targets.

Funnel: Homepage (hero, products, ultra-slim section, manufacturing section "View manufacturing", projects "View all projects") -> Channel Letters (ultra-slim links in the trim section, spec sheet and FAQ; mounting; custom fabrication; reference projects -> `/projects`; Related: ultra-slim, EdgeLuxe, projects, manufacturing) -> Ultra-Slim (cross-link to channel letters and its mounting section; related EdgeLuxe LP 5 / LP 11-F; Related: channel letters, projects, manufacturing, configurator) -> Projects (cards link to their product page when `productSlug` is set; Related: channel letters, ultra-slim, manufacturing, cast acrylic) -> Manufacturing (Related: channel letters, ultra-slim, projects, about) -> Quote (`/contact`: every page's primary CTA and Final CTA). Visible breadcrumbs + BreadcrumbList JSON-LD on the five new/changed pages.

### SEO
- Channel letters: title "Wholesale Channel Letter Manufacturer | Sunlite Signs"; description "Wholesale channel letter manufacturer for sign companies. Front, halo and front + back lit letters built to your drawings, UL 48 listed, shipped nationwide. Trade only."; JSON-LD `Service` (provider = the homepage LocalBusiness `@id`, `BusinessAudience`, no offers/ratings/prices) + `BreadcrumbList` + `FAQPage` (nine Q&A, each restating an existing site fact).
- Ultra-slim: title "Ultra-Slim Trimless Channel Letters | 25-30 mm Depth" (exact); description "Ultra-slim trimless channel letters at 25-30 mm total depth: a cleaner alternative to deep returns for premium retail, architectural and interior signage. Wholesale to sign companies."; JSON-LD `Product` (properties from the spec data, no offers) + `BreadcrumbList`.
- /projects, /manufacturing, /about: new titles/descriptions + `BreadcrumbList`. `verify-prerender` now requires JSON-LD on every page and the exact titles above.

### Owner confirmation (running list, Phase 1 + 2)
1. **Ultra-slim 25-30 mm:** that fabricated trimless letters are offered at 25-30 mm with face, halo and dual lighting (brief + old site say yes; the brochure's LP 5 starts at 30 mm and is face-lit only; 25 mm exists only for small LP 11-F letters). The ultra-slim page surfaces this in a "Related letter systems" block ("Depths differ by system") described from `configurations.ts`.
2. **Channel-letter configurations Sunlite actually builds:** trimmed and trimless; flush, standoff, raceway and remote mounting (flush/standoff are brochure options only for EdgeLuxe LP 3.2/3.1; raceway/remote come from the brief's "where applicable"). The "remote mount = power supply located remotely" wording is an assumption: confirm the meaning.
3. **Construction/materials/finishes:** "CNC-routed aluminum returns, faces and backs" (existing wording; do faces use acrylic?); "Custom paint or vinyl" (from the old trimless page); PMS colors apply to EdgeLuxe systems only. No gauges, depths or LED brands are stated anywhere.
4. **Photos:** (a) that the 12 gallery photos and their client names are Sunlite-built and may be named; (b) that "Concourse column sign" and "Event stand lettering" really are the trimless/ultra-slim work they illustrated on the old Trimless page (they are tagged to the ultra-slim page and show "Product: Ultra-slim trimless letters"); (c) the illumination captions on the channel-letters page (Mustang = lit faces; Tradebyte, Inspire = halo glow) describe what is visible, not specs, but confirm they are channel letters.
5. **Claims reused:** UL 48 vs "UL Listed" for EdgeLuxe; 3-4 weeks (does it cover freight?); 3-year warranty scope; "German-engineered" in the EdgeLuxe grid copy; "installation not provided" wording; "ships nationwide, to project sites by arrangement".
6. **Manufacturing page:** no claim is made about where any stage happens; confirm that stays true and which stages the real photos show (only CNC and hand assembly exist).

### Assets that would materially improve the pages
Side-profile photograph of a real 25-30 mm letter (slot is `sideProfileMedia` in `data/ultraSlim.ts`); real photos/video for LED & electrical, quality control, packaging, ready-for-freight (`data/production.ts`); one confirmed photo per configuration (front lit, halo, front + back, trimmed, trimless, raceway, remote) with depth/finish/mounting for `data/projects.ts`; a close-up of a trim cap vs a trimless edge.

### Left for Phase 3
Quote/contact page rewrite (H1, company-type field, retired-CTA allowlist for `ContactForm`/`ContactPage`), `SITE_URL` as a build setting + noindex handling, final SEO pass on `/contact`, `docs/site-content.md` regeneration, content export, full QA.

## Phase 3 outcome

Quote page, why-Sunlite benefits, Build Your Sign, channel-letter depth, case-study template, `VITE_SITE_URL` / `VITE_NOINDEX`, final SEO pass and full QA are done. See `2026-10-03-wholesale-repositioning-report.md` (what changed, the consolidated owner-confirmation list, missing assets and owner decisions).
