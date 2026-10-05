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
    description: "LED modules and power supplies, UL 48 labeled.",
  },
  {
    id: "hand-assembly",
    number: "03",
    title: "Hand Assembly",
    description: "Letters assembled and wired by hand at the bench.",
    image: {
      src: "/images/pasted-image-1787755199271-ob18hn5t.png",
      alt: "Letter returns and LED wiring being assembled by hand on a work table",
      width: 1920,
      height: 1298,
    },
  },
  {
    id: "quality-control",
    number: "04",
    title: "Quality Control",
    description: "Finished letters are checked before they are crated.",
  },
  {
    id: "packaging",
    number: "05",
    title: "Packaging",
    description: "Crated and protected, with a printed installation template and touch-up paint.",
  },
  {
    id: "ready-for-freight",
    number: "06",
    title: "Ready for Freight",
    description: "Labeled and shipped to your dock.",
  },
];
