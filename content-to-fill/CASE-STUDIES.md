# Sunlite Signs — Case Studies to Fill In

How this works: fill in the blanks below (replace everything in `[ ]` brackets), save the file,
and tell me it's done. Since this file lives inside your project folder, I can read it from here
next time. If it's easier to edit it somewhere else (Word, Google Docs, Notes), paste it back into
the chat instead.

Leave anything blank if you don't have an answer yet. A case study only shows the sections you
fill in, so a short, accurate one is better than a long one with guesses. **Nothing is invented:**
if a field is empty, that line simply does not appear on the page.

## Why bother

Three to six strong case studies do four jobs at once: they show a sign company that you can build
*their* kind of project (trust and sales), they give Google and AI assistants specific pages to
quote (SEO), they give Google Ads a proof page to send people to, and they turn a photo into
evidence. The page template already exists (`/projects/<name>`); right now it ships with **zero**
entries on purpose, so no empty or placeholder page is live. When you send this file back, each
completed study becomes a page, a card on `/projects`, a line in the sitemap and `llms.txt`, and a
"Read the case study" link on the matching project photo.

## What makes a good one

- **A real job that Sunlite built**, ideally a configuration you want more of (trimless, ultra-slim,
  halo-lit, front + back lit, remote or raceway mounted).
- **Day and night photos** of the finished sign (the night photo is what sells illuminated letters).
- **One or two side-profile or detail photos**, especially of anything slim. A real side profile of
  a 25–30 mm letter would be the single most useful photo on the whole site.
- **Facts you can stand behind.** No gauges, brands or lead times unless they are true and you are
  happy to publish them.
- **Permission.** Say whether the customer (the sign company or the end client) may be named. If
  not, the page is written without names ("a sign company in ...", or no location at all).

## How many

3–6 to start. Copy the block below once per study. Number them if you like; the page address
(`/projects/<name>`) comes from the short name you give in the first field.

---

## Case study 1

### Basics
- Short name for the web address (lowercase, words joined by hyphens, e.g. `retail-trimless-letters`): [ ]
- Title shown on the page (what it is, in plain words, e.g. "Trimless face-lit letters for a retail storefront"): [ ]
- One- or two-sentence summary (this is also the Google snippet and the card text): [ ]
- Customer name (the sign company), only if they allow being named: [ ]
- End client / project name, only if it may be named: [ ]
- Permission to publish the name(s) above and the photos: [Yes / No / Only anonymised]
- Which existing photo on `/projects` is this (title as shown there), or "new photos": [ ]

### Product and configuration
- Product (Channel letters / Ultra-slim trimless / Cast acrylic / Other): [ ]
- Configuration (front lit, halo / reverse lit, front + back lit; trimmed or trimless): [ ]
- Application (retail storefront, interior, architectural facade, event, other): [ ]
- Depth (e.g. "28 mm"; leave blank if unknown): [ ]
- Illumination (face lit, halo, dual lit, other): [ ]
- Materials (face, return, back — only what is true): [ ]
- Finish (painted, brushed, vinyl, colour — only what is true): [ ]
- Mounting (flush, standoff, raceway, remote — as installed): [ ]

### The story (2–4 sentences each; any section can be left out)
- **Challenge** — what did the sign company or their client need, and what made it hard (space, depth, structure, deadline)? [ ]
- **Specification** — what was specified: construction, depth, illumination, materials, finish, mounting. [ ]
- **Production** — how it was built at Sunlite (CNC, forming, LED and wiring, assembly, quality control, packing). Only steps that really happened. [ ]
- **Result** — how it turned out, how it shipped, and (only if the customer said so) what they said about it. No invented quotes or numbers. [ ]
- Extra technical rows you want listed (label: value, one per line), e.g. "Letter height: ...", "Quantity: ...": [ ]

### Photos (send the files, or tell me where they are; give each a one-line description for the alt text)
- Main image, daytime (required): [file name] — [what it shows]
- Night / illuminated image: [file name] — [what it shows]
- Side-profile or detail photo(s): [file name(s)] — [what they show]
- Production or installation photos, if any: [file name(s)] — [what they show]
- Minimum size: about 1600 px on the long side. Do not add text or logos on top of the photos.

---

## Case study 2

(Copy the whole block from "Case study 1" here and fill it in.)

## Case study 3

(Same.)

---

## Not sure which jobs to pick?

Choose the ones that match what you want to sell more of. A good first set: one
ultra-slim / trimless job, one halo-lit job, one front + back lit or face-lit job, and one
larger or more complex build. If you have fewer than three finished, publish what you have; each
extra one can be added later without touching anything else.

## What happens when you send this back

1. Each completed study is added to `src/data/caseStudies.ts` (the photos go to `public/images/`).
2. `npm run build` creates `/projects/<name>`, adds it to the sitemap and `llms.txt`, and links it
   from the project card; `npm run verify:prerender` checks the page.
3. Nothing is shown for blanks, and nothing is added that you did not provide.
