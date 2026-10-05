/**
 * Manufacturing stages (brief section 7). Each stage can carry a real `image` or a `video` with a `poster`;
 * drop the asset in and the section renders it, no component change. Stages without media render an honest
 * typographic placeholder (never stock imagery).
 * Current photos: the CNC programming/bending machine shot and the hand-assembly/wiring bench shot only.
 */
export interface MediaImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface MediaVideo {
  /** Compressed web video (mp4/webm). Loaded only after the visitor presses play. */
  src: string;
  type?: string;
  /** Poster still shown (lazy-loaded) before play. */
  poster: MediaImage;
}

export interface ProductionStage {
  id: string;
  number: string;
  title: string;
  description: string;
  image?: MediaImage;
  video?: MediaVideo;
}

export const productionStages: ProductionStage[] = [
  {
    id: "cnc-fabrication",
    number: "01",
    title: "CNC Fabrication",
    description: "Precision-routed aluminum returns, faces and backs, built to your shop drawings.",
    image: {
      src: "/images/pasted-image-1787755330414-fxpkbj9m.png",
      alt: "Technician programming a CNC machine from a letter layout on screen",
      width: 1744,
      height: 1352,
    },
  },
  {
    id: "led-electrical",
    number: "02",
    title: "LED & Electrical",
    description: "Finished electric signs are UL listed to UL 48. Power supplies and LED modules are UL listed components.",
    image: {
      src: "/images/production-electrical.jpg",
      alt: "Sunlite Signs team fitting LED strips and wiring into green letter returns at the work table",
      width: 1280,
      height: 866,
    },
  },
  {
    id: "hand-assembly",
    number: "03",
    title: "Hand Assembly",
    description: "Letters assembled and wired by hand at the bench.",
    image: {
      src: "/images/production-hand-assembly.jpg",
      alt: "Sunlite Signs technician assembling a stainless steel letter return by hand at the work table",
      width: 1280,
      height: 720,
    },
  },
  {
    id: "quality-control",
    number: "04",
    title: "Quality Control",
    description: "Finished letters are checked before they are crated.",
    image: {
      src: "/images/production-quality-control.jpg",
      alt: "Two sets of white letters on the shop floor with wiring connected, one set lit for testing",
      width: 1280,
      height: 720,
    },
  },
  {
    id: "packaging",
    number: "05",
    title: "Packaging",
    description: "Crated and protected, with a printed installation template and touch-up paint.",
    image: {
      src: "/images/production-packaging.jpg",
      alt: "Letters wrapped in bubble wrap and nested in foam inside a plywood shipping crate",
      width: 1280,
      height: 720,
    },
  },
  {
    id: "ready-for-freight",
    number: "06",
    title: "Ready for Freight",
    description: "Labeled and shipped to your dock.",
    image: {
      src: "/images/production-ready-for-freight.jpg",
      alt: "Closed plywood shipping crate with a shipping label and handling symbols, ready for freight",
      width: 1600,
      height: 900,
    },
  },
];
