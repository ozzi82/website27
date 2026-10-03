import type { MediaImage } from "./production";
import { configurations } from "./configurations";
import { services } from "./services";
import type { SpecRow } from "./channelLetters";
import { CHANNEL_LETTERS_PATH } from "./channelLetters";

/**
 * Content for /services/ultra-slim-trimless-channel-letters (brief section 12). The depth, trimless construction,
 * lighting options, finishes, UL 48 and warranty come from the product entry in data/services.ts (the owner's brief
 * plus claims already on the site). Everything else is qualitative. 25-30 mm is a specialized option, never the
 * standard depth, and nothing is stated about the depth of conventional letters.
 */

export const ULTRA_SLIM_ID = "ultra-slim-trimless-channel-letters";
export const ultraSlimService = services.find((s) => s.id === ULTRA_SLIM_ID)!;

export const ultraSlimMeta = {
  title: "Ultra-Slim Trimless Channel Letters | 25–30 mm Depth",
  description:
    "Ultra-slim trimless channel letters at 25–30 mm total depth: a cleaner alternative to deep returns for premium retail, architectural and interior signage. Wholesale to sign companies.",
  intro:
    "A cleaner alternative to conventional deep-return channel letters — engineered for premium retail, architectural and interior signage applications.",
  specialized: "A specialized premium option, not the standard depth of our channel letters.",
  heroImage: {
    src: "/images/pasted-image-1787683170345-8s9whs6f.jpg",
    alt: "Illuminated vertical lettering in a large interior concourse",
    width: 1920,
    height: 1440,
  } satisfies MediaImage,
};

/** The three short attributes shown on the homepage section and at the top of the page. */
export const ultraSlimAttributes = ["25–30 mm depth", "Trimless construction", "Face / halo / dual lit"];

export const whyDepthMatters = [
  { title: "A cleaner profile", text: "Trimless construction lets the face and return read as one body, with no trim cap at the edge." },
  { title: "Less visual bulk", text: "A slim side profile keeps the letter close to the surface, which suits architectural and interior settings." },
  { title: "Where deep returns do not fit", text: "When conventional channel-letter returns are impractical, ultra-slim keeps the illuminated effect without the depth." },
];

export const ultraSlimIlluminationTitles = { front: "Face lit", halo: "Halo lit", "front-back": "Dual lit" } as const;

const specValue = (label: string) => ultraSlimService.details.specs.find((s) => s.label === label)!.value;

export const ultraSlimSpecs: SpecRow[] = [
  { label: "Total depth", value: specValue("Total Depth") },
  { label: "Construction", value: specValue("Construction") },
  { label: "Lighting", value: specValue("Lighting") },
  { label: "Finishes", value: specValue("Finishes") },
  { label: "Materials", value: "Specified per project. The related letter systems below list their own materials." },
  { label: "Intended for", value: "Premium retail, architectural and interior signage" },
  { label: "Positioning", value: "A specialized option. Not the standard depth of our channel letters." },
  { label: "Certification", value: specValue("Certification") },
  { label: "Warranty", value: specValue("Warranty") },
  { label: "Quote", value: "Tailored quote within 48 hours" },
];

export const installationPoints: SpecRow[] = [
  { label: "Ships ready to install", value: "Every sign ships with a drill template and wiring plan." },
  { label: "Pre-wired", value: "LED modules and power supplies come pre-wired and UL 48 labeled." },
  {
    label: "Mounting",
    value: "Specified per project. Mounting options for our channel letters are shown on the channel letters page.",
    link: { label: "Mounting options", to: `${CHANNEL_LETTERS_PATH}#mounting` },
  },
];

/** Placeholder slot for the side-profile photograph. Set this to a real MediaImage to replace the placeholder card. */
export const sideProfileMedia: MediaImage | undefined = undefined;
export const SIDE_PROFILE_PLACEHOLDER = "Side-profile photography — coming soon";

const mmFmt = (mm: number) => `${mm} mm`;

/** Related EdgeLuxe systems, described from configurations.ts so the depths never contradict the brochure data. */
export const relatedSystems = ["lp-5-trimless-face-lit", "lp-11-f-face-lit"].map((id) => {
  const c = configurations.find((x) => x.id === id)!;
  const depths = c.depthOptionsMm;
  const depthText =
    id === "lp-5-trimless-face-lit"
      ? `Standard depths start at ${mmFmt(Math.min(...depths))}`
      : `${mmFmt(Math.max(...depths))} standard, ${mmFmt(Math.min(...depths))} for small letters`;
  return { id: c.id, code: c.code, subtitle: c.subtitle, img: c.img, depthText, summary: c.summary };
});
