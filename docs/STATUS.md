# Project status (2026-10-06, updated at the end of the day)

Live repo: https://github.com/ozzi82/website27 (`master`; `feature/product-taxonomy` and `feature/product-taxonomy-t48v28` are kept identical to it).
Live site: https://sunlitesigns.com, deployed by Coolify on Hetzner (Dockerfile build, nginx), Cloudflare in front. Tests 682, `verify:prerender` 23 checks.

## End of 2026-10-06 (latest)

### Done today
- **"See it on the building!"** (configurator): full-screen 18 s film of the customer's sign at the entrance of a procedural glass tower: 15 s sunny day -> sunset -> dusk -> night (moon, stars, windows lighting up one by one, sign switching on slowly), then a 3 s zoom so the sign fills 60% of the screen. Play/pause, slider, orbit when stopped, "Download this picture" (1600 px JPEG), reduced-motion starts on the finished night picture, phones back the camera off. Files: `BuildingView.tsx`, `BuildingScene.tsx`, `buildingTime.ts` (pure, tested). Not done: attaching the dusk picture to the quote. The sign is drawn at the default 100 in width until the real-size input exists.
- Trust badge on the home page has a transparent background (files renamed to `trust-badge-clear*.webp` to defeat Cloudflare/browser caches). The badge text and the copy beside it still say "UL 48 listed" (we removed UL claims from LP 1): owner to decide.
- **Repo is private.** Coolify's GitHub App (`puzzled-peccary-ojjad3o8d8sibf`, installation 168566435) must have `website27` in its repository list (github.com/settings/installations/168566435) or deploys fail with "Repository not found". Check that the last Coolify deploy finished after that was fixed. Remove unused GitHub Apps (Netlify, Vercel, Lovable, TinaCloud, Builder.io); accept the pending permission request for the Claude app.
- **Backups:** `docs/backup-website27.bat` (OneDrive): mirror clone + dated `.bundle` + a plain `website27-files` folder + push of branches/tags to the private `ozzi82/website27-backup`. The owner ran it once and the backup repo has master and both feature branches. Pushing to the backup repo from the cloud session fails (403 / index-pack failed), so the backup is only updated by the .bat (or a GitHub Action with a token, not written yet). In the backup repo set the default branch to `master` and delete the placeholder `main` branch.

- **Image speed (2026-10-07):** every JPEG/PNG under `public/images` has WebP copies at 480/960/1600 px (`-480w.webp` etc., made by `node scripts/optimize-images.mjs`, which also writes `src/data/image-manifest.json`). The `<Picture>` component (`src/components/Picture.tsx`) offers them with `srcset`/`sizes` and sets width/height from the manifest; all content images use it. Run the script after adding or replacing a photo and commit the output (the Docker build does not run it; needs ImageMagick with WebP). nginx now caches `/images/`, `/videos/`, `/configurator/` for 30 days. Measured on a phone-sized browser: Projects page images 4.2 MB -> 0.5 MB, home 2.6 MB -> 0.5 MB. Not done: the 2.4 MB hero video (largest remaining download on a phone).
- **Page speed, second pass (2026-10-07):** a local Lighthouse mobile run found three.js (about 370 KB) inside the main JS bundle, because `backgrounds.ts` imported it; the wall-colour helpers moved to `wallLook.ts` so only the configurator loads three.js (main bundle 920 KB -> 535 KB). The Google Fonts `@import` (render-blocking) was replaced by self-hosted @fontsource fonts (latin subset), with the two main fonts preloaded in every prerendered page (`scripts/prerender.mjs`). Local Lighthouse mobile (simulated slow 4G, slow CPU): score 0.57 -> 0.90, total blocking time 1,000 ms -> 100 ms, LCP 3.8 s -> 3.1 s, CLS 0. Re-test on pagespeed.web.dev after the Coolify deploy.

- **Google tags deferred (2026-10-07):** the real PageSpeed treemap showed about 500 KB of Google scripts (GTM 148 KB, Google tag 195 KB, Ads tag 160 KB) plus the Cloudflare beacon (10 KB) as most of the page's script weight. GTM (`gtm.js`) now loads on the visitor's first touch / scroll / key / click / mouse move, or 8 s after the page finished loading (`onFirstInteraction` in `src/lib/tracking.ts`); events pushed before that wait in the dataLayer and are processed when GTM arrives. Consent defaults (all denied) are still set at once. To disable the Cloudflare beacon: Cloudflare -> Analytics & Logs -> Web Analytics -> remove the site (or turn off automatic setup). Verify in GTM Preview / GA4 Realtime that page views and `generate_lead` still arrive after the next deploy.

