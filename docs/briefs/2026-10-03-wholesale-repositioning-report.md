# Wholesale repositioning: final report (brief section 25)

Branch `feature/wholesale-repositioning` (not pushed, master untouched). Brief: `2026-10-03-wholesale-repositioning-brief.md`. Plan and per-phase outcomes: `2026-10-03-wholesale-repositioning-plan.md`.

Final state: `npm test` 570 tests in 48 files green (401 at the start of Phase 1), `npm run build` (type check + client + SSR + prerender) clean, `npm run verify:prerender` 22 of 22 checks pass, 21 pages prerendered (20 content routes + the `/configurator` SPA shell). Verified in headless Chrome against the production build served file-first: no console errors, no hydration warnings, no failed requests, one H1 and no horizontal overflow on every route at 360, 390, 768, 1366 and 1440 px.

## 1. Files changed

103 files against master (8,214 insertions, 1,311 deletions). Grouped; (P1) (P2) (P3) mark the phase.

- **Shared foundations (P1):** `src/lib/cta.ts`, `src/lib/contact.ts`, `src/lib/routes.ts`, `src/data/{products,projects,production,process,nav}.ts`, `src/data/services.ts` (cabinet signs removed, channel letters and ultra-slim entries, cast acrylic reconciled to the brochure).
- **Header, footer, homepage (P1, P3 touches):** `Header.tsx`, `Footer.tsx`, `FinalCTA.tsx`, `FAQSection.tsx`, `LightEffects.tsx`, `TargetGroups.tsx`, `HomePage.tsx`, new `components/home/*`; old `plant/*`, `ProductionSection`, `ProcessSection`, `DeliverySection`, `GallerySection`, `GalleryPage` removed.
- **Product, projects, manufacturing, about (P2):** `ChannelLettersPage`, `UltraSlimPage`, `ProjectsPage`, `ManufacturingPage`, `AboutPage`, `ServicePage`, `data/channelLetters.ts` (P3 adds construction, depth options, files, what arrives), `data/ultraSlim.ts`, diagrams, `Breadcrumbs`, `RelatedLinks`.
- **Quote page (P3):** `pages/ContactPage.tsx`, `components/ContactForm.tsx`, `components/CompanyTypeSelect.tsx`, `lib/companyType.ts`, `lib/__tests__/ctaConsistency.test.ts` (ContactForm, ContactPage and ConfiguratorPage left the retired-CTA exemption list).
- **Build Your Sign (P3):** `lib/configuratorMeta.ts`, `components/BuildYourSign.tsx`, `ConfiguratorPage.tsx`, `ConfigurationPage.tsx`, `ServicePage.tsx`, `data/nav.ts`, `Footer.tsx`, `lib/cta.ts`.
- **Case-study template (P3):** `data/caseStudies.ts` (empty), `pages/CaseStudyPage.tsx`, `ProjectCard.tsx`, `ProjectsPage.tsx`, `App.tsx`, `content-to-fill/CASE-STUDIES.md`.
- **SEO plumbing (P3):** `lib/seo.ts`, `lib/siteFiles.ts`, `lib/routes.ts`, `components/Seo.tsx`, `index.html`, `vite.config.ts`, `vite-env.d.ts`, `entry-server.tsx`, `scripts/{siteConfig,prerender,verify-prerender,export-content}.mjs`, `scripts/templates/llms.txt` (moved from `public/llms.txt`), `public/{robots.txt,sitemap.xml,llms.txt}` deleted (now generated), `Dockerfile`, `nginx.conf`, `public/_redirects`, `DEPLOY.md`, `docs/site-content.md` (regenerated).
- **Tests:** 14 new test files and extensions of the existing ones (components, data, lib, pages).
- **Docs:** brief, plan, this report.

## 2. Components created

