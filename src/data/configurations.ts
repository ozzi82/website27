// Source of truth for the 12 EdgeLuxe letter configurations, taken from the
// "European Wholesale Signage Spec Guide" brochure (2026-27). Used by the
// product pages, the nav, and the 3D configurator, so keep them in sync here.
// Dimensions are US-first with metric in parentheses.
//
// Lighting codes in the brochure names: F = face, B = back (halo), S = side, N = neon, C = conical.
// So LP 11-FS lights the face AND a partial band on the front side edge (owner clarification, 2026-10-03).

/** How the face of the letter behaves when lit. */
export type FaceLight = "none" | "glow";
/** Wall halo: "standoff" = letter floats off the wall on spacers, light washes the wall behind it. */
export type HaloLight = "none" | "standoff";
/** Light leaking out of a band on the letter's side wall. */
export type SideLight = "none" | "partial-back" | "partial-front" | "full";
/** Cross-section of the letter. */
export type Profile = "flat" | "standard" | "tube" | "conical";
/** How a letter is carried: flush against the wall, or held off it on stand-off spacers. */
export type Mount = "standoff" | "flush";

export interface LightBehavior {
  face: FaceLight;
  halo: HaloLight;
  side: SideLight;
  /**
   * Share of the side wall's depth (0-1) that glows, for the partial modes. Left out, the brochure's nominal
   * exposed band applies (LP 3.2 / 11-BS / 11-FS). LP 11-N lights the front half of the side wall: 0.5.
   */
  sideBand?: number;
}

export interface LightConfig {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  family: "Flat cutout" | "Stainless steel" | "Block acrylic";
  summary: string;
  description: string;
  specs: { label: string; value: string }[];
  /** Render of the letter lit at night (1200 x 900); LP 1 has one unlit photo only (also 1200 x 900). */
  img: string;
  /** The same letter by day, where there is a day render. */
  imgDay?: string;
  /**
   * An optional build of the same system (owner, 2026-10-05): LP 5 can also be LP 5+3.1, face AND halo lit, with the
   * back and the front made of acrylic. It replaces the light behaviour and, because the halo needs the gap, the mounts.
   */
  variant?: { code: string; label: string; note: string; light: LightBehavior; mounts: Mount[] };
  profile: Profile;
  light: LightBehavior;
  /** The mountings the letter is offered with (owner list, updated 2026-10-05). Halo letters need the gap, so they are stand-off only; most others are flush only. */
  mounts: Mount[];
  /** Selectable depths in millimetres (the brochure's standard sizes). */
  depthOptionsMm: number[];
  /** True if the brochure offers custom depths beyond the standard list. */
  customDepth: boolean;
  minHeightMm: number;
  minStrokeMm: number;
}

const IMG = "/images/edgeluxe/";
const COMMON_TAIL = [
  { label: "Warranty", value: "3 years" },
  { label: "Certification", value: "UL Listed" },
];
const PMS_FACE_LIT =
  "Painted in any PMS color, with options for vinyls or pigmented translucent acrylics for colored face-lit effects.";
const PMS_HALO =
  "Painted in any PMS color, with options for vinyls or pigmented translucent acrylics for colorful halo effects.";
const STEEL_DEPTHS = [30, 50, 75, 100];
const STEEL_DEPTH_TEXT = '1.2" (30 mm), 2" (50 mm), 3" (75 mm), 4" (100 mm) and custom depth';
const ACRYLIC_SEALING = 'Epoxy-sealed for IP67 waterproofing and heat dissipation.';
const ACRYLIC_MAINT = "IP67 water- and dust-proof, no maintenance";

