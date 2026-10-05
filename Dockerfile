FROM node:22-alpine AS build
WORKDIR /app
# Coolify passes environment variables as build args when "Build Variable" is ticked. All of them are optional:
#   VITE_SITE_URL  site origin for canonicals, sitemap, llms.txt (default https://sunlitesigns.com)
#   VITE_NOINDEX   1 = demo build: noindex meta, Disallow: / robots.txt, X-Robots-Tag header
#   VITE_GTM_ID                 Google Tag Manager container, "GTM-XXXXXXX" (recommended; see docs/ANALYTICS-PLAN.md)
#   VITE_GA4_ID                 GA4 measurement ID "G-XXXXXXXXXX"            (only when not using GTM)
#   VITE_GOOGLE_ADS_ID          Google Ads conversion ID "AW-123456789"      (only when not using GTM)
#   VITE_GOOGLE_ADS_LEAD_LABEL  Ads conversion label of the lead conversion  (only when not using GTM)
# Left empty, no Google script is loaded at all. They are baked into the JavaScript at build time, so change them
# in Coolify and redeploy (a rebuild), not just restart.
ARG VITE_SITE_URL=""
ARG VITE_NOINDEX=""
ARG VITE_GTM_ID=""
ARG VITE_GA4_ID=""
ARG VITE_GOOGLE_ADS_ID=""
ARG VITE_GOOGLE_ADS_LEAD_LABEL=""
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_NOINDEX=$VITE_NOINDEX
ENV VITE_GTM_ID=$VITE_GTM_ID
ENV VITE_GA4_ID=$VITE_GA4_ID
ENV VITE_GOOGLE_ADS_ID=$VITE_GOOGLE_ADS_ID
ENV VITE_GOOGLE_ADS_LEAD_LABEL=$VITE_GOOGLE_ADS_LEAD_LABEL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Written by the prerender step from VITE_NOINDEX (an X-Robots-Tag line, or an empty comment).
COPY --from=build /app/dist-ssr/robots-header.conf /etc/nginx/snippets/robots-header.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
