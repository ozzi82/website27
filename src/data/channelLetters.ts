import type { Faq } from "../components/FAQSection";
import type { LightingKind, MountingKind, TrimKind } from "../components/diagrams/LetterDiagrams";
import { configurations, type LightConfig } from "./configurations";

/**
 * Content for /services/channel-letters, the classic trimless letters (owner clarification,
 * docs/briefs/2026-10-03-product-taxonomy-clarification.md): Sunlite's classic channel letters are TRIMLESS fabricated
 * stainless steel, the EdgeLuxe LP 5 (face-lit), LP 3.1 (halo, standoffs) and LP 3.2 (flush-mount, partial side-lit halo).
 * Depths, materials and limits come from the brochure data in data/configurations.ts. Everything else is a claim the site
 * already makes (UL 48, 48 h quotes, 3-4 weeks, 3-year LED + power-supply warranty, nationwide shipping, ready to install
 * with drill template and wiring plan) or a plain definition. Sunlite does NOT offer trim-capped letters: the trim-cap
 * drawing is kept only as a comparison ("Why we don't use trim caps"). No raceway or remote-mount claims.
 */

export const CHANNEL_LETTERS_PATH = "/services/channel-letters";
export const ULTRA_SLIM_PATH = "/services/ultra-slim-trimless-channel-letters";
export const CUSTOM_FABRICATION_PATH = "/services/custom-sign-fabrication";

export const channelLettersIntro = "UL 48 listed channel letters fabricated to your drawings and shipped ready to install nationwide.";
export const channelLettersWho =
  "Sunlite Signs is a trade-only wholesale manufacturer. We build for sign companies and never compete for their customers.";
export const classicSummary =
  "Our classic channel letters are trimless fabricated stainless steel: face-lit LP 5, halo-lit LP 3.1 on standoffs and flush-mount LP 3.2.";

/** The three classic trimless systems, with brochure facts (depth list comes from the data). */
export const CLASSIC_SYSTEM_IDS = ["lp-5-trimless-face-lit", "lp-3-1-standoff-halo", "lp-3-2-flush-mount"] as const;

const mm = (n: number) => `${n} mm`;
const depthList = (c: LightConfig) => `${c.depthOptionsMm.map(String).slice(0, -1).join(", ")} or ${mm(c.depthOptionsMm[c.depthOptionsMm.length - 1])}${c.customDepth ? ", or custom" : ""}`;

const SYSTEM_TEXT: Record<string, { lights: string; mounting: string; text: string }> = {
  "lp-5-trimless-face-lit": {
    lights: "Face lit",
    mounting: "Mounts flat to the surface",
    text: "Thick gauge stainless steel returns and back, welded together, with a step-routed acrylic face and no trim cap. A crisp, low-profile face-lit letter for building facades and canopies.",
  },
  "lp-3-1-standoff-halo": {
    lights: "Halo lit from the back",
    mounting: "Standoff spacers",
    text: "Fabricated stainless steel letters that float off the wall on standoff spacers, so the light washes the wall behind each letter. LEDs are arranged to avoid reflection of the diodes on the mounting surface.",
  },
  "lp-3-2-flush-mount": {
    lights: "Partial side-lit halo",
    mounting: "Flush-mount",
    text: "Fabricated stainless steel letters mounted flush to the wall, with a halo effect from an exposed acrylic band (standard exposed thickness 10 mm) that glows around the edge of each letter.",
  },
};

export interface ClassicSystem {
  id: string;
  code: string;
  subtitle: string;
  img: string;
  lights: string;
  mounting: string;
  depths: string;
  text: string;
  minHeight: string;
  minStroke: string;
  page: string;
  configurator: string;
}

