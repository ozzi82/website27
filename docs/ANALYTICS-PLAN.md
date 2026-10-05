# Analytics and Google Ads plan

Goal: when the ads start, every lead can be traced to the ad, keyword and campaign that produced it, and Google Ads can
learn from real leads (not only clicks).

## What is built (code)
- `src/lib/tracking.ts`: Google Consent Mode v2 (all storage denied until the cookie banner is accepted), Google Tag Manager
  or direct gtag loading, `dataLayer` events, ad click / UTM capture.
- `src/components/CookieBanner.tsx` + footer "Cookie settings": the cookie note and the consent switch.
- Events already sent: `page_view` (every route change), `generate_lead` (quote form submitted, with
  `has_configurator_quote`), `click_to_call`, `click_email`, `configurator_quote_click`.
- Ad tags (gclid, gbraid, wbraid, msclkid, utm_source/medium/campaign/term/content) are kept for the visit and written
  into hidden HubSpot form fields of the same names (see "HubSpot" below).

## The IDs to fill in (build-time environment variables)
| Variable | Example | Needed for |
|---|---|---|
| `VITE_GTM_ID` | `GTM-XXXXXXX` | Recommended: one container, tags managed without code changes |
| `VITE_GA4_ID` | `G-XXXXXXXXXX` | Only if you do NOT use GTM |
| `VITE_GOOGLE_ADS_ID` | `AW-123456789` | Only if you do NOT use GTM |
| `VITE_GOOGLE_ADS_LEAD_LABEL` | `AbC-D_efG-h12` | Only if you do NOT use GTM |

Set them where the site is built (Docker build args / host environment), rebuild, deploy. With nothing set no Google script
is loaded at all.

## Recommended setup (about two hours)
1. Create a GA4 property and a Google Tag Manager container (same Google account as Google Ads).
2. In GTM: a **Google tag** (GA4 ID) firing on All Pages with "send page view" OFF, plus a **GA4 event tag** on the custom event
   `page_view` (parameters page_path, page_location, page_title). Enable Consent Mode in the tag settings (the code already
   sets the defaults).
3. GTM trigger "Custom event = generate_lead" -> **GA4 event `generate_lead`** and a **Google Ads Conversion** tag (conversion ID
   and label from Ads > Goals > Conversions > New > Website). Mark `generate_lead` as a key event in GA4 and import it into
   Ads (or use the Ads tag directly, not both, or leads count twice).
4. Secondary conversions (observe only, not for bidding): `click_to_call`, `click_email`,
   `configurator_quote_click`.
5. Turn on **Enhanced conversions for leads** in Ads (uses the hashed email from the form, helps when cookies are declined).
6. Link GA4 <-> Google Ads, and Search Console <-> GA4.
7. HubSpot: add hidden fields to the quote form named exactly `gclid`, `gbraid`, `wbraid`, `utm_source`, `utm_medium`,
   `utm_campaign`, `utm_term`, `utm_content`. Then import **offline conversions** (HubSpot's Google Ads integration, or the
   manual gclid upload): the sales stages "qualified" and "won" go back to Google so it bids for real customers. This is the
   single biggest lever for B2B ads.
8. Test with GTM Preview + Google Tag Assistant, then a real test lead; check that `gclid` arrives in HubSpot.

## Beyond the snippet: what to do before spending money
- **Conversion definition**: one primary conversion (quote request). Do not count page views or clicks as conversions.
- **Landing pages**: send ads to the matching page (ultra-slim page for ultra-slim keywords, classic page for channel
  letters, the contact page for "wholesale" intent), not the homepage. Keep the form one scroll away; the Request Wholesale
  Pricing button is already on every page.
- **Trade-only targeting**: keywords with "wholesale", "manufacturer", "for sign companies", "trade"; negative keywords
  "cheap", "DIY", "install", "near me" retail terms, "jobs". Say "trade only" in ad copy so consumers do not click.
- **Geo**: United States only. That also keeps most GDPR exposure away.
- **Call tracking**: a Google forwarding number (call extension / call asset) reports real calls; the site already reports taps
  on the phone link. For a US number consider a call-tracking number only if you use call ads.
- **Speed and quality score**: run PageSpeed Insights on the five landing pages and fix red items (the hero video is already
  delayed; images are WebP/JPEG sized). Core Web Vitals feed the ad landing-page experience score.
- **Search Console + Bing Webmaster Tools**: verify the domain, submit `sitemap.xml` (`/configurator` is not in it).
- **Heatmaps / recordings (optional)**: Microsoft Clarity is free; add it as a GTM tag behind the same consent.
- **Weekly report**: GA4 Explorations + the Google Ads search-terms report; keep a changelog of campaign edits.
- **Do not use** call-only or display remarketing until the privacy policy is reviewed for it (see LAUNCH-CHECKLIST).

## What you can see once it is set up (answering "what do people look at, do they use the configurator, do ads convert")
| Question | Where | How |
|---|---|---|
| Which pages people view, how long, from where | GA4 > Reports > Engagement > Pages, Acquisition > Traffic acquisition | Automatic (`page_view` is sent on every route change; engagement time is built into GA4) |
| How far they scroll, outbound and file clicks | GA4 | Turn on Enhanced Measurement (default) |
| Heatmaps and session recordings | **Microsoft Clarity** (free) | In GTM add a Custom HTML tag with Clarity's snippet, trigger after consent; shows clicks, scroll depth, rage clicks, recordings |
| Do they use the configurator | GA4 > Explore > Funnel exploration | Events sent: `page_view` of `/configurator`, `configurator_artwork` (source text or upload: a sign was actually built), `configurator_system` (which letter system), `configurator_option` (option, value: day/night, mounting, depth, glow colour, finish...), `configurator_quote_click` (asked for a quote), `generate_lead` |
| Which systems / options are popular | GA4 > Explore > Free form, break down by event parameter | Register `configuration`, `option`, `value`, `source` as custom dimensions (Admin > Custom definitions) |
| Phone, email, chat use | GA4 events | `click_to_call`, `click_email`, `chat_started` |
| Do ads produce submissions | Google Ads > Goals/Conversions, GA4 > Advertising | The `generate_lead` conversion in Ads (see steps 3 and 5 above); compare conversions per campaign, ad group and keyword |
| Which ad / keyword produced which lead, and whether it became a customer | HubSpot contact record | `gclid` and `utm_*` land in hidden form fields; qualified and won deals go back to Ads as offline conversions |
| How visible on Google | Search Console > Performance (queries, impressions, clicks, position) | Verify the domain property; check weekly |

Funnel to build in GA4: `/configurator` view -> `configurator_artwork` -> `configurator_quote_click` -> `generate_lead`. The drop
between steps shows where the configurator loses people.
