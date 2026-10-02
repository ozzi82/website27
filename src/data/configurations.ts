const P = "https://images.fillout.com/orgid-779834/flowpublicid-qfzct8lfax/widgetid-default/";

// Placeholder day/night pairs — replace per configuration later.
const pairs = [
  ["/images/pasted-image-1786570375809-rwu26du4.jpg", "/images/pasted-image-1786570375947-h0wyc0wv.jpg"],
  ["/images/pasted-image-1786570376374-6us1e90k.jpg", "/images/pasted-image-1786570376502-qxjiefjq.jpg"],
  ["/images/pasted-image-1786570376134-up4s1wdz.jpg", "/images/pasted-image-1786570376266-cgc3d31k.jpg"],
  ["/images/pasted-image-1786570410639-6pavqage.jpg", "/images/pasted-image-1786570410759-tip5fu80.jpg"],
  ["/images/pasted-image-1786570410342-oxxnjk57.jpg", "/images/pasted-image-1786570410480-uma8xz77.jpg"],
];

export interface LightConfig {
  id: string;
  code: string;
  title: string;
  summary: string;
  description: string;
  specs: { label: string; value: string }[];
  dayImg: string;
  nightImg: string;
}

export const configurations: LightConfig[] = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  const [dayImg, nightImg] = pairs[i % pairs.length];
  return {
    id: `config-${n}`,
    code: `LC-${n}`,
    title: `Configuration ${n}`,
    summary: "Placeholder — short description of this light effect.",
    description: "Placeholder — describe how this configuration is built, how the light falls, and where it works best.",
    specs: [
      { label: "Illumination", value: "TBD" },
      { label: "Face", value: "TBD" },
      { label: "Returns", value: "TBD" },
      { label: "Depth", value: "TBD" },
      { label: "LED", value: "TBD" },
      { label: "Certification", value: "UL 48 Listed" },
    ],
    dayImg,
    nightImg,
  };
});
