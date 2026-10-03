import { Ruler, Layers, Lightbulb, Palette, Shield, Zap } from "lucide-react";

export interface ServiceData {
  id: string;
  title: string;
  shortTitle: string;
  desc: string;
  img: string;
  details: {
    subtitle: string;
    description: string;
    specs: { icon: React.ElementType; label: string; value: string }[];
    gallery: string[];
    dayImg: string;
    nightImg: string;
  };
}

const P = "https://images.fillout.com/orgid-779834/flowpublicid-qfzct8lfax/widgetid-default/";

export const services: ServiceData[] = [
  {
    // Interim data for the generic ServicePage; Phase 2 replaces the page with a dedicated, richer one.
    // Only claims already on the site or supplied in the owner's brief are used here.
    id: "channel-letters",
    title: "Standard Channel Letters",
    shortTitle: "Channel Letters",
    desc: "Front lit, halo lit and dual illuminated channel letters built to project specifications.",
    img: "/images/pasted-image-1787166590951-kao0m19c.jpeg",
    details: {
      subtitle: "Illuminated channel letters, fabricated to your drawings",
      description: "Our main product line: illuminated channel letters fabricated to your shop drawings and shipped ready to install. Choose front lit, halo (reverse) lit or front + back lit, trimmed or trimless, with raceway or remote-mount configurations where applicable. For projects where a conventional return is too bulky, see our ultra-slim trimless option.",
      specs: [
        { icon: Layers, label: "Construction", value: "CNC-routed aluminum returns, faces and backs" },
        { icon: Lightbulb, label: "Illumination", value: "Front lit / halo (reverse) lit / front + back lit" },
        { icon: Ruler, label: "Face options", value: "Trimmed or trimless" },
        { icon: Palette, label: "Mounting", value: "Raceway or remote mount where applicable" },
        { icon: Shield, label: "Certification", value: "UL 48 Listed" },
        { icon: Zap, label: "Warranty", value: "3 yrs LED + power supply" },
      ],
      gallery: [
        "/images/pasted-image-1787166590876-4gqe7y4j.jpeg",
        "/images/pasted-image-1787166590730-o61irwkk.jpeg",
      ],
      dayImg: "/images/pasted-image-1786570375809-rwu26du4.jpg",
      nightImg: "/images/pasted-image-1786570375947-h0wyc0wv.jpg",
    },
  },
  {
    id: "ultra-slim-trimless-channel-letters",
    title: "Ultra-Slim Trimless Channel Letters",
    shortTitle: "Ultra-Slim Trimless",
    desc: "Premium illuminated letters available at just 25–30 mm total depth.",
    img: "/images/pasted-image-1787683170345-8s9whs6f.jpg",
    details: {
      subtitle: "25–30 mm total depth. Zero visible trim cap.",
      description: "Trimless letters are fabricated without a trim cap, so the face and return read as one clean body. At just 25–30 mm total depth, ultra-slim is a specialized option for projects where conventional channel-letter returns are too bulky, with even illumination for architectural facades, lobbies and retail interiors. It is not the standard depth of our channel letters.",
      specs: [
        { icon: Ruler, label: "Total Depth", value: "25–30 mm (about 1\" to 1.2\")" },
        { icon: Layers, label: "Construction", value: "Trimless, seamless face" },
        { icon: Lightbulb, label: "Lighting", value: "Face lit / halo / dual lit" },
        { icon: Palette, label: "Finishes", value: "Custom paint / vinyl" },
        { icon: Shield, label: "Certification", value: "UL 48 Listed" },
        { icon: Zap, label: "Warranty", value: "3 yrs LED + power supply" },
      ],
      gallery: [
        "/images/pasted-image-1787683165508-erx4nd1w.jpg",
        "/images/pasted-image-1787683199236-jg9mjykl.jpg",
      ],
      dayImg: "/images/pasted-image-1786570376134-up4s1wdz.jpg",
      nightImg: "/images/pasted-image-1786570376266-cgc3d31k.jpg",
    },
  },
  {
    id: "cast-block-acrylic",
    title: "Cast Block Acrylic Letters",
    shortTitle: "Cast Block Acrylic",
    desc: "Solid cast acrylic letters with homogeneous illumination – refined, premium brand presence.",
    img: "/images/pasted-image-1785345075402-x1ttofrm.png",
    details: {
      subtitle: "Premium illumination from a solid block",
      description: "Cast block acrylic letters are made from solid high-grade acrylic and glow evenly throughout. The result is a refined, homogeneous light effect, popular with luxury brands, hotels and flagship stores.",
      // Reconciled with the brochure's LP 11-F (EdgeLuxe) data in configurations.ts.
      specs: [
        { icon: Ruler, label: "Min. Letter Height", value: '2" (50 mm)' },
        { icon: Layers, label: "Material", value: "Cast acrylic (PMMA), 1.2\" (30 mm) standard; 1\" (25 mm) for small letters" },
        { icon: Lightbulb, label: "Lighting", value: "Embedded LEDs, uniform face lighting" },
        { icon: Palette, label: "Colors", value: "Any PMS color; vinyl or pigmented translucent acrylic options" },
        { icon: Shield, label: "Certification", value: "UL 48 Listed" },
        { icon: Zap, label: "Warranty", value: "3 yrs LED + power supply" },
      ],
      gallery: [
        "/images/pasted-image-1786571178138-56b8eh5p.jpg",
        "/images/pasted-image-1786571527961-nvve6zo0.jpg",
      ],
      dayImg: "/images/pasted-image-1786570376374-6us1e90k.jpg",
      nightImg: "/images/pasted-image-1786570376502-qxjiefjq.jpg",
    },
  },
];
