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

## 4. Deploy (pick one)

All of these need "single-page app" routing so that links like `/about` work after a refresh.
The `public/_redirects` file already handles this for Netlify and Cloudflare Pages.

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
  try_files {path} /index.html
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
- **Placeholder text on the public site.** All 12 "Configuration NN" pages (`/light-effects/config-01` ...) still say "Placeholder" / "TBD", and the Cast Block Acrylic page has "Letter Height: Placeholder". Edit `src/data/configurations.ts` and `src/data/services.ts`, or remove the Light Effects section from `src/pages/HomePage.tsx` until the real content is ready.
- **Privacy policy.** It mentions file uploads and email forwarding. Your live form is HubSpot. Review the text in `src/components/LegalDialogs.tsx` so it matches what actually happens.

## What changed from the Zite version

- Removed Zite-only code: the `zitejs` backend endpoint (`src/api/submitInquiry.ts`, which nothing used), the editor hooks in `main.tsx`, and the Zite config files.
- Removed components that no page rendered: `Hero`, `ServicesSection`, `PartnerSection`, `TrustBar`, `WhySunlite`, and `InquiryCard` (a quote form that looked like it submitted but sent nothing).
- Fixed the "Services" links in the header, footer, and service pages. They pointed at a section that doesn't exist, and now go to the product grid.
- Fixed buttons that scrolled to a contact form that isn't on the page (Gallery page, "Our Process"). They now open `/contact`.
- Added the shadcn UI components (`button`, `accordion`, `dialog`) and the Tailwind/Vite config that Zite kept internally.
