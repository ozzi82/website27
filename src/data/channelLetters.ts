import type { Faq } from "../components/FAQSection";
import type { LightingKind, MountingKind, TrimKind } from "../components/diagrams/LetterDiagrams";

/**
 * Content for /services/channel-letters (brief section 11). Everything here comes from the owner's brief, from claims
 * already on the site (UL 48, 48 h quotes, 3-4 weeks, 3-year LED + power-supply warranty, nationwide shipping, ready to
 * install with drill template and wiring plan, CNC-routed aluminum, custom paint / vinyl) or is a plain definition of the
 * lighting type. No depths, gauges, LED brands or lead times beyond those are stated. Items the owner still has to
 * confirm are listed in docs/briefs/2026-10-03-wholesale-repositioning-plan.md ("Owner confirmation").
 */

export const CHANNEL_LETTERS_PATH = "/services/channel-letters";
export const ULTRA_SLIM_PATH = "/services/ultra-slim-trimless-channel-letters";

export const channelLettersIntro = "UL 48 listed channel letters fabricated to your drawings and shipped ready to install nationwide.";
export const channelLettersWho =
  "Sunlite Signs is a trade-only wholesale manufacturer. We build for sign companies and never compete for their customers.";

export interface IlluminationType {
  id: string;
  kind: LightingKind;
  title: string;
  /** Where the light goes: shown as a spec row. */
  lightGoes: string;
  text: string;
}

export const illuminationTypes: IlluminationType[] = [
  {
    id: "front-lit",
    kind: "front",
    title: "Front lit",
    lightGoes: "Through the face",
    text: "Light passes through the translucent face, so the whole face of the letter glows toward the viewer.",
  },
  {
    id: "halo-lit",
    kind: "halo",
    title: "Reverse / halo lit",
    lightGoes: "To the wall behind",
    text: "The face stays solid. Light is directed backward and washes the wall, outlining each letter with a soft halo. Letters stand off the surface so the glow can reach it.",
  },
  {
    id: "front-back-lit",
    kind: "front-back",
    title: "Front + back lit",
    lightGoes: "Face and wall",
    text: "A glowing face combined with a halo on the wall behind it: both effects from one letter.",
  },
];

/** Real photos that show an illumination style, captioned with what is visible (no product or spec claims). */
export const illuminationPhotos: { projectId: string; caption: string }[] = [
  { projectId: "mustang", caption: "Lit letter faces glowing on a dark panel" },
  { projectId: "tradebyte", caption: "Halo glow on the wall behind the letters" },
  { projectId: "inspire", caption: "Halo glow around a logo on an interior wall" },
];

/**
 * Photos for the "Reference projects" section while no project is tagged with productSlug "channel-letters"
 * (none is until the owner confirms which jobs were which configuration). Different photos from the hero and the
 * illumination strip above, shown as recent production without any category claim.
 */
export const channelLetterReferenceIds = ["stroh-scheuerpflug", "jentower", "itonics"];

export interface TrimOption {
  id: string;
  kind: TrimKind;
  title: string;
  text: string;
}

export const trimOptions: TrimOption[] = [
  {
    id: "trimmed",
    kind: "trimmed",
    title: "Trimmed",
    text: "A trim cap frames the edge of the face: a visible rim around the lit face.",
  },
  {
    id: "trimless",
    kind: "trimless",
    title: "Trimless",
    text: "No trim cap. The face meets the return directly for a cleaner edge. Where the return itself has to be as shallow as possible, see our specialized ultra-slim option.",
  },
];

export interface MountingOption {
  id: string;
  kind: MountingKind;
  title: string;
  text: string;
}

export const mountingOptions: MountingOption[] = [
  { id: "flush", kind: "flush", title: "Flush mount", text: "The letter sits directly against the surface." },
  { id: "standoff", kind: "standoff", title: "Standoff mount", text: "The letter is held off the surface on standoffs, leaving a gap: the usual choice for halo effects." },
  { id: "raceway", kind: "raceway", title: "Raceway mount", text: "Letters are carried on a raceway fixed to the surface." },
  { id: "remote", kind: "remote", title: "Remote mount", text: "Letters mount directly to the surface, with the power supply located remotely." },
];

export const mountingNote = "Mounting configurations are offered where applicable to the project. State your surface and preference when you request pricing.";

export const lightingOptions: { label: string; value: string }[] = [
  { label: "Illumination styles", value: "Front lit, reverse / halo lit, or front + back lit" },
  { label: "LED & electrical", value: "LED modules and power supplies, pre-wired and UL 48 labeled" },
  { label: "Certification", value: "UL 48 listed" },
  { label: "Warranty", value: "3 years on LED modules and power supplies" },
];

