# Project status (2026-10-06)

Live repo: https://github.com/ozzi82/website27 (`master`; `feature/product-taxonomy` and `feature/product-taxonomy-t48v28` are kept identical to it).
Live site: https://sunlitesigns.com, deployed by Coolify on Hetzner (Dockerfile build, nginx), Cloudflare in front. Tests 661, `verify:prerender` 23 checks.

## Where we stopped (end of 2026-10-05) and what is next

### Live and working
- Site on sunlitesigns.com with real robots.txt (Allow + Sitemap), sitemap.xml (21 URLs incl. /configurator), prerendered 404 page (real 404 status;
  old WordPress `/service/*` and `wp-*` return 410), 301s for the old indexed pages with the query string kept (so `gclid` survives), privacy policy page
  (`/privacy-policy`, replaces the old dialog), spec guide PDF at `/sunlite-signs-spec-guide.pdf` (old brochure URL redirects to it), new logo + favicon,
  new trust badge, WhatsApp removed, hero video fix (starts right after first render, fades in on real playback, youtube-nocookie).
- Tracking: GTM container `GTM-M5SPNMN2` is the default in the Dockerfile (off until cookies accepted; Consent Mode v2). GTM version 9 published: Google tag
  `G-JH80L1V5KS` (send_page_view=false), `GA4 - page_view`, `GA4 - HubSpot Form Lead` + `Google Ads - HubSpot Form Conversion` (AW-17981650924, label
  VPj4CMKXl4EcEOzvqP5C) on the custom event `generate_lead`. Verified in GTM Preview and GA4 Realtime. GA4 key events cleaned (only `generate_lead` plus
  Google's lead-stage events). GA4 is linked to Google Ads account 658-218-6711.
- HubSpot quote form `ContactFormQuoteSLS` has hidden fields gclid, gbraid, wbraid, utm_source, utm_medium, utm_campaign (utm_term / utm_content: check). `gclid`
  arrives on the contact (tested); HubSpot also records Original Source "Paid search" and the campaign.

### To do next (in this order)
1. Coolify: redeploy the latest `master` (hero video, query-string-keeping 301s, privacy policy edits are pushed but may not be live yet).
2. Coolify -> application -> Advanced -> Direction: set "Redirect to non-www" (the site currently lands on www; canonicals/sitemap are non-www). Remove any
   Cloudflare redirect rule that points to www. Do NOT add a www redirect in nginx.conf again (it looped).
3. Google Ads (account 658-218-6711), campaign "Sunlite Signs" (Search, $100/day budget, ~$21/day spent, Target CPA, 7 conversions in 30 days; "Sunlite Signs B2B
   Germany" and "Competitors" are paused):
   - Send the ads' Final URLs; change any that point to old WordPress addresses to the new pages.
   - Search terms report (last 30 days): add negative keywords for consumer terms.
   - Conversions: rename "HubSpot-" to "Quote request - website form", value off, count One. "Clicks to call" ($1, every conversion) is Primary and mixes
     into Target CPA: take it out of bidding (the UI would not offer Secondary; look at Edit goal). Remove the stale "Sunlite Signs Germany (web) form_submit".
     The old 113 conversions are historical (an old trigger on `conversion` re-fired itself).
   - Enhanced conversions for leads (Goals -> Settings), using Google Tag Manager.
   - Do not change budget / bid strategy yet.
4. Search Console (property sunlitesigns.com, already verified; sitemap submitted, 21 pages): Removals -> temporarily remove
   `www.sunlitesigns.com/service/making-logo-banner/` and `/service/color-contrast-view/` (lorem ipsum pages; now 410). Send the last 2 of the 12 indexed
   URLs (page 2 of the list) so any needed 301s can be added. Not-indexed items are old WordPress internals; nothing to do.
5. HubSpot: add `utm_term` and `utm_content` hidden fields if missing; delete the test contacts.
6. Privacy policy: have a lawyer read it (placeholders to confirm: postal address, email / file-sharing providers, GA4 retention period). Update the
   page whenever a service is added (it now names HubSpot, Google Tag Manager / Analytics / Ads incl. remarketing, Cloudflare, YouTube).
7. Photos still to add when sent as files: nothing pending (custom fabrication, Olympus, MACS, hockey display, manufacturing stages are in).
8. Open question from the owner: show only the supported mounts (stand-off only vs flush) on each product page instead of both diagrams (recommended).
9. The brochure PDF (`public/sunlite-signs-spec-guide.pdf`) still shows the UL mark and 3-year warranty on LP 1, which the website no longer claims for LP 1.

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

- 2026-10-05 (3): product card pictures open the detail page; "Build in 3D" beside the quote button on every detail page; configurator: Size and mounting
  block (depth, mounting, lighting, build) highlighted, bigger Upload logo / Type text toggle and text field; PDF reader now ships its worker inside its own chunk
  (no separate .mjs file from the host), unknown read errors show the error type and log the detail to the console. If a PDF still fails on the live site, open
  the browser console (F12) and send the "Artwork could not be read" line.

- 2026-10-05 (4): company type removed from the quote page and form; a JPG picture of the configuration (preview + all choices + disclaimer) is attached to the
  HubSpot form next to the artwork file or text SVG (artwork first; the HubSpot file field must allow several files, otherwise HubSpot may keep only the first);
  HubSpot live chat wiring (docs/LIVE-CHAT.md); thin-stroke notice inside the preview.

- 2026-10-05 (5): Dockerfile build args for the Google IDs (DEPLOY.md); 301 redirects for the old WordPress sunlitesigns.com URLs found indexed; Facebook `sameAs`;
  configurator usage events (artwork, system, option, quote click); docs/SEO-AND-AI-VISIBILITY.md and the measurement table in docs/ANALYTICS-PLAN.md.
  IMPORTANT before launch: sunlitesigns.com is already live with the old site; export ALL its URLs and redirect every one (see SEO doc).

- 2026-10-05 (6): UL mark (owner SVG, `public/images/ul-mark.svg`) beside "UL 48 Listed" in the capability strip and in the footer. Confirm with UL that this mark may be used.
  The current domain (t2wraps.com) is the test site; production moves to sunlitesigns.com (see docs/SEO-AND-AI-VISIBILITY.md and DEPLOY.md cut-over).

## Owner confirmations still open
- UL mark: used on the site (capability strip, footer, product and system pages, contact page); confirm with UL that this use is allowed.
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