- `CtaButton.tsx` (`PrimaryCta`, `SecondaryCta`, `ArrowLink`), `SectionHeader`, `MediaFrame` (lazy image, or video behind a poster and play button), `ProductionStageCard`, `ProjectCard`, `DepthComparison` (inline SVG side-profile drawing), `Breadcrumbs`, `RelatedLinks`, `diagrams/DiagramCard` + `LetterDiagrams` (lighting, trim, mounting section drawings) (P1, P2).
- Home sections: `Hero` (poster-first, YouTube iframe only after load and idle on wide screens), `TrustStrip`, `ProductsSection`, `UltraSlimSection`, `OutsourcingSection` (five benefits, P3), `ManufacturingSection`, `ProjectsSection`, `ProcessSteps`, `TradeStatement` (P1).
- `CompanyTypeSelect` (native select, optional, five types) (P3).
- `BuildYourSign` (contextual "Not sure which configuration you need?" module, band and inline variants) (P3).
- Pages: `ChannelLettersPage`, `UltraSlimPage`, `ProjectsPage`, `ManufacturingPage`, `CaseStudyPage` (+ `CaseStudyView`) (P2, P3).
- Non-visual: `lib/siteFiles.ts` (sitemap, robots, llms.txt and nginx header generators), `lib/companyType.ts`, `lib/configuratorMeta.ts`, `scripts/siteConfig.mjs` (the build settings reader), `data/caseStudies.ts`.

## 3. Routes created (incl. redirects)

| Route | What | Phase |
| --- | --- | --- |
| `/services/channel-letters` | Dedicated Google Ads landing page | P2 |
| `/services/ultra-slim-trimless-channel-letters` | Dedicated ultra-slim page (replaces `trimless-letters`) | P2 |
| `/projects` | Reference projects (replaces `/gallery`) | P2 |
| `/manufacturing` | Production proof | P2 |
| `/projects/:slug` | Case-study template; **zero case studies exist, so zero routes are prerendered or in the sitemap**; an unknown slug redirects client-side to `/projects` | P3 |
| `/contact` | Now "Get your wholesale quote" (same URL) | P3 |
| `/configurator` | Same URL; named Build Your Sign | P3 |

Redirects (301 in `public/_redirects` and `nginx.conf`, plus a client `Navigate` fallback, all tested; the three 301s also re-checked in a real browser against the file-first server): `/gallery` to `/projects`, `/services/cabinet-signs` to `/services/channel-letters`, `/services/trimless-letters` to `/services/ultra-slim-trimless-channel-letters`.

## 4. Copy changes

