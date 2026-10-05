# Go-live, step by step

Do these in order. Each step is small and has one way to check it worked. Details live in `LAUNCH-CHECKLIST.md`,
`ANALYTICS-PLAN.md` and `SEO-AND-AI-VISIBILITY.md`.

## Step 1. Deploy the real domain
- Coolify: build arguments `VITE_SITE_URL=https://sunlitesigns.com`, no `VITE_NOINDEX`, then the Google IDs when you have them
  (`VITE_GTM_ID`, `VITE_GA4_ID`, `VITE_GOOGLE_ADS_ID`, `VITE_GOOGLE_ADS_LEAD_LABEL`). Redeploy from `master`.
- Check: `https://sunlitesigns.com/robots.txt` shows `Allow: /` and a `Sitemap:` line; `/sitemap.xml` lists the pages;
  a made-up address such as `/abc` shows the "Page not found" page (and the browser's network tab says status 404).

## Step 2. Clean up what Google remembers (301 and 404)
- A **301** is a permanent redirect: "this old address now lives at that new address". Google moves the old page's ranking to the
  new page and drops the old one. Old pages that have a matching new page get a 301 (`nginx.conf`, `public/_redirects`,
  `src/lib/routes.ts`, kept identical by a test).
- Old pages with **no** equivalent (lorem ipsum, test or demo pages): do not redirect them to the homepage. Let them return a
  real **404** (done: unknown addresses now answer 404 with a friendly page) and ask Google to forget them in Search Console.
- To list what Google has: Search Console, Pages report, "Why pages aren't indexed" and the indexed list; also Google for
  `site:sunlitesigns.com`. Send me the old addresses and I add the 301s.

## Step 3. Google Search Console
- Add `https://sunlitesigns.com` as a Domain property, verify through DNS.
- Sitemaps: submit `https://sunlitesigns.com/sitemap.xml`.
- URL inspection: request indexing for the homepage and the three product pages.
- Removals: temporarily remove any junk URLs that now return 404.

## Step 4. Analytics and ads
- GA4 property and web data stream, then a GTM container; put the IDs into the Coolify build arguments (Step 1) and redeploy.
- Google Ads account, a conversion action for "quote request", its label into `VITE_GOOGLE_ADS_LEAD_LABEL`.
- HubSpot form: add hidden fields `gclid`, `utm_source`, `utm_medium`, `utm_campaign` (see `ANALYTICS-PLAN.md`).
- Check: GTM preview mode and GA4 Realtime show your own visit after you accept the cookie banner.

## Step 5. Before spending on ads
- Send a test quote from the contact page and from the configurator; confirm it reaches HubSpot with the attachment.
- Confirm the conversion shows in Google Ads (it can take a few hours).
- Legal pages review and the open owner confirmations in `STATUS.md`.
