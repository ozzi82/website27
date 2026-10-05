# Analytics and Google Ads plan

Goal: when the ads start, every lead can be traced to the ad, keyword and campaign that produced it, and Google Ads can
learn from real leads (not only clicks).

## What is built (code)
- `src/lib/tracking.ts`: Google Consent Mode v2 (all storage denied until the cookie banner is accepted), Google Tag Manager
  or direct gtag loading, `dataLayer` events, ad click / UTM capture.
- `src/components/CookieBanner.tsx` + footer "Cookie settings": the cookie note and the consent switch.
- Events already sent: `page_view` (every route change), `generate_lead` (quote form submitted, with
  `has_configurator_quote`), `click_to_call`, `click_email`, `click_whatsapp`, `configurator_quote_click`.
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
4. Secondary conversions (observe only, not for bidding): `click_to_call`, `click_whatsapp`, `click_email`,
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
- **Search Console + Bing Webmaster Tools**: verify the domain, submit `sitemap.xml` (note: `/configurator` is not in it).
- **Heatmaps / recordings (optional)**: Microsoft Clarity is free; add it as a GTM tag behind the same consent.
- **Weekly report**: GA4 Explorations + the Google Ads search-terms report; keep a changelog of campaign edits.
- **Do not use** call-only or display remarketing until the privacy policy is reviewed for it (see LAUNCH-CHECKLIST).
