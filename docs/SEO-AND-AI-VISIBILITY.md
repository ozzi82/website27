# Visibility on Google and in AI answers (check of 2026-10-05)

Method and limits: a handful of web searches run from this environment, plus the search tool's own AI summaries. This is a
snapshot, not a ranking report: positions vary by location, device and day. Real numbers come from Google Search Console and
Bing Webmaster Tools (set up below). The new site could not be fetched from here (blocked), so nothing here measures it.

## What the check showed
- **The brand is found.** Searching "Sunlite Signs" / "Sunlite Signs LLC Tampa" returns the existing site `www.sunlitesigns.com`
  (home, channel letters, Profile 11 slim letters, push-through lightboxes, contact, privacy), plus a Facebook page, LinkedIn,
  the Tri-State Sign Association directory, RocketReach and Sunbiz entries.
- **Generic searches do not find Sunlite.** For "wholesale channel letters manufacturer", "ultra slim / trimless channel letters
  wholesale" and "cast acrylic block letters LED wholesale", the first results are competitors (ChannelLetter.com, World Wide
  Sign Systems, ESCO, Direct Sign Wholesale, IS LED Sign, Signs at Wholesale, Lindo Signage and others). Sunlite did not appear
  in the first page of any of those. That is where the ads and the new site have to win.
- **What AI summaries say today comes from the OLD website** (and directories): "German-engineered", "wholesale only", "UL-listed",
  "48-hour quote, 4-week delivery", Profile 11 letters, push-through lightboxes. So AI tools already know the brand a little,
  from outdated copy. The new copy (24 to 48 hours, most times 24; ultra-slim LP 11; trimless; custom fabrication) will only be
  picked up after the new site is live, crawled and the old URLs redirect.

## Must do at launch (protects what already ranks)
1. **301 redirects for every old URL.** Added in code for the five found today (`/channel-letters/`, `/profile-11-slim-letters/`,
   `/lightbox-push-through-letters/`, `/contact-sunlite-signs-llc/`, `/privacy-policy/`). Export the full list from the old site
   (its `/sitemap_index.xml`, or Search Console > Pages) and add every other URL to `LEGACY_PAGE_REDIRECTS`,
   `public/_redirects` and `nginx.conf`. Anything missing becomes a 404 and loses its ranking.
2. **Keep the host Google already uses.** The old site is indexed as `https://www.sunlitesigns.com`. Set `VITE_SITE_URL=https://www.sunlitesigns.com`
   for production (the code default is the bare domain) and redirect the bare domain to `www`, so canonicals and the sitemap match the
   indexed URLs.
3. **Search Console + Bing Webmaster Tools** for `sunlitesigns.com` (domain property): verify, submit `sitemap.xml`, use
   "Change of address"/URL inspection after launch. Bing matters: ChatGPT search and Copilot lean on Bing's index.
4. **Turn off noindex** (`VITE_NOINDEX` unset) on the production build only.
5. Update the profiles that still say "48 hours / 4 weeks" or old product names: Facebook, LinkedIn, Tri-State Sign Association,
   Google Business Profile (service-area business, address hidden: it is a mailbox), RocketReach/Crunchbase-style listings.

## Win the generic searches (Google)
- One landing page per intent, each with a unique title/H1 and the plain words buyers type: "wholesale channel letters for sign
  companies" (classic page), "ultra-slim / trimless channel letters wholesale" (ultra-slim page), "cast acrylic block letters"
  (inside ultra-slim), "flat cut out letters wholesale", "custom sign fabrication, blade signs, push-through cabinets"
  (custom page). Already the structure of the new site; check titles against real queries in Search Console after two weeks.
- Content competitors rank with and we lack: a **pricing/lead-time page** (what affects price, typical lead time), **how to
  order / file requirements**, **trimless vs trim-cap explained**, **how to choose LED color temperature**, **mounting
  (flush vs stand-off) guide**, **UL 48 explained for sign companies**, **wholesale terms (resale certificate, net terms,
  shipping)**, project case studies with photos. Each is a page that can rank and that AI tools can cite.
- **Real photos and video** (the site still has placeholders): Google Images and YouTube are major discovery paths for signs.
- **Reviews and proof**: Google Business Profile reviews, trade-association membership, named projects (with permission).
- **Backlinks**: trade associations (ISA, state sign associations, Tri-State), supplier/manufacturer "where to buy" pages,
  sign-industry press and forums, a LinkedIn page that links to the site. A few relevant links beat many weak ones.
- Technical: pages are prerendered and fast; structured data (LocalBusiness, Product, FAQ) exists; add `sameAs` links
  (Facebook added; add the LinkedIn company page), image alt text everywhere, one canonical host, no duplicate old/new pages.

## Win in AI answers (ChatGPT, Gemini, Perplexity, Copilot, AI Overviews)
AI tools quote pages that state facts plainly and that other sites confirm.
- **Already in place**: prerendered HTML (no JavaScript needed), `llms.txt`, structured data, one fact per sentence on product pages.
- **Keep facts identical everywhere** (site, LinkedIn, Facebook, directories): who you sell to (trade only), products, UL 48 listed,
  24 to 48 hour quotes, 3-year warranty on LED modules and power supplies, German engineered. Conflicting numbers make AI hedge or skip.
- **Write citable pages**: short definitions ("What is a trimless channel letter?"), spec tables, comparison tables
  (flush vs stand-off, face-lit vs halo-lit), FAQs with direct answers, dated "last updated".
- **Allow the crawlers**: `robots.txt` allows everything (including GPTBot, Google-Extended, PerplexityBot, ClaudeBot). Keep it so.
  The sitemap should list every page (still missing: `/configurator`, add if wanted).
- **Be mentioned elsewhere**: AI tools weigh third-party mentions (directories, forums such as Reddit r/signmaking and sign-industry
  groups, press, YouTube). Answer real questions there honestly, with the site as the source.
- **Measure**: monthly, ask 10 fixed buyer questions in ChatGPT, Gemini, Perplexity and Google (AI Overviews) and note whether
  Sunlite is named or linked; in GA4, create a channel group for referrals from `chatgpt.com`, `perplexity.ai`, `gemini.google.com`,
  `copilot.microsoft.com`. Tools like Semrush/Ahrefs "AI visibility" or free Bing Webmaster AI/Copilot reports can automate this.

## 30 / 60 / 90 days
- Before launch: redirects complete, host decision, Search Console and Bing verified, profiles updated, GTM live, noindex off.
- Day 0 to 30: submit sitemap, inspect key URLs, fix crawl errors, publish 3 guide pages and real photos, claim Google Business Profile.
- Day 30 to 60: read Search Console queries, rewrite titles/H1s for the queries with impressions and no clicks, publish 2 case studies,
  collect 5 reviews, 5 relevant backlinks.
- Day 60 to 90: compare ads vs organic leads (GA4 + HubSpot), double down on the queries that convert, repeat the AI check.
