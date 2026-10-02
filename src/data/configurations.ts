// Source of truth for the 12 EdgeLuxe letter configurations, taken from the
// "European Wholesale Signage Spec Guide" brochure (2026-27). Used by the
// product pages, the nav, and the 3D configurator, so keep them in sync here.
// Dimensions are US-first with metric in parentheses.

/** How the face of the letter behaves when lit. */
export type FaceLight = "none" | "glow";
/** Wall halo: "standoff" = letter floats off the wall on spacers, light washes the wall behind it. */
export type HaloLight = "none" | "standoff";
/** Light leaking out of a band on the letter's side wall. */
export type SideLight = "none" | "partial-back" | "partial-front" | "full";
/** Cross-section of the letter. */
export type Profile = "flat" | "standard" | "tube" | "conical";
export type Mount = "flat" | "standoff" | "flush";

export interface LightBehavior {
  face: FaceLight;
  halo: HaloLight;
  side: SideLight;
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
  img: string;
  profile: Profile;
  light: LightBehavior;
  mount: Mount;
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

export const configurations: LightConfig[] = [
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
    img: IMG + "lp-1-flat-cutout.jpg",
    profile: "flat",
    light: { face: "none", halo: "none", side: "none" },
    mount: "flat",
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
    img: IMG + "lp-3-1-standoff-halo.jpg",
    profile: "standard",
    light: { face: "none", halo: "standoff", side: "none" },
    mount: "standoff",
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
      { label: "Illumination", value: "Partial side-lit flush-mounted halo effect" },
      { label: "Depth", value: STEEL_DEPTH_TEXT },
      { label: "Exposed acrylic", value: 'Standard thickness of exposed acrylic is 0.39" (10 mm)' },
      { label: "Customization", value: PMS_HALO },
      { label: "Min. stroke width", value: '0.5" (15 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Maintenance", value: "Serviceable LEDs" },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-3-2-flush-mount.jpg",
    profile: "standard",
    light: { face: "none", halo: "none", side: "partial-back" },
    mount: "flush",
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
    img: IMG + "lp-5-trimless-face-lit.jpg",
    profile: "standard",
    light: { face: "glow", halo: "none", side: "none" },
    mount: "flat",
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
    img: IMG + "lp-11-f-face-lit.jpg",
    profile: "standard",
    light: { face: "glow", halo: "none", side: "none" },
    mount: "flat",
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
    img: IMG + "lp-11-b-back-lit.jpg",
    profile: "standard",
    light: { face: "none", halo: "standoff", side: "none" },
    mount: "standoff",
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
    img: IMG + "lp-11-fb-face-halo.jpg",
    profile: "standard",
    light: { face: "glow", halo: "standoff", side: "none" },
    mount: "standoff",
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
    summary: "Flush-mount letters with light glowing from the back edge of the side wall.",
    description:
      "Cast block acrylic letters mounted flush to the wall, with embedded LEDs for a uniform partial back side-lit effect: a band of light glows around the back edge of each letter.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform partial back side-lit, flush-mount" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-bs-back-side-lit.jpg",
    profile: "standard",
    light: { face: "none", halo: "none", side: "partial-back" },
    mount: "flush",
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
  {
    id: "lp-11-fs-front-side-lit",
    code: "LP 11-FS",
    title: "EdgeLuxe LP 11-FS",
    subtitle: "Block Acrylic Partial Front Side-lit",
    family: "Block acrylic",
    summary: "Flush-mount letters with light glowing from the front edge of the side wall.",
    description:
      "Cast block acrylic letters mounted flush to the wall, with embedded LEDs for a uniform partial front side-lit effect: a band of light glows around the front edge of each letter, outlining the face.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform partial front side-lit, flush-mount" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-fs-front-side-lit.jpg",
    profile: "standard",
    light: { face: "none", halo: "none", side: "partial-front" },
    mount: "flush",
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
    img: IMG + "lp-11-s-side-lit.jpg",
    profile: "standard",
    light: { face: "none", halo: "none", side: "full" },
    mount: "flat",
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
    summary: "Routed block acrylic that simulates the look of a neon glass tube, face-lit.",
    description:
      "Cast block acrylic routed into a rounded profile to simulate a neon glass tube, with embedded LEDs for uniform face lighting. The neon look without glass, with IP67 sealing and no maintenance.",
    specs: [
      { label: "Materials", value: '1.2" (30 mm) cast block acrylic' },
      { label: "Illumination", value: "Embedded LEDs for uniform face-lit, routed to simulate neon glass tube" },
      { label: "Depth", value: 'Standard 1.2" (30 mm) for durability and optimal light diffusion' },
      { label: "Customization", value: PMS_FACE_LIT },
      { label: "Min. stroke width", value: '0.47" (12 mm) for stability and even illumination' },
      { label: "Min. height", value: '2" (50 mm)' },
      { label: "Sealing", value: ACRYLIC_SEALING },
      { label: "Maintenance", value: ACRYLIC_MAINT },
      ...COMMON_TAIL,
    ],
    img: IMG + "lp-11-n-faux-neon.jpg",
    profile: "tube",
    light: { face: "glow", halo: "none", side: "none" },
    mount: "flat",
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
    img: IMG + "lp-11-c-conical.jpg",
    profile: "conical",
    light: { face: "glow", halo: "none", side: "none" },
    mount: "flat",
    depthOptionsMm: [30],
    customDepth: false,
    minHeightMm: 50,
    minStrokeMm: 12,
  },
];
