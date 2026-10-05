import { beforeEach, describe, expect, it } from "vitest";
import { CONSENT_EVENT, clearConsent, getConsent, setConsent } from "../consent";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.dataLayer = [];
  delete window.gtag;
  window.history.replaceState({}, "", "/");
});

describe("consent", () => {
  it("is null until the visitor chooses, then remembers the choice and announces it", () => {
    expect(getConsent()).toBeNull();
    const seen: string[] = [];
    window.addEventListener(CONSENT_EVENT, (e) => seen.push((e as CustomEvent<string>).detail), { once: true });
    setConsent("accepted");
    expect(getConsent()).toBe("accepted");
    expect(seen).toEqual(["accepted"]);
    setConsent("declined");
    expect(getConsent()).toBe("declined");
    clearConsent();
    expect(getConsent()).toBeNull();
  });
});

describe("tracking", () => {
  it("starts with every Google storage type denied, and grants them only after accepting", async () => {
    const { initTracking } = await import("../tracking");
    initTracking();
    const calls = () => (window.dataLayer as unknown[]).map((a) => Array.from(a as ArrayLike<unknown>));
    const first = calls().find((c) => c[0] === "consent" && c[1] === "default")!;
    expect(first[2]).toMatchObject({ ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    setConsent("accepted");
    const update = calls().filter((c) => c[0] === "consent" && c[1] === "update").pop()!;
    expect(update[2]).toMatchObject({ ad_storage: "granted", analytics_storage: "granted" });
    setConsent("declined");
    const after = calls().filter((c) => c[0] === "consent" && c[1] === "update").pop()!;
    expect(after[2]).toMatchObject({ ad_storage: "denied", analytics_storage: "denied" });
  });

  it("pushes events to the dataLayer without any ID configured, and loads no script", async () => {
    const { trackEvent, TRACKING } = await import("../tracking");
    expect(TRACKING.gtmId).toBe("");
    trackEvent("click_to_call", { link_url: "tel:+1" });
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    const last = (window.dataLayer as unknown[]).pop() as ArrayLike<unknown>;
    expect(Array.from(last)).toEqual(["event", "click_to_call", { link_url: "tel:+1" }]);
  });

  it("keeps the ad click ID and UTM tags of the visit for the quote form, longer only after consent", async () => {
    const { captureAttribution, getAttribution } = await import("../tracking");
    window.history.replaceState({}, "", "/services/channel-letters?gclid=abc123&utm_source=google&utm_campaign=wholesale&other=x");
    captureAttribution();
    expect(getAttribution()).toMatchObject({ gclid: "abc123", utm_source: "google", utm_campaign: "wholesale", landing_page: "/services/channel-letters" });
    expect(getAttribution()).not.toHaveProperty("other");
    expect(window.localStorage.getItem("sls.attribution.long.v1")).toBeNull(); // not remembered without consent
    setConsent("accepted");
    captureAttribution();
    expect(window.localStorage.getItem("sls.attribution.long.v1")).toContain("abc123");
    window.sessionStorage.clear();
    expect(getAttribution().gclid).toBe("abc123"); // a later visit, accepted: still known
    setConsent("declined");
    expect(getAttribution()).toEqual({});
  });
});

describe("live chat", () => {
  it("loads HubSpot's script once, only for visitors who accepted cookies or asked for a chat", async () => {
    document.getElementById("hs-script-loader")?.remove();
    const { initChat, loadChat, HUBSPOT_PORTAL_ID } = await import("../chat");
    initChat(); // nothing chosen yet: no script
    expect(document.getElementById("hs-script-loader")).toBeNull();
    setConsent("declined");
    expect(document.getElementById("hs-script-loader")).toBeNull();
    setConsent("accepted");
    const script = document.getElementById("hs-script-loader") as HTMLScriptElement;
    expect(script.src).toBe(`https://js-na1.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`);
    loadChat();
    expect(document.querySelectorAll("#hs-script-loader")).toHaveLength(1);
  });
});
