import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './App';
import { services } from './data/services';
import { configurations } from './data/configurations';

export interface RenderResult {
  html: string;
  head: string;
  htmlAttributes: string;
}

/** Server-renders one route. Used at build time by scripts/prerender.mjs (no server at runtime). */
export function render(url: string): RenderResult {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );
  const h = helmetContext.helmet;
  const head = h
    ? [h.title, h.meta, h.link, h.script, h.noscript, h.style, h.base].map((part) => part.toString()).join('\n    ')
    : '';
  return { html, head, htmlAttributes: h ? h.htmlAttributes.toString() : '' };
}

/** Every route that ships as static HTML (the WebGL /configurator stays a client-rendered SPA page). */
export function getPrerenderRoutes(): string[] {
  return ['/', '/about', '/gallery', '/contact', ...services.map((s) => `/services/${s.id}`), ...configurations.map((c) => `/light-effects/${c.id}`)];
}
