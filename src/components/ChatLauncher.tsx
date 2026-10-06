import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { CHAT_READY_EVENT, openChat } from "../lib/chat";
import { CONSENT_EVENT, OPEN_COOKIE_SETTINGS_EVENT, getConsent } from "../lib/consent";

/**
 * "Chat with us", always visible at the bottom left, for every visitor, whatever they chose in the cookie notice.
 * HubSpot's chat sets cookies, so its own bubble only loads after "Accept"; this button is the visitor's own request for a
 * chat, so it loads and opens the chat on click. Once HubSpot's bubble is up (it is moved to the left in index.css) this
 * button steps aside. On phones it also stays out of the way while the cookie notice is open.
 */
export default function ChatLauncher() {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReady(Boolean(window.HubSpotConversations?.widget));
    setNoticeOpen(getConsent() === null);
    const onReady = () => setReady(true);
    const onConsent = () => setNoticeOpen(false);
    const onReopen = () => setNoticeOpen(true);
    window.addEventListener(CHAT_READY_EVENT, onReady);
    window.addEventListener(CONSENT_EVENT, onConsent);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onReopen);
    return () => {
      window.removeEventListener(CHAT_READY_EVENT, onReady);
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onReopen);
    };
  }, []);

  if (!mounted || ready) return null;
  return (
    <button
      type="button"
      onClick={openChat}
      className={`fixed bottom-4 left-4 z-[65] inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 ${noticeOpen ? "max-sm:hidden" : ""}`}
    >
      <MessageCircle aria-hidden="true" className="h-5 w-5" />
      Chat with us
    </button>
  );
}
