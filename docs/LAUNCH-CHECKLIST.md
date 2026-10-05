# Launch checklist: what is still missing

Not legal advice: have a lawyer review the legal pages once, they are templates.

## Legal and regulatory (US trade site running Google Ads)
- [ ] **Privacy policy**: updated with cookies/analytics/ads and HubSpot (done in code); needs a lawyer pass for state privacy
      laws (California CPRA and the other state laws): categories collected, purposes, retention, how to request deletion,
      whether data is "sold or shared" for ads, a US contact method. Add a "Do Not Sell or Share My Personal Information"
      link only if the lawyer says the ad tags count as sharing (the cookie switch already controls them).
- [ ] **Cookie note**: built. Optional cookies are off until accepted.
- [ ] **Terms**: add (1) quotes are not binding until a written order, (2) payment terms, (3) the artwork clause: the customer
      owns or may use the artwork and holds Sunlite harmless for IP claims, (4) the configurator preview is illustrative and
      every order needs approved artwork (the disclaimer is in the configurator already), (5) limitation of liability,
      (6) governing law and venue, (7) lead time not guaranteed.
- [ ] **Warranty page** (3-year LED/power supply): exact terms, what is excluded, how to claim, who pays shipping.
- [ ] **Shipping / returns / custom-order policy**: custom signs are normally non-returnable; say so, and damage-in-transit claims.
- [ ] **Sales tax**: wholesale means resale certificates. Collect the buyer's resale / exemption certificate at the first
      order (a short "tax exempt" section on the quote or onboarding form).
- [ ] **UL claims**: see "UL badge" below. "German engineered" and "10,000+ channel letters produced" need evidence on file
      (FTC: claims must be substantiated).
- [ ] **Business identity for Google Ads**: Google requires accurate, consistent business information and a reachable contact
      method. Phone, email and company name are on every page. A mailbox is acceptable for an ad account, but do NOT list it as
      a storefront on Google Business Profile (use a service-area listing with the address hidden, or skip the listing).
- [ ] **Accessibility statement**: ADA claims against websites are common. Add a short statement + a contact for problems;
      run an automated audit (axe / Lighthouse) and fix contrast and focus issues. The site already uses semantic headings,
      alt text, labelled controls and reduced-motion support.
- [ ] **Email marketing, if any**: CAN-SPAM (unsubscribe link, physical address: a mailbox is fine). **Text messages**: TCPA needs
      opt-in consent; do not text leads who only filled the form without a clear SMS consent checkbox.
- [ ] **Children**: add "the site is for businesses, not for people under 18".
- [ ] **Data retention for uploaded artwork**: the privacy policy says files are deleted after the request; make sure HubSpot
      retention matches.
- [ ] **Company details**: legal name, state of registration and EIN are on file; some ad platforms ask.

## Technical and SEO
- [ ] Domain live on HTTPS (see DEPLOY.md); `www` -> apex redirect; HSTS.
- [ ] **Email authentication** for hello@: SPF, DKIM, DMARC (otherwise quotes land in spam).
- [ ] A custom **404 page** (unknown URLs go home today).
- [ ] **security.txt** and basic security headers (CSP, X-Frame-Options, Referrer-Policy) in nginx.conf; the HubSpot and Google
      origins must be allowed in the CSP.
- [ ] Google Search Console + Bing Webmaster verified, sitemap submitted, `/configurator` decision.
- [ ] Social share images per page (currently one default image).
- [ ] Real project photos (placeholders still on LP 1 finishes and some project pages).
- [ ] Favicon set, web manifest.
- [ ] Monitoring: uptime check on `/` and `/contact`, HubSpot form delivery test weekly.

## UL badge
Good trust signal and worth showing, with care:
1. Confirm who holds the UL listing. The Listing Mark is licensed to the listed manufacturer (or its authorised distributor). If
   the German manufacturer holds it, ask them or UL whether Sunlite may use the mark in its marketing.
2. Use UL's official artwork and follow UL's Marks usage guide (no photo of a label, no recolouring, minimum size, always
   next to the product claim). A photo of a physical label is fine as a "what arrives" image, not as a badge.
3. Wording: "UL 48 listed signs" (product), not "UL certified company". Add the file number (E-number) as text with a link to
   UL's Product iQ lookup so a buyer can verify.
4. Place: small in the trust strip next to "UL 48 Listed" and in the footer; keep the existing trust badge section as is.

## Live chat (see LIVE-CHAT.md)
