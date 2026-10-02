import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient();

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackRender={(p) => <RuntimeErrorFallback error={p.error} />}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
