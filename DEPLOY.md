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
- **Remaining placeholders.** The 12 EdgeLuxe configuration pages now carry the real brochure content. Check `src/data/services.ts` against the brochure (Trimless depth, the "Placeholder" Letter Height on Cast Block Acrylic, Clear/Opal colors).
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
5. Redirect `www` to the bare domain (or the reverse) so there is one canonical address; the site's canonical tags and sitemap use `https://sunlitesigns.com`.
6. HubSpot: add `sunlitesigns.com` and `www.sunlitesigns.com` to the form's allowed domains, then submit one test inquiry (with a file) and confirm it arrives.
7. Search Console and Bing Webmaster Tools: verify the domain and submit `https://sunlitesigns.com/sitemap.xml`.

Netlify works the same way (Add new site > Import from Git, same build settings).
Every push to `master` redeploys automatically.

## Running on your local network

`npm run dev:lan` serves the dev build on all network interfaces (the terminal prints the `Network:` address, for example `http://192.168.4.235:5173`). Windows may ask to allow Node through the firewall: allow it on Private networks.
