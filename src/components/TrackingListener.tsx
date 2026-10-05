import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initTracking, trackEvent, trackPageView } from "../lib/tracking";

/**
 * Starts tracking once, sends a page view on every route change, and reports the clicks that matter to the business:
 * phone, email and WhatsApp links. Renders nothing.
 */
export default function TrackingListener() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    initTracking();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) trackEvent("click_to_call", { link_url: href });
      else if (href.startsWith("mailto:")) trackEvent("click_email", { link_url: href });
      else if (href.includes("wa.me/")) trackEvent("click_whatsapp", { link_url: href });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    // The page's own <title> is set by Helmet in the same commit; read it one tick later.
    const t = setTimeout(() => trackPageView(pathname + search, document.title), 0);
    return () => clearTimeout(t);
  }, [pathname, search]);

  return null;
}
