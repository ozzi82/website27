import { CONSENT_EVENT, getConsent } from "./consent";
import { trackEvent } from "./tracking";

/**
 * HubSpot live chat. The chat widget is part of HubSpot's tracking script for the portal; the chat flow itself (greeting,
 * routing, who answers on the phone app) is configured in HubSpot > Conversations > Chatflows, not here.
 *
 * It sets cookies, so it loads only after the visitor accepted cookies, or when the visitor asks for a chat (the "Chat
 * with us" link), which is their own request to start one.
 */
export const HUBSPOT_PORTAL_ID = "47141522";
const SCRIPT_ID = "hs-script-loader";
const SCRIPT_SRC = `https://js-na1.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;

interface HubSpotConversations {
  widget?: { load: () => void; open: () => void; status: () => { loaded: boolean } };
  on?: (event: string, cb: () => void) => void;
}
declare global {
  interface Window {
    HubSpotConversations?: HubSpotConversations;
    hsConversationsOnReady?: (() => void)[];
    hsConversationsSettings?: { loadImmediately?: boolean };
  }
}

let started = false;

/** Adds HubSpot's script once. Safe to call repeatedly and on the server (does nothing there). */
export function loadChat(): void {
  if (started || typeof document === "undefined") return;
  started = true;
  window.hsConversationsOnReady = window.hsConversationsOnReady || [];
  window.hsConversationsOnReady.push(() => {
    window.HubSpotConversations?.on?.("conversationStarted", () => trackEvent("chat_started", { provider: "hubspot" }));
  });
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.async = true;
  s.defer = true;
  s.src = SCRIPT_SRC;
  document.body.appendChild(s);
}

/** Loads the chat if needed and opens the window as soon as the widget is ready. */
export function openChat(): void {
  loadChat();
  const open = () => window.HubSpotConversations?.widget?.open();
  if (window.HubSpotConversations?.widget) {
    open();
    return;
  }
  window.hsConversationsOnReady = window.hsConversationsOnReady || [];
  window.hsConversationsOnReady.push(open);
}

/** Starts the chat for visitors who accepted cookies (now or later). */
export function initChat(): void {
  if (typeof window === "undefined") return;
  if (getConsent() === "accepted") loadChat();
  window.addEventListener(CONSENT_EVENT, (e) => {
    if ((e as CustomEvent<string>).detail === "accepted") loadChat();
  });
}
