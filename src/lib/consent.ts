/**
 * Cookie / tracking consent. Nothing that measures or advertises runs until the visitor accepts (see tracking.ts); the
 * choice is remembered in this browser only. "necessary" means the visitor declined optional cookies.
 */
export type ConsentChoice = "accepted" | "declined";

const KEY = "sls.consent.v1";
export const CONSENT_EVENT = "sls:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "sls:open-cookie-settings";

export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null; // storage blocked: behave as "no choice yet", so nothing optional runs
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    /* the choice still applies for this page view through the event below */
  }
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT, { detail: choice }));
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
}
