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

## HubSpot live chat: set-up (done in code, finish in HubSpot)
In the site: `src/lib/chat.ts` loads HubSpot's chat script (portal 47141522, region na1) only after a visitor accepts cookies, or
when they click **Chat with us** in the footer (that click is their own request). Opening a chat sends a `chat_started` event
to the dataLayer. Nothing else is needed in code.

In HubSpot (about 15 minutes):
1. **Conversations > Chatflows > the flow you created**. Under **Target**, pick "All pages" (or exclude `/configurator` if the
   widget covers the preview controls on phones). Under **Options**, keep "Show the chat widget" on and leave the visitor's
   identification to the contact form.
2. **Install**: choose "Tracking code (already installed)" or the manual option; the site loads the same script itself, so do
   **not** also paste the code into the site or into Google Tag Manager (it would load twice).
3. **Inbox > Settings > Channels > Chat**: set the team member who answers, the away message and the working hours; add an
   email fallback so after-hours chats become tickets/contacts.
4. **Phone**: install the **HubSpot** app (iOS / Android), sign in, turn on push notifications for Inbox. Set yourself "Available"
   in the app when you can answer; otherwise visitors see the away message and can leave an email.
5. **Cookie banner**: in HubSpot > Settings > Privacy & Consent keep HubSpot's own banner OFF (the site's banner already controls
   the script).
6. Test: open the site in a private window, press Accept, wait a few seconds for the chat bubble, send a message and answer it
   from the phone app. Check that the contact shows up in HubSpot Contacts.
7. Optional: in the GA4/Ads setup (docs/ANALYTICS-PLAN.md) add `chat_started` as a secondary conversion.

Visitors who declined cookies still reach you through **Chat with us** (it loads the chat on their click), the form, WhatsApp
and the phone number.

## Always visible, and on the left (2026-10-06)
- `src/components/ChatLauncher.tsx`: a "Chat with us" button at the bottom left on every page, for every visitor (also before the cookie choice).
  Clicking it loads HubSpot's chat and opens it; once HubSpot's own bubble is up the button steps aside. On phones it stays hidden while the
  cookie notice is open. The cookie notice leaves its left corner free for it.
- `src/index.css`: moves HubSpot's own bubble and chat window to the left (`#hubspot-messages-iframe-container`). If it looks wrong, use
  HubSpot's own setting instead (Conversations > Chatflows > your flow > Customize > position) and delete that CSS rule.
- "Available all the time" is a HubSpot setting: Conversations > Chatflows > your flow > Target: all pages, no office-hours rule; Inbox > Settings >
  Channels > Chat > Availability: no working-hours restriction; the away message should say when you reply and ask for an email address;
  HubSpot mobile app: set yourself Available and keep Inbox notifications on.
