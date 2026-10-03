# Project status (2026-10-02)

Live repo: https://github.com/ozzi82/website27 (`master`). Target domain: sunlitesigns.com (not deployed yet; see DEPLOY.md).

## Done
- Softer design, SEO and AI-visibility pass (per-page meta, JSON-LD, sitemap, llms.txt, robots).
- 12 real EdgeLuxe configurations from the brochure: `src/data/configurations.ts` is the single source of truth.
- 3D configurator at `/configurator`: SVG/PDF upload or typed text (8 bundled fonts), 12 configurations, depth,
  paint and glow color, LED dimmer, Day|Night fade, backgrounds, orbit/zoom, compact layout,
  thin-stroke warnings, and Get a Quote carrying the configuration and artwork file into the HubSpot form.
- 399 tests pass. `npm run dev:lan` serves the dev build on the local network.

## Next
- Test one real HubSpot submission with an SVG attachment (SVG is not in the field's allowed-types text).
- Live chat / messaging beyond WhatsApp (recommended: HubSpot chat + booking button + SMS link).
- Reconcile `src/data/services.ts` with the brochure (Trimless depth, placeholder letter height, colors).
- Replace the placeholder gallery with the brochure's project photos.
- Prerender pages for non-JS crawlers; deploy to the domain; Search Console and Bing.
- Real-device testing of the configurator (only software WebGL tested so far).

## Known small issues
- Nav "Get a Quote" does not carry the configuration (only the configurator's button does).
- Mobile: sticky quote button overlaps the Background row at the end of the page.
- PDF import is limited (overlapping shapes extrude as stacked solids; stroke-only art and images are skipped).

Design/spec history: `docs/superpowers/specs/2026-10-01-sign-configurator-design.md` (Revisions 2-6 at the end).