- **True scale (2026-10-07):** the configurator has a Size row (width and height in inches, both editable, presets 24/48/100/200, 6-600 in). Default 100 in along the artwork's larger side. The scene is still normalised to 2.4 units across (camera, lights and wall unchanged); what changes is `mmPerUnit(sizeIn)` in `src/components/configurator/realSize.ts`. Depth, standoff, the lit band, spacers, the neon rounding, the halo's reach and the wall texture size are now real millimetres converted at that size (`renderMath.ts`, `useSignGeometry.ts`, `ConfigScene.tsx`), so a 12 in sign has deep-looking letters and a 300 in one thin ones. The thin-stroke note is exact (stroke ratio x real height against the configuration's minimum). The quote summary gets a "Size" row; deep link `?size=<inches>`; the building view draws the sign at its true size. Default look is a little thinner than before (30 mm is now truly 30 mm). Next in step 1: materials (acrylic light-piping, brushed stainless, clear coat), contact shadows, better wall textures, colour accuracy, tuned against the factory photos the owner sent (`sample-photos.zip`: LP 3.1, 3.2, 5, 11-FS, 11-S/11-B, lit and unlit).

- **Realism round 1 (2026-10-07):** compared the preview with the owner's factory photos (LP 3.1, 3.2, 5, 11-FS, 11-B/S, lit and unlit; kept outside the repo). Fixed: LED whites look like the real thing (3000/4000/5000 K swatches are no longer orange: `swatches.ts`), halo reach cut to a real few inches and brighter near the letter (`WALL_SPILL` in `ConfigScene.tsx`, sharper `haloTexture.ts`), bloom reduced so face-lit letters are crisp (`NIGHT_BLOOM` 0.35), LP 3.2 / flush side-lit rim is clearly visible. Still to do (round 2): satin/brushed metal and clear-coat paint, contact shadows and soft occlusion on the wall, acrylic edge glow, real wall photos.

### Price estimator (see `docs/estimator/README.md`, private notes with the owner's supplier prices)
Blind-test sessions on 9 China quotes. Tentative rules: stainless channel ~ $970-990 per m² of face area; 30 mm acrylic ~ $1,460 per m² + ~$26 per piece; freight ~ $20-25 per kg of estimated weight (floor ~$150-230). Tomorrow: more samples (blind), then the internal configurator (private app, rates never in the public bundle), after the real-size input in the configurator. Ask the owner before uploading anything.

### Still open from earlier (see the 2026-10-05 list below)
Coolify "Redirect to non-www", Google Ads clean-up (Final URLs, search terms, conversions, enhanced conversions), Search Console removals, HubSpot utm_term/utm_content, privacy policy review, the mounts-per-product question, brochure PDF UL/warranty on LP 1, whether to add "10 mm acrylic face" to the LP 5 page, project 16 on the projects page.

## Where we stopped (end of 2026-10-05) and what is next

### Live and working
- Site on sunlitesigns.com with real robots.txt (Allow + Sitemap), sitemap.xml (21 URLs incl. /configurator), prerendered 404 page (real 404 status;
  old WordPress `/service/*` and `wp-*` return 410), 301s for the old indexed pages with the query string kept (so `gclid` survives), privacy policy page
  (`/privacy-policy`, replaces the old dialog), spec guide PDF at `/sunlite-signs-spec-guide.pdf` (old brochure URL redirects to it), new logo + favicon,
  new trust badge, WhatsApp removed, homepage background is now a self-hosted 19 s silent loop (`public/videos/hero-loop.mp4`, 2.4 MB, cut from the owner's brand video; the poster is its first frame). The YouTube embed is gone. The owner's "Vertical.mp4" is not a real portrait video (1080x720 with white bars), so it is not used; phones play the same loop, cropped.
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
- 2026-10-06: LP 11-N no longer offers Lobster; "Neon Script" is now Yellowtail (a bolder script, stroke about 11% of the height instead of 4.7% for Sacramento), so the default SUNLITE sign no longer triggers the thin-stroke notice on LP 11-N / 11-C. Sacramento was removed from the dependencies.
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

## Realism round 2 (shadows)
- Sign now casts a soft contact shadow on the wall (directional light shadow map 2048, bias -0.0004).
- Still open: satin/brushed metal and clear-coat tuning, acrylic edge glow, wall photo textures (need owner photos of white boards / concrete).

## Visible photos (round 1)
- Home: new PhotoStrip (6 real installed signs) under the capability strip; process steps carry line illustrations (components/home/ProcessIllustration.tsx), not photos.
- Ideas not yet done: day/night pairs on product cards, full-bleed photo bands, visible galleries, projects wall, team/shipping photos (need owner photos).

## Hi-res render (realism step 3)
- Preview toolbar has a Download image button: re-renders the current view at ~2800 px (HiResBridge in SignPreview.tsx) and saves a JPEG named sunlite-sign-day/night.jpg. Shadow edges are still slightly soft-blocky at that size (shadow map 2048): bump to 4096 for the capture if it bothers anyone.
- Realism round 2: paint is less metallic with a clear-coat; day environment brighter (nightFade DAY).

## See it on your own building (realism step 2)
- Configurator button "See it on your own building" opens PhotoView (lazy). The visitor's photo is read in the browser only (never uploaded), drawn as the wall in a normal r3f scene, with the sign in front: same materials, glow, bloom and shadow as the main preview.
- Day/Night, drag to place, Angle (yaw) and Tilt (roll), Download picture (2000 px JPEG).
- "Set true size": tap two ends of something of known length, type its length in inches; the sign is then drawn at its real size on the photo (photoMath.ts). Without it the visitor sizes by eye (slider).
- photoTone.ts bakes the photo through the inverse ACES curve so the composer's tone mapper leaves the photo's colours alone in day mode; night dims/cools the photo plane.
- Not done: perspective from a measured plane (only an Angle slider), automatic wall/horizon detection, saving the composite with the quote.

## Round 3 (owner feedback)
- LP 11-FB: restrained halo (tight spread) and lower bloom so the face glow and halo no longer smear into a blur.
- LP 11-FS: new "Vinyl" colour row; default red vinyl on the lit face (glow comes through the front, white edge band stays), state.faceVinyl / hasFaceVinyl in types.ts. Included in the quote summary.
- Brushed steel (LP 1): new anisotropic grain texture, brighter base, less mirror-like.
- Depth now above Size in the options. Download image is a labelled pill at the preview's bottom right.
- Home: photo strip is now a swipeable, auto-advancing carousel under the trust bar. Added projects: heller, Shake It Up, Arch logo (photos 91-93, EXIF rotation baked in). No systems/depth recorded for them.
- docs/CONFIGURATOR-ANALYTICS.md: how to count configurator users in GA4 (consented visitors only).
- Photos sent inline mid-turn (Fan Store x2, A1 round sign, element, sun logo, Baxter) did not arrive as files: re-attach them to add.
- NOTE: `npx tsc --noEmit -p .` does not typecheck src (project references); the gate is `npm run build`.

## Round 4
- LP 1: brushed steel now has fine vertical grain on light silver (matches the owner's reference swatch); mirror gold and new mirror rose gold use a smooth gradient studio (getMirrorEnvironment) so they read as polished mirror, not striped/brushed.
- "See it on your own building" button removed from the configurator for now (PhotoView.tsx, PhotoScene.tsx, photoMath.ts, photoTone.ts stay in the repo, unused, to pick up later).

## Home product tiles
- Products section: restored to the original featured card plus three rows (the owner wanted the trust bar and photo strip changed, not the products).

## Configurator app layout
- Options are now tabs (Text, Size, Colour, Light, Look) in ConfiguratorPanel.tsx; ConfigControls takes a `group` prop that renders only that tab's controls. All tabs stay mounted (inactive ones hidden by CSS).
- Desktop (lg+): no tabs: every section stacked in the side column (scrolls), Get a Quote pinned under it. (Owner disliked the tabbed desktop version.)
- Tablet / phone: preview fills the screen; controls open as a short sheet under it, tab bar at the bottom with the quote button beside it (icons only on phones); tapping the active tab folds the sheet away.
- Day/night, background and "See it on the building" are in the Look tab.

## Configurator desktop spacing pass
- Desktop: options column widened (560 px, 620 px on xl) with section headings (Your artwork, Size and build, Colour and finish, Lighting); background and day/night moved out of it into a scene strip under a shorter preview (useDesktop.ts decides, so the Look tab only exists on tablet/phone).

## Configurator redesign toward the owner's dark mockups
- Brushed stainless is now a paint choice (BRUSHED_HEX in swatches.ts, BrushedMaterial in SceneMaterials.tsx; horizontal fine grain, default on stainless-steel families, falls back on other families).
- Desktop: "Your sign" panel (collapsible sections), text box + font dropdown side by side, bigger swatches with the selected name, sign-type dropdown on the preview, floating bar (Day/Night + wall-material circles), slim summary strip with the disclaimer, vignette on the preview.
- Not done: photo-real render button (see conversation), Save design.
- Home photo strip: separated from the trust bar (own section with a 'Recent installs' label, rounded photos with gaps, faded edges, slow drift).

## Configurator light redesign (owner's white mockup, brand colours)
- The configurator is a light, app-like surface: own slim header (logo, 3D Configurator, phone, Back to website), no site header/footer, `.cfg-light` token set in index.css (navy --primary for text/selected controls, orange --brand only for the main button, selected swatches and sliders).
- Desktop: big preview with sign-type dropdown and a floating bar (Day/Night, wall material, Reset, zoom), current-configuration card with a thumbnail under it, grey "Make it yours" panel (Your artwork, Size and build, Colour and finish, Lighting), Preview on a building + orange Request wholesale pricing.
- Tablet/phone: same light styling, preview on top, bottom tab bar.
- The face-vinyl option (LP 11-FS) was removed (confusing; a coloured vinyl never matched a different glow colour).

## Configurator: dark, and only full-screen once a product is picked
- /configurator (Build your sign) shows the chooser in the normal site design (site header and footer). Picking a product opens the full-screen configurator: the site header/footer are hidden via `html.cfg-app [data-site-chrome]` (set by AppChrome in ConfiguratorPage) and the slim ConfiguratorHeader takes over. The light token set (.cfg-light) is unused for now; the configurator uses the site's dark colours.

## Round 5
- Configurator panel made more compact: smaller type and spacing; Size, then Depth and Mounting side by side as short controls.
- Home: four product cards of one size, each with a short photo and a solid orange button (first keeps the Signature product label).
- Contact page: removed "most quotes are returned within 24 hours" (intro and meta description). It is still on the home trust bar, the three product pages and the FAQ: say if those should go too.
- Home: removed the LP 11 series row of eight variant cards from the ultra-slim section (they remain on the ultra-slim page).

## Upload logo inside the configurator
- Choosing Upload logo now stays in the full-screen configurator: a dashed drop box in the Your artwork section (UploadDropzone compact), the preview shows an empty wall until a file is parsed, then the sign. Formats are still vector only (SVG, PDF, AI); PNG/JPG would need tracing, not built.

## Photo render (realism step 3, option 1: path tracing in the browser)
- "Photo render" button on the preview (next to Download image) opens PhotoRender (lazy chunk, ~220 KB, loads only on click): the current sign and view are rebuilt from plain physical materials (PathTraceScene) and path traced on the visitor's graphics card with three-gpu-pathtracer (WebGLPathTracer, deprecated upstream in favour of WebGPU but works in every WebGL 2 browser). Stops by itself at 320 samples (TARGET_SAMPLES), "Stop here" any time, Download picture saves the canvas as JPEG. Nothing is uploaded.
- Needs WebGL 2 + EXT_color_buffer_float (canPathTrace); otherwise a friendly message.
- Approximations: halo is an emissive plane with the same blurred silhouette as the live preview; side-lit letters glow on the whole side at night; the brushed finish, wall texture and studio HDR are the live ones.
- package.json: three-gpu-pathtracer, three-mesh-bvh (override pinned to the direct dependency), xatlas-web (peer).
- Could only be tested here on a CPU software renderer (about 1 sample per second at 486x272): works, but real speed and look on a GPU are untested.
