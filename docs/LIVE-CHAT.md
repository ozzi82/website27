# Live chat that you answer from your phone

Requirements: free, ideally open source, reply from a phone, works with the existing HubSpot lead flow and WhatsApp.

| Option | Cost | Open source | Phone app | Notes |
|---|---|---|---|---|
| **HubSpot free live chat** | Free | No | iOS + Android | Easiest: you already use HubSpot forms; chats become contacts/deals automatically, so gclid/UTMs and offline conversion import keep working. Bots/routing on paid tiers only. **Recommended to start.** |
| **Chatwoot** (self-hosted) | Free software; a small server (about 5 to 10 USD / month) or their cloud plan | **Yes (MIT)** | iOS + Android | Best open-source fit: shared inbox, website widget, WhatsApp / email / SMS channels in one app. You (or I) set up Docker on a VPS; needs updates and backups. |
| Tawk.to | Free | No | iOS + Android | Free widget and apps; ads-supported unless you pay to remove branding; data lives with Tawk. |
| Crisp | Free tier | No | iOS + Android | Nicer UI; free tier limited to 2 seats and basic features. |
| WhatsApp only | Free | n/a | WhatsApp | Already on the site (link). Zero setup; no widget, but many sign buyers prefer it. |

Recommendation: start with **HubSpot free chat** (zero cost, no server, one CRM). If you later want everything in one open-source
inbox including WhatsApp, move to **Chatwoot**.

Implementation notes (when you choose): the chat script goes through the same consent switch (load it only after "Accept" if it
sets cookies; HubSpot chat sets cookies); the widget should sit above the cookie banner and away from the sticky quote
button on mobile; "business hours" messages should say when you reply. Send chat events to the `dataLayer`
(`chat_started`) so they can be a secondary conversion.