- **Hero:** eyebrow "Wholesale sign manufacturer · Trade only"; H1 "Wholesale Channel Letters. Built for Sign Companies."; body with UL 48 line; primary "Request Wholesale Pricing", secondary "Explore Products". "Engineered signs. Built at volume." is no longer the H1.
- **Trust strip:** UL 48 listed, 48 h tailored quotes, 3-4 wk typical production + delivery, 3 yr LED and power-supply warranty, Trade only ("Your customer stays your customer." as its line, P3).
- **Products:** "Built for the jobs your shop wins." with Standard Channel Letters, Ultra-Slim Trimless, Cast Acrylic Letters, Custom Sign Fabrication. Cabinet signs removed everywhere.
- **Ultra-slim:** "25-30 mm. Less depth. More design freedom." as a specialized option, never the standard depth; side-profile depth drawing.
- **Why Sunlite (P3):** still "More capacity. Without more overhead." (eyebrow Built for the trade), now five benefits: Win more jobs; Keep your crew installing (we fabricate and pre-wire the signage and ship it ready to install; no "test" claim); Handle overflow; Add specialty capability; Your customer stays yours.
- **Trade statement, manufacturing, projects, process, final CTA:** "We don't compete with our partners. We build for them."; "Your drawings in. Finished signs out." with six stages; "Recent production" / "See what we've built."; "From Artwork to Your Dock." (six steps); "Have drawings ready? Let's price the job."
- **One CTA wording (P1):** "Request Wholesale Pricing" everywhere (header, hero, product pages, final CTA, mobile menu, the configurator's hand-over button in P3). The retired phrases ("Get a Quote", "Request a Quote", "Get in Touch", "Start Your Project", "Send Your Drawings", "Quote this letter system") fail a test if they reappear in source.
- **Quote page (P3):** H1 "Get your wholesale quote" (capitals by styling); body "Send your artwork, dimensions and project details. We'll return a tailored quote within 48 hours."; visible "Trade customers only · No retail sales"; a "Helps us quote fast" list that restates the existing FAQ answer; email, phone and WhatsApp alternatives kept; HubSpot submit button label "Request Wholesale Pricing" (passed as `submitText`, verified in a real browser, and the portal's own label already matches).
- **Configurator (P3):** now "Build Your Sign" in the Products dropdown, footer, the home letter-systems link, its H1, title, description and the EdgeLuxe system pages ("See this system with your logo." module). URL unchanged.
- **Channel-letters page (P3):** new Construction (face, return, back, LED system, power supply), Depth options (standard returns, ultra-slim 25-30 mm with link, custom to project), Files we accept (AI, EPS, PDF vector, dimensions or sketch, site photos, light effect; the Build Your Sign preview's SVG/PDF noted separately), What arrives (the existing ready-to-install wording: pre-wired, drill template, wiring plan, crated).
- **Location (brief section 19):** "Sunlite Signs LLC · Tampa, Florida. Wholesale manufacturing partner for sign companies nationwide." No manufacturing-location claim anywhere.

## 5. SEO changes

- **Titles / descriptions:** home "Wholesale Channel Letters for Sign Companies | Sunlite Signs"; channel letters "Wholesale Channel Letter Manufacturer | Sunlite Signs" (exact); ultra-slim "Ultra-Slim Trimless Channel Letters | 25-30 mm Depth" (exact, no suffix); contact "Get Your Wholesale Quote: Channel Letters | Sunlite Signs" with a 158-character description; configurator "Build Your Sign: 3D Channel Letter Preview | Sunlite Signs"; projects, manufacturing, about rewritten in P2. Cabinet-free everywhere (grep of source, `dist` and the generated files: only the retired URL redirects mention the word).
- **Structured data:** home LocalBusiness (kept, see section 10); channel letters Service + BreadcrumbList + FAQPage; ultra-slim Product + BreadcrumbList; contact ContactPage + BreadcrumbList + FAQPage; projects, manufacturing, about BreadcrumbList; case studies Article + BreadcrumbList when they exist. `verify:prerender` requires JSON-LD on every page.
- **Origin as a build setting:** `VITE_SITE_URL` (default `https://sunlitesigns.com`) feeds `seo.ts` (canonical, og:url, og:image, every JSON-LD builder), `index.html` (placeholder filled by a Vite plugin), the prerender script, the verify script and the content export. `sitemap.xml`, `robots.txt` and `llms.txt` are generated into `dist` at prerender time (sitemap from the route list, llms.txt from `scripts/templates/llms.txt`), so a stale hardcoded domain cannot ship. `verify:prerender` fails if any canonical, og:url, sitemap URL or robots tag disagrees with the build's variables, and apex vs www is strict (one origin, used as written; redirect the other).
- **Demo builds:** `VITE_NOINDEX=1` gives `noindex, nofollow` on every page and on the `/configurator` shell, `Disallow: /` robots.txt, no sitemap or llms.txt, and an `X-Robots-Tag` header via an nginx include written at build time; the Dockerfile takes both as build args. `DEPLOY.md` has the exact Coolify steps for the t2wraps.com demo and the switch to production.
- **Case studies feed the sitemap and llms.txt** when present (tested with a fixture; a temporary real build with one entry was prerendered, listed and then reverted; verify correctly flagged its 39-character description).
- **Internal links:** a crawl of every prerendered page found no dead link or missing anchor; images all exist, have alt text and (except decorative hero poster and the 12 EdgeLuxe photos, which sit in fixed-aspect frames) width and height.
- `docs/site-content.md` regenerated (the export now reads the real header navigation and fills the collapsed FAQ answers on every page).

## 6. Conversion changes

- One primary CTA, same words and target on every page; the quote page now promises the 48-hour tailored quote, says trade only, and lists what helps (vector artwork, dimensions, site photos, light effect).
- **Company type** (optional): five choices, remembered for the tab, written as "Company type: X" at the top of the message and, if the HubSpot form later gets a `company_type` field, into that field too (dropdown option must match the label; a visitor's own entry is never overwritten). Nothing is mandatory in code.
- The configurator hand-over is intact and verified end to end in a real browser (section QA below): configuration card, message prefill, artwork attached to the HubSpot file field, survives a reload.
- Fixed a real bug found in QA: reloading `/contact` after a configurator quote produced React hydration errors (#418/#423) because the history entry kept the router state; the quote is now read after mount (regression test added).
- Channel-letters page is a standalone landing page: the primary CTA is above the fold on a phone, the trust strip follows, and a "Build Your Sign" module sits mid-page for visitors still choosing a configuration.
- Hero is poster-first (no iframe in the prerendered HTML; the YouTube embed mounts after load and idle on wide screens only).

## 7. Intentionally NOT changed, and why

- **No invented facts:** no new numbers, depths, gauges, LED brands, lead times, certifications, testimonials, logos, client counts or factory claims. Project metadata stays blank for the existing photos.
- **Ultra-slim stays a specialized option** (25-30 mm); standard letters have no stated depth.
- **LocalBusiness structured data kept** with the existing Tampa address (see section 10).
- **EdgeLuxe system pages:** their copy ("German-engineered", "UL Listed", the 12 configurations) is untouched except the configurator link; their long titles (up to 75 characters) are left as is.
- **HubSpot form itself:** its fields, required flags, thank-you message and portal settings are not changeable from code (section 10).
- **`framer-motion`** still in `package.json` although no source file imports it (dependencies were not touched; remove separately if wanted).
- **Image formats:** the two production photos on `/manufacturing` are 230 and 350 KB PNGs; converting them needs an image tool and was out of scope (only the first one loads eagerly now).
- **Not built (needs your decision, section 10):** sample-kit CTA, `/trade` page and blind-shipping claims, the horizontal 8-step production story, "Specialty Letters" and "Lighting" nav items, the "Backer Panel" mounting option, SVG/DXF as accepted quote files, the word "test" for wired letters.
- **Docker build:** the Dockerfile and nginx changes are covered by tests and by running the same build steps by hand, but the Docker daemon was not running here, so no image was built (section 10).

## 8. Claims and content requiring your confirmation (prioritized)

**Must confirm before ads go live**

1. **Ultra-slim 25-30 mm:** that fabricated trimless letters are offered at 25-30 mm with face, halo and dual lighting. The brochure's LP 5 trimless starts at 30 mm and is face-lit only; 25 mm exists only for small LP 11-F block-acrylic letters. Every ultra-slim statement rests on the brief.
2. **Channel-letter configurations Sunlite builds:** front, halo and front + back lit; trimmed and trimless; flush, standoff, raceway and remote mounting. Flush and standoff are brochure options only for EdgeLuxe LP 3.2 and 3.1; raceway and remote come from the brief's "where applicable". The wording "remote mount = power supply located remotely" is an assumption.
3. **Photos and client names (12 project photos):** that they are Sunlite-built and the names (Tradebyte, MACS, JenTower, ARGO-HYTOS, itonics, Stroh + Scheuerpflug, Mustang, Inspire and others) may be shown; that "Concourse column sign" and "Event stand lettering" really are the trimless/ultra-slim work and may carry the "Ultra-slim trimless letters" label; the lit-face / halo captions on the channel-letters page.
4. **48 h vs 24 h:** the HubSpot thank-you message says "our team will contact you within 24 hours", while the site promises a tailored quote within 48 hours. Both can be true, but they should be worded to agree.
5. **3-4 weeks:** does it cover freight ("typical production + delivery")? **3-year warranty:** scope (LED modules and power supplies). **UL 48** vs "UL Listed" for the EdgeLuxe systems.

**New with Phase 3 (please confirm each)**

6. **Construction block:** "CNC-routed aluminum" for face, return and back (existing spec-sheet wording), next to "in front-lit letters the light passes through the face" (existing). Do front-lit faces use a translucent insert (acrylic?) that should be named? No materials beyond the existing wording are stated.
7. **Depth options:** that custom return depths (beyond "built to your drawings") are possible, as "Custom to project" implies.
8. **What arrives:** limited to pre-wired LED modules and power supplies, a drill template, a wiring plan and crating. The reviewer's "hardware" and "mounting pattern" are not stated anywhere on the site, so they were left out; confirm if mounting hardware ships and whether the drill template is the mounting pattern.
9. **Files:** the page says AI, EPS or PDF vector (the FAQ). Your HubSpot upload field lists CDR, EPS, AI, PDF, PNG and JPG as allowed types. Tell me which files you actually quote from (SVG? DXF? CDR?) and I will update the page and FAQ.
10. **Why-Sunlite benefits:** "Win more jobs", "Handle overflow", "Add specialty capability" are positioning statements, not measurable claims; "we fabricate and pre-wire ... ship it ready to install" restates existing claims. OK to keep as written?

**Carried from Phases 1-2**

11. "100%", "Laser fabrication" and "Many sign companies use Sunlite" were dropped from rewritten sections; "German-engineered" remains in the EdgeLuxe grid copy.
12. "Installation not provided" and "ships nationwide, to project sites by arrangement" wording.
13. Manufacturing page: no stage claims a location; confirm that stays true and which stages the two real photos show (CNC and hand assembly only).
14. Cast acrylic specs were reconciled to LP 11-F brochure data (minimum height 2 in, depths 1.2 in / 1 in, PMS / vinyl / pigmented acrylic); confirm.

## 9. Missing photography and video that would materially improve the site

1. **A real side-profile photograph of a 25-30 mm letter** (slot: `sideProfileMedia` in `data/ultraSlim.ts`); next to a conventional return, this is the single most useful image on the site.
2. **Production stages without media:** LED and electrical, quality control, packaging, ready for freight (replace in `data/production.ts`; photo or compressed video with a poster, no code change). The reviewer's wish for people at work (soldering, checking, measuring, packing) belongs here.
3. **Day and night photos plus a detail shot for 3 to 6 projects** (for the case studies, `content-to-fill/CASE-STUDIES.md`).
4. **One confirmed photo per configuration** (front lit, halo, front + back, trimmed, trimless, raceway, remote) with its depth, finish and mounting, for `data/projects.ts`.
5. A close-up of a trim cap versus a trimless edge.
6. Smaller or converted copies (JPEG/WebP) of the two production PNGs on `/manufacturing`.

## 10. Owner decisions

- **Sample kit ("Request a trade sample"):** not built; there is no evidence on the site that Sunlite ships samples. If you do offer a 25-30 mm sample, say so and I will add a secondary CTA and a request path.
- **`/trade` "Become a trade partner" page:** not built, and no "blind shipping" claim is made (the FAQ only says to ask about white-label / neutral shipping). Decide what you actually offer first; the current `/about` already carries the who-we-serve and trade-only message.
- **Horizontal 8-step production story:** wait for the production shoot. `data/production.ts` already accepts more stages (id, number, title, description, image or video), so adding stages needs no component change.
- **"Specialty Letters" / "Lighting" nav items:** left out; Phase 2's nav stands (Products with four items plus all 12 letter systems and Build Your Sign, Projects, Manufacturing, About).
- **Case-study content:** send back `content-to-fill/CASE-STUDIES.md` (3-6 real projects with photos and permission); the template, routes, sitemap, llms.txt and card links are ready and ship empty.
- **HubSpot portal settings (cannot be done in code):** (a) the form's required fields today are Company name, Email, First name and Last name (the brief's phone, project type and dimension fields are **not** in the form; add them in the portal and make the ones you want optional); (b) add a real dropdown property named `company_type` with exactly these options: Sign Company, Sign Installer, Agency / Broker, Architect / Contractor, Other Trade Professional (the site fills it automatically once it is on the form, and already adds the answer to the message); (c) the submit button text is already "Request Wholesale Pricing" in the portal and the site also sets it; (d) review the thank-you message (24 hours / phone number); (e) add the demo and production domains to the form's allowed domains if you restrict them.
- **Structured-data business type:** `LocalBusiness` with the Tampa address is kept as it was (no business facts changed). If Tampa is mainly an office and sales location rather than where production happens, consider `Organization` (or `Organization` plus a `PostalAddress` without a local-business claim) and keep "nationwide" wording; the site already avoids saying where anything is built.
- **Coolify / demo:** set `VITE_SITE_URL=https://t2wraps.com` and `VITE_NOINDEX=1` as **Build Variables** for the demo, remove `VITE_NOINDEX` and set (or leave) `https://sunlitesigns.com` for production (exact steps in `DEPLOY.md`). Decide apex vs www for production and redirect the other.
- **EdgeLuxe titles:** the 12 system pages have 57-75 character titles (long); shorten them if you care about full display in search results.

## QA record (brief section 23)

- `npm test`: 570 tests, 48 files. `npm run build`: type check + client + SSR + prerender clean (the only warning is the existing 500 KB chunk notice for the lazy configurator and PDF chunks). `npm run verify:prerender`: 22 of 22, also under `VITE_SITE_URL=https://t2wraps.com VITE_NOINDEX=1` and with the variables set to empty strings (what Docker passes when nothing is configured).
- Real-browser sweeps of all 21 prerendered routes plus `/configurator` at 360, 390, 768, 1366 and 1440: no console errors or warnings (apart from third-party and the existing React Router and THREE.js deprecation notices), no failed first-party requests, one H1, no horizontal overflow. Primary CTA in the first screen at 360/390 on home, channel letters, ultra-slim, about, manufacturing, projects (on `/contact` the form starts on the first screen; the submit button naturally sits at the end of the form).
- Quote flow in real Chrome (production build, real HubSpot form, **not submitted**): SVG uploaded in `/configurator`, "Request Wholesale Pricing" clicked, `/contact` showed the configuration card, the message held the full summary, the file `square.svg` was attached to HubSpot's file field, choosing "Sign Installer" prepended "Company type: Sign Installer", and after a reload the card, the company type, the message and the attached file all came back. A scratch `hbspt.forms.create({ submitText })` call confirmed the override reaches the real button.
- Not verified: a Docker image build (daemon not running), real YouTube playback in the hero, Safari or Firefox, real phones (emulated 360/390/768 only), Lighthouse / Core Web Vitals numbers (not measured; structural measures only), an actual HubSpot submission.

## Performance (before and after Phase 3)

| Asset | Before | After |
| --- | --- | --- |
| `index` JS (app shell) | 440.24 kB (134.76 kB gzip) | 456.75 kB (138.79 kB gzip) |
| `index` CSS | 69.00 kB (12.07 kB gzip) | 69.91 kB (12.23 kB gzip) |
| `ConfiguratorPage` JS (lazy) | 1,110.82 kB (307.76 kB gzip) | 1,110.66 kB (307.74 kB gzip) |
| `parsePdf` JS (lazy) | 544.59 kB | 544.59 kB |
| `opentype` JS (lazy) | 243.41 kB | 243.41 kB |
| `dist/` | 13 MB | 13 MB |

The +16 kB (+4 kB gzip) in the app shell is the case-study page, the quote-page additions, the new channel-letter sections and the site-file generators; no dependency was added. Below-the-fold images are lazy (home: 24 of 25; channel letters 6 of 7; ultra-slim 3 of 4; projects all), the hero keeps its poster-first strategy (one eager poster, no iframe in the HTML), and future production video stays behind a poster until played.
