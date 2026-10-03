import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { installBrowserPatches } from './lib/browserPatches';
import { queryClient } from './lib/queryClient';

installBrowserPatches();

function RuntimeErrorFallback({ error }: { error: Error }) {
  return (
    <div className="fixed inset-0 grid place-items-center">
      <div className="w-full max-w-xl rounded border-t-4 border-t-red-500 bg-white p-4 shadow-lg">
        <h3 className="mb-2 font-medium text-gray-900">Something went wrong</h3>
        <p className="mb-4 text-sm text-gray-600">Please try reloading the page.</p>
        <pre className="overflow-auto rounded border-l-4 border-red-500 bg-red-50 p-4 font-mono text-sm text-red-900">
          {error.message}
        </pre>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-4 rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

// index.html ships homepage-default SEO tags for crawlers that don't run JS.
// Remove them before React mounts so the per-page tags from <Seo> are the only
// ones (otherwise every page would carry two conflicting canonical URLs).
// (Prerendered pages already have them stripped at build time.)
document.querySelectorAll('[data-static-seo]').forEach((el) => el.remove());

const tree = (
  <StrictMode>
    <ErrorBoundary fallbackRender={(p) => <RuntimeErrorFallback error={p.error} />}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

const container = document.getElementById('root')!;

const normalizePath = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

if (container.hasChildNodes() && container.dataset.prerenderPath === normalizePath(location.pathname)) {
  // Prerendered page (see scripts/prerender.mjs): attach to the existing HTML.
  hydrateRoot(container, tree);
} else {
  // SPA shell (/configurator, dev server) or an unknown URL that the host answered with a prerendered page
  // (the SPA fallback serves index.html, which is the prerendered homepage): render from scratch.
  if (container.hasChildNodes()) {
    container.replaceChildren();
    document.querySelectorAll('[data-rh]:not(title)').forEach((el) => el.remove());
  }
  createRoot(container).render(tree);
}
