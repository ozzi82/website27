import type { Faq } from "../components/FAQSection";
import type { MediaImage } from "./production";
import type { SpecRow } from "./channelLetters";
import { CHANNEL_LETTERS_PATH, ULTRA_SLIM_PATH } from "./channelLetters";

export { CUSTOM_FABRICATION_PATH } from "./channelLetters";

/**
 * Content for /services/custom-sign-fabrication. Blade signs and push-through cabinet signs are offered ONLY as part of
 * custom fabrication (owner clarification, docs/briefs/2026-10-03-product-taxonomy-clarification.md). The cabinet and
 * blade wording is the owner's earlier "Cabinet Signs" entry: "Illuminated cabinets with CNC-routed aluminum faces and
 * push-through acrylic graphics, single, double-sided or blade", size "custom to drawing", aluminum cabinet + acrylic,
 * internal LED, UL 48 listed, 3-year LED + power-supply warranty. The custom logo / illuminated letter wording is the
 * existing "Custom logos & illuminated letter projects" copy. Sizes are "custom to project": no dimensions are stated.
 */

export const customMeta = {
  title: "Custom Sign Fabrication: Blade and Cabinet Signs",
  description:
    "Custom sign fabrication to your drawings: illuminated blade signs, push-through cabinet signs, custom logos and letter projects. Wholesale to sign companies, trade only.",
  intro:
    "When the job is not a standard letter system, send us the drawing. We fabricate custom signs to your drawings and ship them ready to install: blade signs, push-through cabinet signs and custom illuminated letters and logos.",
  heroImage: {
    src: "/images/pasted-image-1787683159993-jg0ymerg.png",
    alt: "Illuminated MUSTANG lettering on a dark sign panel above a storefront at night",
    width: 1536,
    height: 1024,
  } satisfies MediaImage,
};

export interface CustomOffer {
  id: string;
  title: string;
  /** Spec-style tag under the title. */
  tag: string;
  text: string;
}

export const customOffers: CustomOffer[] = [
  {
    id: "cabinet",
    title: "Push-through cabinet signs",
    tag: "Single or double-sided",
    text: "Illuminated cabinets with CNC-routed aluminum faces and push-through acrylic graphics that glow evenly. Made as wall-mounted single-sided cabinets or double-sided signs.",
  },
  {
    id: "blade",
    title: "Blade signs",
    tag: "Double-sided",
    text: "Double-sided illuminated blade signs, fabricated to your drawing.",
  },
  {
    id: "logos",
    title: "Illuminated logos & letter projects",
    tag: "Custom letterforms",
    text: "Logos, custom letterforms and other illuminated letter projects, fabricated to your drawings. Send your artwork as a vector file and we advise on materials, light effects, sizing and technical feasibility.",
  },
];

export const customSpecs: SpecRow[] = [
  { label: "Product", value: "Custom signs made to your drawings" },
  { label: "Includes", value: "Blade signs, push-through cabinet signs, illuminated logos and custom letter projects" },
  { label: "Size", value: "Custom to project: set by your drawing" },
  { label: "Cabinet material", value: "CNC-routed aluminum face with push-through acrylic graphics" },
  { label: "Lighting", value: "Internal LED" },
  { label: "Configuration", value: "Single-sided, double-sided or blade" },
  { label: "Certification", value: "UL 48 listed" },
  { label: "Warranty", value: "3 years, LED modules and power supplies" },
  { label: "Quote", value: "Tailored quote in 24 to 48 hours, most times 24 hours" },
  { label: "Delivery", value: "Crated and shipped nationwide, ready to install, with a printed installation template and touch-up paint" },
  { label: "Installation", value: "Not provided. Installation is handled by you or your contractor." },
  { label: "Sold to", value: "Trade only: sign companies and industry professionals" },
];

/** Real photos shown as recent production, with no category claim beyond what is visible. */
export const customReferenceIds = ["acorn-crest", "panther-dome", "mustang"];

export const customFaqs: Faq[] = [
  {
    q: "What custom signs can you make?",
    a: "Blade signs, push-through cabinet signs, and custom illuminated letters and logos, all fabricated to your drawings.",
  },
  {
    q: "Do you make double-sided blade signs?",
    a: "Yes. Our illuminated cabinets are made single-sided, double-sided or as blade signs.",
  },
  {
    q: "What sizes are possible?",
    a: "Custom to your drawing. Send the dimensions with your artwork and we advise on feasibility.",
  },
  {
    q: "What files do you need for a quote?",
    a: "Logo as a vector file (AI, EPS, PDF), dimensions or dimension sketch, photos of the facade or installation site, desired light effect, and indoor/outdoor specification.",
  },
  {
    q: "Do you consult on technical feasibility?",
    a: "Yes. We advise on materials, light effects, sizing, and technical feasibility, and create visualizations on request.",
  },
  {
    q: "Are one-off projects possible?",
    a: "Yes. We manufacture both one-off projects and production runs, always to your project specifications.",
  },
  {
    q: "Are custom signs UL listed?",
    a: "Our illuminated signage is UL 48 listed. LED modules and power supplies carry a 3-year warranty.",
  },
  {
    q: "Do you handle installation?",
    a: "No. Signs ship ready to install, with a printed installation template and touch-up paint. Installation is handled by you, your crew, your electrician or a local contractor.",
  },
  {
    q: "Do you sell custom signs to retail customers?",
    a: "No. Sunlite Signs is a trade-only wholesale manufacturer for sign companies, agencies, shopfitters and other trade professionals.",
  },
];

/** Where else to go from here: the letter systems and the unlit flat cutouts. */
export const customRelated = [
  { to: ULTRA_SLIM_PATH, title: "Ultra-slim letters", text: "EdgeLuxe LP 11 cast block acrylic, 25–30 mm deep." },
  { to: CHANNEL_LETTERS_PATH, title: "Classic trimless letters", text: "Fabricated stainless steel: LP 5, LP 3.1 and LP 3.2." },
  { to: "/light-effects/lp-1-flat-cutout", title: "Flat cutout letters", text: "Non-illuminated LP 1 letters in wood, metal, acrylic and more." },
  { to: "/configurator", title: "Build Your Sign", text: "Preview your logo as a letter system in 3D before you request pricing." },
];