export const finishOptions: { label: string; value: string }[] = [
  { label: "Finishes", value: "Custom paint or vinyl" },
  { label: "Colors", value: "Colors and finishes are set on your drawings" },
  { label: "EdgeLuxe systems", value: "Painted in any PMS color, with vinyl or pigmented translucent acrylic options" },
];

export const customFabrication = {
  title: "Custom logos & illuminated letter projects",
  text: "Logos, custom letterforms and other illuminated letter projects, fabricated to your drawings. Send your artwork as a vector file and we advise on materials, light effects, sizing and technical feasibility.",
};

export interface SpecRow {
  label: string;
  value: string;
  /** Optional internal link rendered after the value. */
  link?: { label: string; to: string };
}

export const channelLetterSpecs: SpecRow[] = [
  { label: "Product", value: "Illuminated channel letters, fabricated to your drawings" },
  { label: "Illumination", value: "Front lit / reverse (halo) lit / front + back lit" },
  { label: "Face", value: "Trimmed or trimless" },
  { label: "Construction", value: "CNC-routed aluminum returns, faces and backs" },
  {
    label: "Depth & returns",
    value: "Built to your drawings. A specialized 25–30 mm ultra-slim option is also available.",
    link: { label: "Ultra-slim page", to: ULTRA_SLIM_PATH },
  },
  { label: "Mounting", value: "Flush, standoff, raceway or remote, where applicable" },
  { label: "Finishes", value: "Custom paint or vinyl" },
  { label: "Certification", value: "UL 48 listed" },
  { label: "Electrical", value: "LED modules and power supplies, pre-wired and UL 48 labeled" },
  { label: "Warranty", value: "3 years, LED modules and power supplies" },
  { label: "Quote", value: "Tailored quote within 48 hours" },
  { label: "Lead time", value: "Typically 3–4 weeks, production and delivery" },
  { label: "Delivery", value: "Crated and shipped nationwide, ready to install, with drill template and wiring plan" },
  { label: "Installation", value: "Not provided. Installation is handled by you or your contractor." },
  { label: "Files for a quote", value: "Vector artwork (AI, EPS, PDF), dimensions or a sketch, site photos" },
  { label: "Sold to", value: "Trade only: sign companies and industry professionals" },
];

/** Channel-letter Q&A. Every answer restates a fact already on the site, so the same list can safely feed FAQPage JSON-LD. */
export const channelLetterFaqs: Faq[] = [
  {
    q: "Do you sell channel letters to retail customers?",
    a: "No. Sunlite Signs is a trade-only wholesale manufacturer for sign companies, agencies, shopfitters and other trade professionals.",
  },
  {
    q: "Which channel letter lighting types do you build?",
    a: "Front lit, reverse / halo lit and front + back lit channel letters, trimmed or trimless, fabricated to your drawings.",
  },
  {
    q: "Are your channel letters UL listed?",
    a: "Our illuminated signage is UL 48 listed, and LED modules and power supplies are pre-wired and UL 48 labeled.",
  },
  {
    q: "Do you offer ultra-slim channel letters?",
    a: "Yes, as a specialized option: ultra-slim trimless channel letters at 25–30 mm total depth. It is not the standard depth of our channel letters.",
  },
  {
    q: "What files do you need to quote channel letters?",
    a: "A logo as a vector file (AI, EPS, PDF), dimensions or a dimension sketch, photos of the facade or installation site, the desired light effect, and an indoor or outdoor specification.",
  },
  {
    q: "How long do quotes and production take?",
    a: "We return a tailored quote within 48 hours. Production and delivery typically take 3–4 weeks.",
  },
  {
    q: "What warranty do channel letters carry?",
    a: "LED modules and power supplies carry a 3-year warranty.",
  },
  {
    q: "Do you handle installation?",
    a: "No. Letters ship ready to install, with a drill template and wiring plan. Installation is handled by you, your crew, your electrician or a local contractor.",
  },
  {
    q: "Can you ship directly to the project site?",
    a: "Yes, by arrangement. We ship to your shop, warehouse or, after coordination, directly to your client's project site.",
  },
];

export const channelLettersMeta = {
  title: "Wholesale Channel Letter Manufacturer | Sunlite Signs",
  description:
    "Wholesale channel letter manufacturer for sign companies. Front, halo and front + back lit letters built to your drawings, UL 48 listed, shipped nationwide. Trade only.",
  heroImage: {
    src: "/images/pasted-image-1787166590951-kao0m19c.jpeg",
    alt: "Illuminated letters on a blue building facade at dusk",
    width: 1600,
    height: 1200,
  },
};