const baseConfigurations: LightConfig[] = [
  {
    id: "lp-1-flat-cutout",
    code: "LP 1",
    title: "EdgeLuxe LP 1",
    subtitle: "Flat Cutout Letters (FCO)",
    family: "Flat cutout",
    summary: "Precision-cut flat letters in wood, aluminum, stainless steel, acrylic and more.",
    description:
      "Flat cutout letters are cut from a single sheet of material, from ultra-thin 0.039\" (1 mm) up to 7.87\" (200 mm) thick. They are unlit and need no maintenance, a clean choice for architectural and interior lettering in a broad range of materials and finishes.",
    specs: [
      { label: "Materials", value: "Wood, aluminum, stainless steel, acrylic and many more" },
      { label: "Illumination", value: "None (unlit)" },
      { label: "Thickness", value: '0.039" (1 mm) to 7.87" (200 mm)' },
      { label: "Customization", value: "Broad range of acrylic colors, paint and vinyl" },
      { label: "Min. stroke width", value: '0.2" (5 mm)' },
      { label: "Min. height", value: '0.4" (10 mm)' },
      { label: "Maintenance", value: "No maintenance" },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-1-flat-cutout-gold.jpg",
    profile: "flat",
    light: { face: "none", halo: "none", side: "none" },
    mounts: ["standoff", "flush"],
    depthOptionsMm: [1, 5, 10, 20, 50, 100, 200],
    customDepth: false,
    minHeightMm: 10,
    minStrokeMm: 5,
  },
  {
    id: "lp-3-1-standoff-halo",
    code: "LP 3.1",
    title: "EdgeLuxe LP 3.1",
    subtitle: "Fabricated Stainless Steel with Standoffs",
    family: "Stainless steel",
    summary: "Halo-illuminated fabricated stainless steel letters floating off the wall on standoffs.",
    description:
      "Fabricated stainless steel letters, halo-illuminated from the back on standoff spacers so light washes the wall behind each letter. The LEDs are arranged to avoid reflection of the diodes on the mounting surface, for a soft, even halo.",
    specs: [
      { label: "Illumination", value: "Halo illuminated from the back with standoff spacers; LEDs arranged to avoid reflection of diodes on the mounting surface" },
      { label: "Depth", value: STEEL_DEPTH_TEXT },
      { label: "Customization", value: PMS_HALO.replace("Painted", "Painted") },
      { label: "Min. stroke width", value: '0.5" (15 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Maintenance", value: "Serviceable LEDs" },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-3-1-standoff-halo-night.jpg",
    imgDay: IMG + "lp-3-1-standoff-halo-day.jpg",
    profile: "standard",
    light: { face: "none", halo: "standoff", side: "none" },
    mounts: ["standoff"],
    depthOptionsMm: STEEL_DEPTHS,
    customDepth: true,
    minHeightMm: 50,
    minStrokeMm: 15,
  },
  {
    id: "lp-3-2-flush-mount",
    code: "LP 3.2",
    title: "EdgeLuxe LP 3.2",
    subtitle: "Fabricated Stainless Steel Flush-mount",
    family: "Stainless steel",
    summary: "Flush-mounted stainless steel letters with a partial side-lit halo effect.",
    description:
      "Fabricated stainless steel letters mounted flush to the wall, with a partially side-lit halo effect from an exposed acrylic band (standard exposed thickness 0.39\" / 10 mm) that glows around the edge of each letter.",
    specs: [
      { label: "Illumination", value: "Partial side-lit halo effect" },
      { label: "Depth", value: STEEL_DEPTH_TEXT },
      { label: "Exposed acrylic", value: 'Standard thickness of exposed acrylic is 0.39" (10 mm)' },
      { label: "Customization", value: PMS_HALO },
      { label: "Min. stroke width", value: '0.5" (15 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Maintenance", value: "Serviceable LEDs" },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-3-2-flush-mount-night.jpg",
    imgDay: IMG + "lp-3-2-flush-mount-day.jpg",
    profile: "standard",
    light: { face: "none", halo: "none", side: "partial-back" },
    mounts: ["flush"],
    depthOptionsMm: STEEL_DEPTHS,
    customDepth: true,
    minHeightMm: 50,
    minStrokeMm: 15,
  },
  {
    id: "lp-5-trimless-face-lit",
    code: "LP 5",
    title: "EdgeLuxe LP 5",
    subtitle: "Trimless Fabricated Stainless Steel Letters",
    family: "Stainless steel",
    summary: "Face-lit, trimless stainless steel channel letters for façades and canopies.",
    description:
      "Thick gauge stainless steel returns and back, welded together, with a step-routed acrylic face and no trim cap. A crisp, low-profile face-lit letter that suits building façade and canopy signage at larger scale.",
    specs: [
      { label: "Materials", value: "Thick gauge stainless steel returns and back welded together; step-router acrylic face, trimless" },
      { label: "Illumination", value: "Face-lit" },
      { label: "Depth", value: STEEL_DEPTH_TEXT },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.5" (15 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Maintenance", value: "Serviceable LEDs" },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-5-trimless-face-lit-night.jpg",
    imgDay: IMG + "lp-5-trimless-face-lit-day.jpg",
    variant: {
      code: "LP 5+3.1",
      label: "Face + halo",
      note: "Face and halo lit; the back and the front are made of acrylic",
      light: { face: "glow", halo: "standoff", side: "none" },
      mounts: ["standoff"],
    },
    profile: "standard",
    light: { face: "glow", halo: "none", side: "none" },
    mounts: ["flush"],
    depthOptionsMm: STEEL_DEPTHS,
    customDepth: true,
    minHeightMm: 50,
    minStrokeMm: 15,
  },
  {
    id: "lp-11-f-face-lit",
    code: "LP 11-F",
    title: "EdgeLuxe LP 11-F",
    subtitle: "Block Acrylic Face-lit",
    family: "Block acrylic",
    summary: "Solid cast block acrylic letters with embedded LEDs for uniform face lighting.",
    description:
      "Cast block acrylic letters with LEDs embedded in the body for uniform face lighting, from letters as small as 2\" tall. Epoxy-sealed to IP67, so they are waterproof, dust-proof and maintenance-free.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform face lighting" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion; 1" (25 mm) for small letters and signs' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-f-face-lit-night.jpg",
    imgDay: IMG + "lp-11-f-face-lit-day.jpg",
    profile: "standard",
    light: { face: "glow", halo: "none", side: "none" },
    mounts: ["flush"],
    depthOptionsMm: [25, 30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
  {
    id: "lp-11-b-back-lit",
    code: "LP 11-B",
    title: "EdgeLuxe LP 11-B",
    subtitle: "Block Acrylic Back-lit",
    family: "Block acrylic",
    summary: "Block acrylic letters with a uniform halo on the wall behind, on standoff spacers.",
    description:
      "Cast block acrylic letters with embedded LEDs that wash the wall behind each letter with a uniform halo, mounted on standoff spacers. Available in four depths from 0.39\" to 1.2\".",
    specs: [
      { label: "Materials", value: '0.39"-1.2" (10-30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform halo-lit with standoff spacers" },
      { label: "Depth", value: '0.39" (10 mm), 0.5" (15 mm), 0.78" (20 mm) and 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: "Painted in any PMS color, with options for vinyls or pigmented translucent acrylics for colored halo-lit effects." },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-b-back-lit-night.jpg",
    imgDay: IMG + "lp-11-b-back-lit-day.jpg",
    profile: "standard",
    light: { face: "none", halo: "standoff", side: "none" },
    mounts: ["standoff"],
    depthOptionsMm: [10, 15, 20, 30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
  {
    id: "lp-11-fb-face-halo",
    code: "LP 11-FB",
    title: "EdgeLuxe LP 11-FB",
    subtitle: "Block Acrylic Face- and Halo-lit Combo",
    family: "Block acrylic",
    summary: "Face-lit and halo-lit in one letter: a glowing face plus a wall halo.",
    description:
      "Cast block acrylic letters that combine uniform face lighting with a halo on the wall behind, on standoff spacers. Epoxy-sealed to IP67 and maintenance-free.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform face- and halo-lit with standoff spacers" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-fb-face-halo-night.jpg",
    imgDay: IMG + "lp-11-fb-face-halo-day.jpg",
    profile: "standard",
    light: { face: "glow", halo: "standoff", side: "none" },
    mounts: ["standoff"],
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
  {
    id: "lp-11-bs-back-side-lit",
    code: "LP 11-BS",
    title: "EdgeLuxe LP 11-BS",
    subtitle: "Block Acrylic Partial Back Side-lit",
    family: "Block acrylic",
    summary: "Letters, flush or stand-off mounted, with light glowing from the back edge of the side wall.",
    description:
      "Cast block acrylic letters that mount flush to the wall or on standoffs, with embedded LEDs for a uniform partial back side-lit effect: a band of light glows around the back edge of each letter.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform partial back side-lit" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-bs-back-side-lit-night.jpg",
    imgDay: IMG + "lp-11-bs-back-side-lit-day.jpg",
    profile: "standard",
    light: { face: "none", halo: "none", side: "partial-back" },
    mounts: ["standoff", "flush"],
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
  {
    id: "lp-11-fs-front-side-lit",
    code: "LP 11-FS",
    title: "EdgeLuxe LP 11-FS",
    subtitle: "Block Acrylic Face-lit + Partial Front Side-lit",
    family: "Block acrylic",
    summary: "Letters, flush or stand-off mounted, with a glowing face and a thin band of light along the front edge of the side wall.",
    description:
      "Cast block acrylic letters that mount flush to the wall or on standoffs, with embedded LEDs for uniform face lighting plus a partial front side-lit effect: the face glows and a thin band of light also glows around the front edge of each letter, outlining the face.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform face lighting plus partial front side lighting" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-fs-front-side-lit-night.jpg",
    imgDay: IMG + "lp-11-fs-front-side-lit-day.jpg",
    profile: "standard",
    light: { face: "glow", halo: "none", side: "partial-front" },
    mounts: ["standoff", "flush"],
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
  {
    id: "lp-11-s-side-lit",
    code: "LP 11-S",
    title: "EdgeLuxe LP 11-S",
    subtitle: "Block Acrylic Full Side-lit",
    family: "Block acrylic",
    summary: "Letters whose entire side wall glows, with an opaque painted face.",
    description:
      "Cast block acrylic letters with embedded LEDs for uniform full side lighting: the whole side wall of each letter glows while the painted face stays solid.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform full side-lit" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.79" (20 mm) recommended for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-s-side-lit-night.jpg",
    imgDay: IMG + "lp-11-s-side-lit-day.jpg",
    profile: "standard",
    light: { face: "none", halo: "none", side: "full" },
    mounts: ["flush"],
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 20,
  },
  {
    id: "lp-11-n-faux-neon",
    code: "LP 11-N",
    title: "EdgeLuxe LP 11-N",
    subtitle: "Block Acrylic Faux Neon",
    family: "Block acrylic",
    summary: "Block acrylic with a routed, rounded front edge that simulates a neon glass tube, lit on the face and the front half of the side.",
    description:
      "Cast block acrylic with the front edge routed round (up to 0.5\" / 12.7 mm, never more than half the thickness) to simulate a neon glass tube. Embedded LEDs light the face and the front half of the side wall; the back half of the side stays unlit. The neon look without glass, with IP67 sealing and no maintenance.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs light the face and the front half of the side wall; the back half of the side is unlit" },
      { label: "Edge profile", value: 'Front edge routed round to simulate a neon glass tube: up to 0.5" (12.7 mm), at most half the thickness' },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-n-faux-neon-night.jpg",
    imgDay: IMG + "lp-11-n-faux-neon-day.jpg",
    profile: "tube",
    light: { face: "glow", halo: "none", side: "partial-front", sideBand: 0.5 },
    mounts: ["flush"],
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
  {
    id: "lp-11-c-conical",
    code: "LP 11-C",
    title: "EdgeLuxe LP 11-C",
    subtitle: "Block Acrylic Conical Profile",
    family: "Block acrylic",
    summary: "Face-lit letters with a tapered conical profile for narrow strokes and serifs.",
    description:
      "Cast block acrylic letters with a conical profile that lets the lit face be much narrower than the body, for fine strokes and serif typefaces. The minimum body stroke width is 0.47\" (12 mm), but the stroke width on the face can be as narrow as 0.12\" (3 mm).",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform face-lit, conical profile for narrow strokes and serifs" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: 'Body 0.47" (12 mm); face as narrow as 0.12" (3 mm)' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-c-conical-night.jpg",
    imgDay: IMG + "lp-11-c-conical-day.jpg",
    profile: "conical",
    light: { face: "glow", halo: "none", side: "none" },
    mounts: ["flush"],
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
];

/** The mounting a letter starts on: flush where it is offered, otherwise stand-off. */
export function defaultMount(c: Pick<LightConfig, "mounts">): Mount {
  return c.mounts.includes("flush") ? "flush" : "standoff";
}

export const MOUNT_LABEL: Record<Mount, string> = { flush: "Flush", standoff: "Stand-off" };

/** The brochure-style mounting line for a configuration's spec list. */
export function mountingText(c: Pick<LightConfig, "mounts">): string {
  if (c.mounts.length > 1) return "Flush to the wall or on stand-off spacers";
  return c.mounts[0] === "standoff"
    ? "Stand-off spacers only: the halo needs the gap to reach the wall"
    : "Flush to the wall";
}

/** Every configuration, with its mounting line added to the specs (before the closing warranty and certification rows). */
export const configurations: LightConfig[] = baseConfigurations.map((c) => {
  const rows = [{ label: "Mounting", value: mountingText(c) }];
  if (c.variant) rows.push({ label: "Option", value: `${c.variant.code}: ${c.variant.note.toLowerCase()}; stand-off mounted (the halo needs the gap to the wall)` });
  const at = c.specs.findIndex((r) => r.label === "Warranty");
  const specs = at === -1 ? [...c.specs, ...rows] : [...c.specs.slice(0, at), ...rows, ...c.specs.slice(at)];
  return { ...c, specs };
});
