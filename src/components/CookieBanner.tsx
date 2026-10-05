import { useEffect, useState } from "react";
import { Button } from "@project/components/ui/button";
import { OPEN_COOKIE_SETTINGS_EVENT, getConsent, setConsent } from "../lib/consent";

/**
 * The cookie note: analytics and advertising measurement stay off until the visitor accepts. Rendered on the client
 * only (it depends on this browser's stored choice), so the prerendered HTML and hydration are unaffected.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const choose = (choice: "accepted" | "declined") => {
    setConsent(choice);
    setVisible(false);
  };

  return (
    <div role="region" aria-label="Cookie notice" className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 backdrop-blur p-4 shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 sm:pr-24">
        <p className="text-sm text-foreground/85 sm:flex-1">
          We use cookies to measure how the site is used and how our ads perform. They stay off unless you accept; the quote form and the
          configurator work either way.{" "}
          <a href="/privacy-policy" className="underline underline-offset-2 hover:text-primary">
            Privacy policy
          </a>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => choose("declined")} className="h-10 px-5 text-xs uppercase tracking-wider font-semibold bg-transparent">
            Decline
          </Button>
          <Button type="button" onClick={() => choose("accepted")} className="h-10 px-5 text-xs uppercase tracking-wider font-semibold">
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