export const classicSystems: ClassicSystem[] = CLASSIC_SYSTEM_IDS.map((id) => {
  const c = configurations.find((x) => x.id === id)!;
  const t = SYSTEM_TEXT[id];
  return {
    id,
    code: c.code,
    subtitle: c.subtitle,
    img: c.img,
    lights: t.lights,
    mounting: t.mounting,
    depths: depthList(c),
    text: t.text,
    minHeight: "2″ (50 mm)",
    minStroke: "0.5″ (15 mm)",
    page: `/light-effects/${id}`,
    configurator: `/configurator?config=${id}`,
  };
});

export interface IlluminationType {
  id: string;
  kind: LightingKind;
  title: string;
  /** Where the light goes: shown as a spec row. */
  lightGoes: string;
  text: string;
}

/** The two light directions of the classic systems (LP 5 lights the face; LP 3.1 lights the wall behind). */
export const illuminationTypes: IlluminationType[] = [
  {
    id: "face-lit",
    kind: "front",
    title: "Face lit",
    lightGoes: "Through the face",
    text: "LP 5. Light passes through the translucent face, so the whole face of the letter glows toward the viewer.",
  },
  {
    id: "halo-lit",
    kind: "halo",
    title: "Halo lit",
    lightGoes: "To the wall behind",
    text: "LP 3.1. The face stays solid. Light is directed backward and washes the wall, outlining each letter with a soft halo. Letters stand off the surface so the glow can reach it.",
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

/**
 * "Why we don't use trim caps": the drawing of a conventional trim-cap letter is a COMPARISON only. Sunlite does not
 * offer trim-capped letters. The benefits follow from the construction itself; no figures, no performance claims.
 */
export interface TrimComparison {
  id: string;
  kind: TrimKind;
  title: string;
  /** Shown as a spec row under the drawing. */
  status: { label: string; value: string };
  text: string;
}

export const trimComparison: TrimComparison[] = [
  {
    id: "conventional",
    kind: "trimmed",
    title: "Conventional trim-cap letter",
    status: { label: "Sunlite", value: "Not offered" },
    text: "A separate trim cap wraps the edge of the face, leaving a visible rim around the lit face.",
  },
  {
    id: "sunlite",
    kind: "trimless",
    title: "Sunlite trimless letter",
    status: { label: "Sunlite", value: "What we build" },
    text: "No trim cap. The face meets the return directly, so the lit face runs cleanly to the edge of the letter.",
  },
];

export const trimBenefits = [
  { title: "A clean face edge", text: "With no trim cap there is no rim line around the lit face." },
  { title: "Face flush with the return", text: "The face meets the return directly instead of being framed by a cap." },
  { title: "Nothing extra at the edge", text: "No separate cap to fit and finish, so no cap seam to see." },
];

export const trimCapsIntro =
  "A conventional channel letter wraps a trim cap around the edge of its face. Sunlite does not build that letter: every letter we make is trimless. The drawing on the left is shown for comparison only.";

export interface MountingOption {
  id: string;
  kind: MountingKind;
  title: string;
  text: string;
  systems: string;
}

/** Only the two brochure mountings: standoff (LP 3.1) and flush (LP 3.2). */
export const mountingOptions: MountingOption[] = [
  {
    id: "standoff",
    kind: "standoff",
    title: "Standoff mount",
    systems: "LP 3.1",
    text: "The letter is held off the surface on standoff spacers, leaving a gap: the halo needs it so the light can reach the wall.",
  },
  {
    id: "flush",
    kind: "flush",
    title: "Flush mount",
    systems: "LP 3.2",
    text: "The letter sits directly against the surface, with the glow around its edge from an exposed acrylic band.",
  },
];

export const mountingNote = "State your surface and preference when you request pricing.";

export const lightingOptions: { label: string; value: string }[] = [
  { label: "LP 5", value: "Face lit, trimless" },
  { label: "LP 3.1", value: "Halo lit from the back, standoff spacers" },
  { label: "LP 3.2", value: "Partial side-lit halo, flush-mount" },
  { label: "LED & electrical", value: "Serviceable LEDs; LED modules and power supplies pre-wired and UL 48 labeled" },
  { label: "Warranty", value: "3 years on LED modules and power supplies" },
];

export const finishOptions: { label: string; value: string }[] = [
  { label: "Colors", value: "Painted in any PMS color" },
  { label: "Face-lit effects", value: "Options for vinyls or pigmented translucent acrylics for colored face-lit effects (LP 5)" },
  { label: "Halo effects", value: "Options for vinyls or pigmented translucent acrylics for colorful halo effects (LP 3.1, LP 3.2)" },
];

/** Short pointer to the custom page (blade and cabinet signs live only there). */
export const customFabricationPointer = {
  title: "Something that is not a letter system?",
  text: "Custom sign fabrication covers work made to your drawings: illuminated logos, custom letter projects, blade signs and push-through cabinet signs.",
  link: { label: "See Custom Fabrication", to: CUSTOM_FABRICATION_PATH },
};

export interface SpecRow {
  label: string;
  value: string;
  /** Optional internal link rendered after the value. */
  link?: { label: string; to: string };
}

export const channelLetterSpecs: SpecRow[] = [
  { label: "Product", value: "Classic trimless channel letters, fabricated to your drawings" },
  { label: "Systems", value: "EdgeLuxe LP 5 (face lit), LP 3.1 (halo lit, standoffs), LP 3.2 (partial side-lit halo, flush-mount)" },
  { label: "Material", value: "Fabricated stainless steel; LP 5 has thick gauge returns and back welded together and a step-routed acrylic face" },
  { label: "Trim", value: "Trimless: no trim cap" },
  { label: "Depth", value: "1.2″ (30 mm), 2″ (50 mm), 3″ (75 mm), 4″ (100 mm) and custom depth" },
  { label: "Min. letter height", value: "2″ (50 mm)" },
  { label: "Min. stroke width", value: "0.5″ (15 mm) for stability and even illumination" },
  { label: "Mounting", value: "Standoff spacers (LP 3.1) or flush-mount (LP 3.2); LP 5 mounts flat" },
  { label: "Colors", value: "Painted in any PMS color; vinyl or pigmented translucent acrylic options" },
  { label: "Maintenance", value: "Serviceable LEDs" },
  { label: "Certification", value: "UL 48 listed" },
  { label: "Electrical", value: "LED modules and power supplies, pre-wired and UL 48 labeled" },
  { label: "Warranty", value: "3 years, LED modules and power supplies" },
  { label: "Quote", value: "Tailored quote within 48 hours" },
  { label: "Lead time", value: "Typically 3–4 weeks, production and delivery" },
  { label: "Delivery", value: "Crated and shipped nationwide, ready to install, with drill template and wiring plan" },
  { label: "Installation", value: "Not provided. Installation is handled by you or your contractor." },
  { label: "Files for a quote", value: "Vector artwork (AI, EPS, PDF), dimensions or a sketch, site photos" },
  { label: "Sold to", value: "Trade only: sign companies and industry professionals" },
  {
    label: "Slimmer option",
    value: "Ultra-slim LP 11 cast block acrylic letters, 25–30 mm deep: our signature product.",
    link: { label: "Ultra-slim page", to: ULTRA_SLIM_PATH },
  },
];

/** Channel-letter Q&A. Every answer restates a fact already on the site or in the brochure, so the same list can safely feed FAQPage JSON-LD. */
export const channelLetterFaqs: Faq[] = [
  {
    q: "Do you sell channel letters to retail customers?",
    a: "No. Sunlite Signs is a trade-only wholesale manufacturer for sign companies, agencies, shopfitters and other trade professionals.",
  },
  {
    q: "Which classic channel letter systems do you build?",
    a: "Trimless fabricated stainless steel letters: EdgeLuxe LP 5 (face lit), LP 3.1 (halo lit on standoffs) and LP 3.2 (flush-mount with a partial side-lit halo), fabricated to your drawings.",
  },
  {
    q: "Do you build letters with a trim cap?",
    a: "No. Every Sunlite letter is trimless: the face meets the return directly, with no trim cap around the edge.",
  },
  {
    q: "What depths are available?",
    a: "The classic stainless steel systems come in 30, 50, 75 and 100 mm (1.2, 2, 3 and 4 inches) and custom depths.",
  },
  {
    q: "Are your channel letters UL listed?",
    a: "Our illuminated signage is UL 48 listed, and LED modules and power supplies are pre-wired and UL 48 labeled.",
  },
  {
    q: "Do you offer ultra-slim letters?",
    a: "Yes, they are our signature product: the EdgeLuxe LP 11 series of cast block acrylic letters, 25–30 mm deep (30 mm standard, 25 mm for small letters).",
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
    "Wholesale channel letter manufacturer for sign companies. Classic trimless stainless steel letters and ultra-slim LP 11, built to your drawings, UL 48 listed, shipped nationwide.",
  heroImage: {
    src: "/images/pasted-image-1787166590951-kao0m19c.jpeg",
    alt: "Illuminated letters on a blue building facade at dusk",
    width: 1600,
    height: 1200,
  },
};

/**
 * Construction block: brochure facts for the classic systems plus the site's own electrical claims. No gauges or
 * brands beyond the brochure.
 */
export const constructionRows: SpecRow[] = [
  { label: "Returns and back", value: "Fabricated stainless steel; on LP 5, thick gauge stainless steel returns and back welded together." },
  { label: "Face", value: "LP 5: step-routed acrylic face, trimless. The light passes through the face." },
  { label: "LED system", value: "Serviceable LEDs. On LP 3.1 they are arranged to avoid reflection of the diodes on the mounting surface." },
  { label: "Power supply", value: "Power supplies, pre-wired and UL 48 labeled. 3-year warranty on LED modules and power supplies." },
];

export interface DepthOption {
  id: string;
  title: string;
  text: string;
  link?: { label: string; to: string };
}

/** Depth options for the classic systems (brochure): 30, 50, 75, 100 mm and custom; ultra-slim is the separate LP 11 line. */
export const depthOptions: DepthOption[] = [
  { id: "standard", title: "30 / 50 / 75 / 100 mm", text: "The standard depths of the classic stainless steel systems: 1.2″, 2″, 3″ and 4″." },
  { id: "custom", title: "Custom depth", text: "Tell us the depth the project calls for when you request pricing." },
  {
    id: "ultra-slim",
    title: "Need it slimmer?",
    text: "Ultra-slim LP 11 cast block acrylic letters are 25–30 mm deep: our signature product.",
    link: { label: "Explore Ultra-Slim", to: ULTRA_SLIM_PATH },
  },
];

/** What to send for a quote: restates the existing FAQ answer ("What files do you need for a quote?") and nothing more. */
export const filesWeAccept: SpecRow[] = [
  { label: "Artwork", value: "Logo as a vector file: AI, EPS or PDF" },
  { label: "Size", value: "Dimensions or a dimension sketch" },
  { label: "Site", value: "Photos of the facade or installation site" },
  { label: "Brief", value: "Desired light effect, indoor or outdoor" },
];

/** The 3D preview (Build Your Sign) takes SVG or PDF; this is separate from the files we quote from. */
export const previewFilesNote = "The Build Your Sign 3D preview accepts SVG or PDF artwork.";

/** What ships with an order: the existing "ready to install" wording (pre-wired, drill template, wiring plan, crated). */
export const whatArrives: SpecRow[] = [
  { label: "Letters", value: "Fabricated to your drawings" },
  { label: "Wiring", value: "LED modules and power supplies come pre-wired and UL 48 labeled" },
  { label: "Drill template", value: "Ships with every sign" },
  { label: "Wiring plan", value: "Ships with every sign" },
  { label: "Packing", value: "Crated and protected, packed to arrive ready to install" },
  { label: "Installation", value: "Not provided. Handled by you or your contractor." },
];
