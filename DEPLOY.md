# Sunlite Signs – self-hosting guide

This is your site exported from Zite as a normal Vite + React + Tailwind project.
The contact form is your HubSpot embed, so no backend is needed. The build output is plain static files.

## 1. Run it locally

You need Node.js 18 or newer (https://nodejs.org, pick the LTS version).

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## 2. Download your images (do this once, before deploying)

Every photo on the site is currently loaded from Fillout's servers (`images.fillout.com`).
If your Zite/Fillout account is ever closed, those images would disappear. This copies them to your own project:

```bash
npm run images
```

It finds every Fillout image URL in `src/`, saves the files to `public/images/`, and rewrites the code to use the local copies.
It is safe to re-run. Any image that fails to download is left alone, so run it again later or save that one by hand.
Afterwards, check that photos still show up with `npm run dev`.

## 3. Build

```bash
npm run build
```

This creates a `dist/` folder. That folder is your whole website.

The build also **prerenders** every content page to real HTML (`dist/about/index.html`, `dist/services/<id>/index.html`, `dist/light-effects/<id>/index.html`, and so on), so search engines, AI crawlers and link previews that don't run JavaScript see the full page and its title, description and structured data. In the browser the page then loads as normal. The prerender runs in plain Node (no headless browser, no server), so the build command stays `npm run build` and the output directory stays `dist`. The WebGL `/configurator` stays a normal client-side page.

Useful afterwards:

- `npm run verify:prerender` checks every prerendered page (one h1, real text, one canonical, one description, valid JSON-LD). `npm test` runs the same check when `dist/` exists.
- `npm run export:content` rewrites `docs/site-content.md`, a readable Markdown copy of all page text. Hand that file to another AI or a copywriter for content review, then re-run it after copy changes and commit it.

## 4. Deploy (pick one)

Every page above is a real file, so these hosts serve it directly and `/about` works after a refresh. Unknown URLs (and `/configurator`) fall back to the single-page app: `public/_redirects` does this for Netlify and Cloudflare Pages (real files always win over the `/*` rule), and the nginx/Caddy snippets below do it with `try_files`.

### Option A: Cloudflare Pages (free)
1. Put the project on GitHub (see below).
2. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git.
3. Build command: `npm run build`   Output directory: `dist`
4. After the first deploy, add your domain under Custom domains.

### Option B: Netlify (free)
1. Put the project on GitHub, then in Netlify choose Add new site, Import from Git.
2. Build command: `npm run build`   Publish directory: `dist`
3. Add your domain under Domain management.
(Or drag the `dist/` folder onto https://app.netlify.com/drop for a quick test.)

### Option C: Your own server (nginx)
Copy the contents of `dist/` to your server, for example `/var/www/sunlite`, and use:

```nginx
server {
  server_name yourdomain.com www.yourdomain.com;
  root /var/www/sunlite;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Then add HTTPS with `certbot --nginx`.

### Option D: Your own server (Caddy)
```
yourdomain.com {
  root * /var/www/sunlite
  try_files {path} {path}/index.html /index.html
  file_server
}
```
Caddy sets up HTTPS automatically.

## Putting the project on GitHub
```bash
git init
git add .
git commit -m "Initial commit"
```
Then create an empty repository on github.com and follow the "push an existing repository" commands it shows.
(`node_modules/` and `dist/` are ignored by `.gitignore`.)

## Things to check after you go live

- **HubSpot allowed domains.** If you restrict where your form can load, add your new domain in HubSpot. Then submit a test inquiry and confirm it reaches HubSpot and your email.
- **Your old Zite URL.** Once the new site works, point your domain's DNS at the new host. Keep the old site up until DNS has switched.
- **Remaining placeholders.** The 12 EdgeLuxe configuration pages now carry the real brochure content. The product pages (`src/data/ultraSlim.ts`, `channelLetters.ts`, `customFabrication.ts`) take their specs from `src/data/configurations.ts`; check that file against the brochure.
- **Privacy policy.** It mentions file uploads and email forwarding. Your live form is HubSpot. Review the text in `src/components/LegalDialogs.tsx` so it matches what actually happens.

## What changed from the Zite version

- Removed Zite-only code: the `zitejs` backend endpoint (`src/api/submitInquiry.ts`, which nothing used), the editor hooks in `main.tsx`, and the Zite config files.
- Removed components that no page rendered: `Hero`, `ServicesSection`, `PartnerSection`, `TrustBar`, `WhySunlite`, and `InquiryCard` (a quote form that looked like it submitted but sent nothing).
- Fixed the "Services" links in the header, footer, and service pages. They pointed at a section that doesn't exist, and now go to the product grid.
- Fixed buttons that scrolled to a contact form that isn't on the page (Gallery page, "Our Process"). They now open `/contact`.
- Added the shadcn UI components (`button`, `accordion`, `dialog`) and the Tailwind/Vite config that Zite kept internally.

## Deploy from GitHub to your own domain (recommended: Cloudflare Pages)

Repo: https://github.com/ozzi82/website27 (branch `master`).

1. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > pick `ozzi82/website27`.
2. Build command `npm run build`, output directory `dist`, Node 20 or newer (set `NODE_VERSION=20` under Environment variables).
3. Deploy. You get a `*.pages.dev` address to test on first.
4. Custom domain: Pages project > Custom domains > Set up a domain > `sunlitesigns.com` (and `www`). If the domain's DNS is already on Cloudflare this is one click; otherwise add the CNAME records Cloudflare shows at your registrar (or move nameservers to Cloudflare). HTTPS is automatic.
5. Redirect `www` to the bare domain (or the reverse) so there is one canonical address; the site's canonical tags, sitemap, llms.txt and JSON-LD use the origin set by `VITE_SITE_URL` (default `https://sunlitesigns.com`, the bare domain; see "Site origin and noindex" below).
6. HubSpot: add `sunlitesigns.com` and `www.sunlitesigns.com` to the form's allowed domains, then submit one test inquiry (with a file) and confirm it arrives.
7. Search Console and Bing Webmaster Tools: verify the domain and submit `https://sunlitesigns.com/sitemap.xml`.

Netlify works the same way (Add new site > Import from Git, same build settings).
Every push to `master` redeploys automatically.

## Site origin and noindex (VITE_SITE_URL, VITE_NOINDEX)

Two build-time settings decide which domain the site announces and whether search engines may index it. Both are read at **build** time (they are baked into the HTML, sitemap and headers), so changing them means a new build/deploy.

| Variable | Default | Effect |
| --- | --- | --- |
| `VITE_SITE_URL` | `https://sunlitesigns.com` | The origin used in canonical links, `og:url`, `og:image`, JSON-LD, `sitemap.xml`, `llms.txt` and `robots.txt`. Use the exact address visitors land on, with no trailing slash and no path. Apex vs www: the value is used as written (`https://t2wraps.com` gives apex canonicals, `https://www.t2wraps.com` gives www canonicals), so set it to your preferred address and redirect the other one to it. |
| `VITE_NOINDEX` | unset (indexable) | `1` (or `true`) makes a demo build: `<meta name="robots" content="noindex, nofollow">` on every page, a `robots.txt` that is just `Disallow: /`, an `X-Robots-Tag: noindex, nofollow` header from nginx, and no `sitemap.xml` or `llms.txt`. |

With neither variable set you get the production-ready, indexable site for `https://sunlitesigns.com`. `npm run verify:prerender` reads the same variables and fails if any canonical, sitemap URL or robots tag disagrees with them, so run it with the variables you deploy with.

### Coolify (Docker build): the t2wraps.com demo

The `Dockerfile` accepts both as build arguments and writes the nginx header from them at build time. In Coolify, open the application, then **Environment Variables** and add:

| Name | Value | Build Variable |
| --- | --- | --- |
| `VITE_SITE_URL` | `https://t2wraps.com` | checked |
| `VITE_NOINDEX` | `1` | checked |

Tick **Build Variable** on each (Coolify only passes variables to the Docker build as build args when that box is ticked; without it the values never reach `npm run build` and the site silently builds as the production default). Save, then **Redeploy**. To confirm after the deploy: `curl -sI https://t2wraps.com/` shows `x-robots-tag: noindex, nofollow`; `https://t2wraps.com/robots.txt` shows `Disallow: /`; view-source of any page shows the noindex meta and a canonical on `https://t2wraps.com`.

### Analytics and Google Ads IDs (VITE_GTM_ID and friends)

The same build-argument mechanism carries the tracking IDs (see `docs/ANALYTICS-PLAN.md`). Add them in Coolify as **Build Variable**
entries, then redeploy (they are baked into the JavaScript, so a rebuild is needed whenever one changes):

| Name | Example | When |
| --- | --- | --- |
| `VITE_GTM_ID` | `GTM-XXXXXXX` | Recommended: one Google Tag Manager container manages GA4, Google Ads and everything else |
| `VITE_GA4_ID` | `G-XXXXXXXXXX` | Only without GTM |
| `VITE_GOOGLE_ADS_ID` | `AW-123456789` | Only without GTM |
| `VITE_GOOGLE_ADS_LEAD_LABEL` | `AbC-D_efG-h12` | Only without GTM (the conversion label of the quote-request conversion) |

Leave them empty on the t2wraps.com demo (it is noindex anyway) and set them on the production build. With none set, no Google
script is loaded; visitors still get the cookie notice, and nothing is sent until they accept. Check after deploying: open the
site in a private window, accept the notice, and look for `googletagmanager.com` in the browser's Network tab (or use GTM Preview).

### Switching to production (sunlitesigns.com)

1. Point the production domain at the application (or create a new application from the same repository).
2. Set `VITE_SITE_URL` to `https://sunlitesigns.com` (or delete the variable: that is the default) and **delete `VITE_NOINDEX`** (an empty value also counts as off, but deleting it is clearer). Keep Build Variable ticked on whatever remains.
3. Redeploy. Confirm: `curl -sI https://sunlitesigns.com/` has no `x-robots-tag` header, `/robots.txt` shows `Allow: /` and the sitemap line, `/sitemap.xml` lists `https://sunlitesigns.com/...` URLs, and view-source shows no robots meta.
4. Submit `https://sunlitesigns.com/sitemap.xml` in Search Console (see above) and make sure the old demo domain stays noindex or redirects to production.

### Cloudflare Pages / Netlify

Add `VITE_SITE_URL` (and `VITE_NOINDEX` for a demo project) under the project's environment variables for the **Production** build, then redeploy. These hosts do not run nginx, so the `X-Robots-Tag` header is not sent there; the meta tag and `robots.txt` still apply. For a demo on these hosts you can also add a `_headers` file with `/*` and `  X-Robots-Tag: noindex, nofollow`.

### Local checks

```bash
# demo build, verified
VITE_SITE_URL=https://t2wraps.com VITE_NOINDEX=1 npm run build && VITE_SITE_URL=https://t2wraps.com VITE_NOINDEX=1 npm run verify:prerender
# production build, verified (the default)
npm run build && npm run verify:prerender
```

(On Windows PowerShell set the variables first: `$env:VITE_SITE_URL="https://t2wraps.com"; $env:VITE_NOINDEX="1"`, and remove them afterwards.)

## Running on your local network

`npm run dev:lan` serves the dev build on all network interfaces (the terminal prints the `Network:` address, for example `http://192.168.4.235:5173`). Windows may ask to allow Node through the firewall: allow it on Private networks.
