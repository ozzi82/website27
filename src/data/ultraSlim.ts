import type { MediaImage } from "./production";
import { configurations, type LightConfig } from "./configurations";
import type { SpecRow } from "./channelLetters";
import { CHANNEL_LETTERS_PATH, ULTRA_SLIM_PATH } from "./channelLetters";

/**
 * Content for /services/ultra-slim-trimless-channel-letters. Ultra-slim letters ARE the EdgeLuxe LP 11 series: cast
 * block acrylic letters (owner clarification, docs/briefs/2026-10-03-product-taxonomy-clarification.md). Every spec
 * below is read from the brochure data in data/configurations.ts so the page cannot contradict it; the only other facts
 * are claims the site already makes (UL 48, 3-year warranty, 24-48 h quotes, ready to install with a printed installation template and touch-up paint
 * plan). Depth: 30 mm is the standard, 25 mm is for small letters; LP 11-B is also offered thinner (10, 15, 20 mm).
 */

export const ULTRA_SLIM_ID = "ultra-slim-trimless-channel-letters";
export { ULTRA_SLIM_PATH };

/** The eight LP 11 variants, in brochure order (F, B, FB, BS, FS, S, N, C). */
export const lp11: LightConfig[] = configurations.filter((c) => c.family === "Block acrylic");

export const ultraSlimMeta = {
  title: "Ultra-Slim Trimless Channel Letters | 25–30 mm Depth",
  description:
    "Ultra-slim trimless channel letters: EdgeLuxe LP 11 cast block acrylic with embedded LEDs, IP67 sealed, 25–30 mm deep. Eight lighting variants. Wholesale to sign companies.",
  intro:
    "A cleaner alternative to conventional deep-return channel letters — engineered for premium retail, architectural and interior signage applications.",
  signature:
    "Sunlite's signature product: the EdgeLuxe LP 11 series of cast block acrylic letters, with LEDs embedded in the body and epoxy-sealed to IP67.",
  heroImage: {
    src: "/images/pasted-image-1787683170345-8s9whs6f.jpg",
    alt: "Illuminated vertical lettering in a large interior concourse",
    width: 1920,
    height: 1440,
  } satisfies MediaImage,
};

/** The three short attributes shown on the homepage section and at the top of the page. */
export const ultraSlimAttributes = ["25–30 mm depth", "Cast block acrylic", "Eight lighting variants"];

export const whyDepthMatters = [
  { title: "A cleaner profile", text: "A solid block with no trim cap at the edge: the face and the sides read as one body." },
  { title: "Less visual bulk", text: "A slim side profile keeps the letter close to the surface, which suits architectural and interior settings." },
  { title: "Where deep returns do not fit", text: "When conventional channel-letter returns are impractical, ultra-slim keeps the illuminated effect without the depth." },
];

/** The brochure's lighting codes (F = face, B = back, S = side, N = neon, C = conical), used in every LP 11 name. */
export const lightingCodes = [
  { code: "F", meaning: "Face", text: "Light through the face." },
  { code: "B", meaning: "Back (halo)", text: "Light onto the wall behind." },
  { code: "S", meaning: "Side", text: "Light along the side wall." },
  { code: "N", meaning: "Neon", text: "Routed to look like a neon tube." },
  { code: "C", meaning: "Conical", text: "Tapered profile for fine strokes." },
] as const;

