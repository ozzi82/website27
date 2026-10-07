import { CONSENT_EVENT, getConsent, type ConsentChoice } from "./consent";

/**
 * Analytics and Google Ads plumbing. Everything is configured through build-time environment variables, so the IDs
 * are the only thing to fill in (see docs/ANALYTICS-PLAN.md):
 *
 *   VITE_GTM_ID            Google Tag Manager container, "GTM-XXXXXXX" (recommended: tags are managed there)
 *   VITE_GA4_ID            GA4 measurement ID, "G-XXXXXXXXXX" (only when you do not use GTM)
 *   VITE_GOOGLE_ADS_ID     Google Ads conversion ID, "AW-XXXXXXXXX" (only when you do not use GTM)
 *   VITE_GOOGLE_ADS_LEAD_LABEL  Conversion label of the "lead" conversion, "AbC-D_efG-h12" (direct mode)
 *
 * Consent Mode v2: every storage type starts denied and the Google tags load in that state; they are switched on only
 * when the visitor accepts in the cookie banner. With no IDs set nothing is loaded and events just land in
 * `window.dataLayer`, which is harmless.
 */
type Dl = Record<string, unknown> | unknown[] | IArguments;
declare global {
  interface Window {
    dataLayer?: Dl[];
    gtag?: (...args: unknown[]) => void;
  }
}

const env = import.meta.env;
export const TRACKING = {
  gtmId: (env.VITE_GTM_ID as string | undefined)?.trim() || "",
  ga4Id: (env.VITE_GA4_ID as string | undefined)?.trim() || "",
  adsId: (env.VITE_GOOGLE_ADS_ID as string | undefined)?.trim() || "",
  adsLeadLabel: (env.VITE_GOOGLE_ADS_LEAD_LABEL as string | undefined)?.trim() || "",
};

let started = false;

const WAKE_EVENTS = ["pointerdown", "touchstart", "keydown", "scroll", "mousemove"] as const;

/**
 * Runs `start` once: on the visitor's first sign of life (touch, click, key, scroll, mouse move) or `maxWaitMs` after the page
 * finished loading, whichever comes first. Google's tag scripts weigh about 500 KB and run for a long time, so they
 * are kept out of the way of the first paint; events pushed to the dataLayer meanwhile are processed once they load.
 */
export function onFirstInteraction(start: () => void, maxWaitMs = 8000): void {
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const go = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    for (const e of WAKE_EVENTS) window.removeEventListener(e, go);
    start();
  };
  for (const e of WAKE_EVENTS) window.addEventListener(e, go, { once: true, passive: true });
  const arm = () => {
    timer = setTimeout(go, maxWaitMs);
  };
  if (document.readyState === "complete") arm();
  else window.addEventListener("load", arm, { once: true });
}

function ensureGtag(): void {
  window.dataLayer = window.dataLayer || [];
  // Google's tags read `arguments` objects from the dataLayer, so this must be a plain function using `arguments`.
  window.gtag =
    window.gtag ||
    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      (window.dataLayer as Dl[]).push(arguments);
    };
}

function loadScript(src: string): void {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function applyConsent(choice: ConsentChoice | null): void {
  const state = choice === "accepted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
  if (choice === "accepted") rememberAttribution(true);
}

/** Call once in the browser. Safe to call again. */
export function initTracking(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  ensureGtag();
  window.gtag!("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  captureAttribution();
  applyConsent(getConsent());
  window.addEventListener(CONSENT_EVENT, (e) => applyConsent((e as CustomEvent<ConsentChoice>).detail));

  if (TRACKING.gtmId) {
    onFirstInteraction(() => {
      window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
      loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(TRACKING.gtmId)}`);
    });
  } else if (TRACKING.ga4Id || TRACKING.adsId) {
    const first = TRACKING.ga4Id || TRACKING.adsId;
    window.gtag!("js", new Date());
    // Page views are sent by trackPageView (single-page site), so the automatic one is off.
    if (TRACKING.ga4Id) window.gtag!("config", TRACKING.ga4Id, { send_page_view: false });
    if (TRACKING.adsId) window.gtag!("config", TRACKING.adsId);
    onFirstInteraction(() => loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(first)}`));
  }
}

/** Push an event. With GTM it is a dataLayer event for triggers; in direct mode it goes to GA4 as an event. */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  ensureGtag();
  if (TRACKING.gtmId) window.dataLayer!.push({ event: name, ...params });
  else window.gtag!("event", name, params);
}

/** Single-page navigation: one page_view per route change. */
export function trackPageView(path: string, title: string): void {
  trackEvent("page_view", { page_path: path, page_location: window.location.href, page_title: title });
}

/**
 * The visitor asked us for pricing: the one conversion the ads care about. In direct mode the Google Ads conversion
 * fires too (needs the ID and label); with GTM, a trigger on the `generate_lead` event does the same.
 */
export function trackLead(params: Record<string, unknown> = {}): void {
  trackEvent("generate_lead", { form: "contact", ...params });
  if (!TRACKING.gtmId && TRACKING.adsId && TRACKING.adsLeadLabel) {
    window.gtag!("event", "conversion", { send_to: `${TRACKING.adsId}/${TRACKING.adsLeadLabel}` });
  }
}

// ---- Campaign attribution: which ad / campaign brought the lead -------------------------------------------------

const ATTRIBUTION_KEYS = ["gclid", "gbraid", "wbraid", "msclkid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const SESSION_KEY = "sls.attribution.v1";
const LOCAL_KEY = "sls.attribution.long.v1";
const LOCAL_DAYS = 90;

export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>> & { landing_page?: string };

function read(store: Storage, key: string): Attribution | null {
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: Attribution; exp?: number };
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

function fromUrl(): Attribution {
  const out: Attribution = {};
  const params = new URLSearchParams(window.location.search);
  for (const k of ATTRIBUTION_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v.slice(0, 200);
  }
  if (Object.keys(out).length) out.landing_page = window.location.pathname;
  return out;
}

/** Remember the ad click / UTM tags of this visit for the quote form (this session; longer only after consent). */
export function captureAttribution(): void {
  const found = fromUrl();
  if (!Object.keys(found).length) return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ v: found }));
  } catch {
    /* storage blocked */
  }
  if (getConsent() === "accepted") rememberAttribution(true);
}

function rememberAttribution(consented: boolean): void {
  if (!consented) return;
  try {
    const session = read(window.sessionStorage, SESSION_KEY);
    if (!session) return;
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify({ v: session, exp: Date.now() + LOCAL_DAYS * 864e5 }));
  } catch {
    /* storage blocked */
  }
}

/** What to put in the quote form's hidden fields: this visit's tags, else the remembered ones (accepted visitors only). */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const session = read(window.sessionStorage, SESSION_KEY);
  if (session) return session;
  return getConsent() === "accepted" ? read(window.localStorage, LOCAL_KEY) ?? {} : {};
}
