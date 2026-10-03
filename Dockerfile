FROM node:20-alpine AS build
WORKDIR /app
# Coolify passes environment variables as build args when "Build Variable" is ticked. Both are optional:
#   VITE_SITE_URL  site origin for canonicals, sitemap, llms.txt (default https://sunlitesigns.com)
#   VITE_NOINDEX   1 = demo build: noindex meta, Disallow: / robots.txt, X-Robots-Tag header
ARG VITE_SITE_URL=""
ARG VITE_NOINDEX=""
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_NOINDEX=$VITE_NOINDEX
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