const mm = (n: number) => `${n} mm`;
const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`);

/** "30 mm", "25 or 30 mm", "10, 15, 20 or 30 mm": the selectable depths of one variant, straight from the data. */
export function depthLabel(c: LightConfig): string {
  const depths = [...c.depthOptionsMm].sort((x, y) => x - y);
  return `${list(depths.map(String))} mm`;
}

/** One line per variant: how it lights, in words that follow the brochure (keyed by configuration id). */
const HOW_IT_LIGHTS: Record<string, { lights: string; mounting: string; short: string }> = {
  "lp-11-f-face-lit": { short: "Face-lit", lights: "The face glows evenly toward the viewer.", mounting: "Flush or stand-off" },
  "lp-11-b-back-lit": { short: "Halo", lights: "A uniform halo washes the wall behind the letter.", mounting: "Standoff spacers" },
  "lp-11-fb-face-halo": { short: "Face + halo", lights: "A glowing face plus a halo on the wall behind.", mounting: "Standoff spacers" },
  "lp-11-bs-back-side-lit": { short: "Back side", lights: "A band of light glows along the back edge of the side wall.", mounting: "Flush or stand-off" },
  "lp-11-fs-front-side-lit": { short: "Face + front side", lights: "The face glows and a thin band lights the front edge of the side wall.", mounting: "Flush or stand-off" },
  "lp-11-s-side-lit": { short: "Full side", lights: "The whole side wall glows; the painted face stays solid.", mounting: "Flush or stand-off" },
  "lp-11-n-faux-neon": { short: "Faux neon", lights: "Front edge routed round to simulate a neon glass tube; the face and the front half of the side glow.", mounting: "Flush or stand-off" },
  "lp-11-c-conical": { short: "Conical", lights: "Tapered conical profile for narrow strokes and serifs, face-lit.", mounting: "Flush or stand-off" },
};

export interface Lp11Variant {
  id: string;
  /** "LP 11-FS" */
  code: string;
  /** The letters after the dash: "FS". */
  suffix: string;
  subtitle: string;
  /** Two or three words for compact lists ("Face + front side"). */
  short: string;
  img: string;
  lights: string;
  mounting: string;
  depth: string;
  page: string;
  configurator: string;
}

export const lp11Variants: Lp11Variant[] = lp11.map((c) => ({
  id: c.id,
  code: c.code,
  suffix: c.code.replace("LP 11-", ""),
  subtitle: c.subtitle,
  short: HOW_IT_LIGHTS[c.id].short,
  img: c.img,
  lights: HOW_IT_LIGHTS[c.id].lights,
  mounting: HOW_IT_LIGHTS[c.id].mounting,
  depth: depthLabel(c),
  page: `/light-effects/${c.id}`,
  configurator: `/configurator?config=${c.id}`,
}));

/** The three face / halo / face + halo variants shown with the section drawings. */
export const ultraSlimLightingDiagrams = [
  { kind: "front", code: "F", title: "Face lit", lightGoes: "Through the face", text: "LP 11-F. Embedded LEDs light the whole face evenly toward the viewer." },
  { kind: "halo", code: "B", title: "Halo (back) lit", lightGoes: "To the wall behind", text: "LP 11-B. The face stays solid; light washes the wall, so the letter stands off on spacers." },
  { kind: "front-back", code: "FB", title: "Face + halo", lightGoes: "Face and wall", text: "LP 11-FB. A glowing face combined with a halo on the wall, from one letter." },
] as const;

/** The other lighting variants, described in words. */
export const ultraSlimOtherLighting = [
  { code: "BS", title: "Partial back side-lit", text: "Flush or stand-off. A band of light glows along the back edge of the side wall." },
  { code: "FS", title: "Face-lit + partial front side-lit", text: "Flush or stand-off. The face glows and a thin band of light also glows along the front edge of the side wall." },
  { code: "S", title: "Full side-lit", text: "The whole side wall glows while the painted face stays solid." },
  { code: "N", title: "Faux neon", text: "Block acrylic with the front edge routed round (up to 0.5\" / 12.7 mm, at most half the thickness) to simulate a neon glass tube. The face and the front half of the side wall glow." },
  { code: "C", title: "Conical", text: "A tapered profile so the lit face can be much narrower than the body, for fine strokes and serifs." },
];

const first = lp11[0]; // LP 11-F carries the series-wide wording
const spec = (c: LightConfig, label: string) => c.specs.find((r) => r.label === label)?.value ?? "";
const ids = (...codes: string[]) => codes.map((x) => `LP 11-${x}`).join(" and ");
const standoffOnly = () => lp11.filter((c) => !c.mounts.includes("flush")).map((c) => c.code.replace("LP 11-", ""));

export const ultraSlimSpecs: SpecRow[] = [
  { label: "Product", value: "EdgeLuxe LP 11 series: cast block acrylic letters" },
  { label: "Depth", value: "30 mm (1.2″) standard for durability and optimal light diffusion; 25 mm (1″) for small letters and signs (LP 11-F). LP 11-B is also offered at 10, 15 and 20 mm." },
  { label: "Illumination", value: "Embedded LEDs for uniform lighting: face, halo, face + halo, partial side, full side, faux neon or conical" },
  { label: "Sealing", value: spec(first, "Sealing") },
  { label: "Maintenance", value: spec(first, "Maintenance") },
  { label: "Min. letter height", value: spec(first, "Min. height").replace('"', "″") },
  { label: "Min. stroke width", value: "0.47″ (12 mm) for stability and even illumination. LP 11-S: 0.79″ (20 mm) recommended. LP 11-C: face as narrow as 0.12″ (3 mm)." },
  { label: "Colors", value: spec(first, "Customization") },
  {
    label: "Mounting",
    value: `Flush to the wall or on stand-off spacers. ${ids(...standoffOnly())} are stand-off only, because the halo needs the gap to reach the wall.`,
  },
  { label: "Certification", value: "UL 48 listed" },
  { label: "Warranty", value: "3 years, LED modules and power supplies" },
  { label: "Quote", value: "Tailored quote in 24 to 48 hours, most times 24 hours" },
];

export const installationPoints: SpecRow[] = [
  { label: "Ships ready to install", value: "Every sign ships with a printed installation template." },
  { label: "Touch-up paint", value: "Every sign comes with touch-up paint." },
  {
    label: "Standoff or flush",
    value: "LP 11-B and LP 11-FB are mounted on standoff spacers so the halo can reach the wall; the other LP 11 variants can be mounted flush to the surface or on standoffs.",
    link: { label: "Mounting explained", to: `${CHANNEL_LETTERS_PATH}#mounting` },
  },
  { label: "Installation", value: "Not provided. Handled by you, your crew or a local contractor." },
];

/** Day and night renderings (illustrative) shown with the lighting section. */
export const dayNightImages = {
  day: "/images/pasted-image-1786570376374-6us1e90k.jpg",
  night: "/images/pasted-image-1786570376502-qxjiefjq.jpg",
};

/** Placeholder slot for the side-profile photograph. Set this to a real MediaImage to replace the placeholder card. */
export const sideProfileMedia: MediaImage | undefined = undefined;
export const SIDE_PROFILE_PLACEHOLDER = "Side-profile photography — coming soon";
