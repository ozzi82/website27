/**
 * Browser-only tweaks. Kept out of module scope (and out of App.tsx) so that importing the app on the server
 * (build-time prerender) never touches `window`. Call once from the browser entry.
 */
export function installBrowserPatches(): void {
  if (typeof window === "undefined") return;

  // The embedded HubSpot form triggers this harmless browser warning; keep it from surfacing as an error.
  if (window.ResizeObserver && !(window as any).__roPatched) {
    // Defer observer callbacks a frame so layout changes inside them can't trigger the loop warning.
    const NativeRO = window.ResizeObserver;
    window.ResizeObserver = class extends NativeRO {
      constructor(cb: ResizeObserverCallback) {
        super((entries, obs) => {
          requestAnimationFrame(() => cb(entries, obs));
        });
      }
    };
    (window as any).__roPatched = true;
  }

  window.addEventListener(
    "error",
    (e) => {
      if (e.message?.includes("ResizeObserver loop")) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    },
    true,
  );
}
