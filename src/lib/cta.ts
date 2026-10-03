/**
 * Single source for call-to-action wording and targets (brief section 16).
 * Every "request pricing" button on the site renders CTA_PRIMARY; informational links use CTA_LINKS.
 * Labels are stored in sentence case and shown in capitals by the button styling (`uppercase`).
 */
export const CTA_PRIMARY = {
  label: "Request Wholesale Pricing",
  to: "/contact",
} as const;

/** Secondary action next to the primary one (hero, nav). */
export const CTA_SECONDARY = {
  label: "Explore Products",
  to: "/#products",
} as const;

/** Context-specific informational links. */
export const CTA_LINKS = {
  viewChannelLetters: { label: "View Channel Letters", to: "/services/channel-letters" },
  exploreUltraSlim: { label: "Explore Ultra-Slim", to: "/services/ultra-slim-trimless-channel-letters" },
  viewCastAcrylic: { label: "View Cast Acrylic", to: "/services/cast-block-acrylic" },
  viewProjects: { label: "View Projects", to: "/gallery" },
  viewAllProjects: { label: "View All Projects", to: "/gallery" },
  tryConfigurator: { label: "Try the 3D Configurator", to: "/configurator" },
} as const;

/** Wordings that used to name the primary action; they must not come back (see cta.test.ts). */
export const RETIRED_CTA_LABELS = [
  "Get a Quote",
  "Start Your Project",
  "Request a Quote",
  "Send Your Drawings",
  "Get in Touch",
  "Quote this letter system",
] as const;
