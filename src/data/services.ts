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
    id: "trimless-letters",
    title: "Trimless Letters",
    shortTitle: "Trimless Letters",
    desc: "Ultra-slim, seamlessly illuminated letters with a total depth under 1 1/4\".",
    img: "/images/pasted-image-1787683170345-8s9whs6f.jpg",
    details: {
      subtitle: "Ultra-slim profile. Zero visible trim cap.",
      description: "Trimless letters are fabricated without a trim cap, so the face and return read as one clean body. With a total depth under 1 1/4\", they deliver even illumination for architectural facades, lobbies and retail interiors.",
      specs: [
        { icon: Ruler, label: "Total Depth", value: 'Under 1 1/4"' },
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
      specs: [
        { icon: Ruler, label: "Letter Height", value: "Placeholder" },
        { icon: Layers, label: "Material", value: "Cast acrylic (PMMA)" },
        { icon: Lightbulb, label: "Lighting", value: "LED translucent" },
        { icon: Palette, label: "Colors", value: "Clear / Opal / Custom" },
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
  {
    id: "cabinet-signs",
    title: "Cabinet Signs",
    shortTitle: "Cabinet Signs",
    desc: "Illuminated cabinets with routed faces and push-through graphics – single, double-sided or blade.",
    img: "/images/pasted-image-1787683159993-jg0ymerg.png",
    details: {
      subtitle: "Routed aluminum faces with push-through acrylic",
      description: "Our cabinet signs combine a CNC-routed aluminum face with push-through acrylic graphics that glow evenly. Available as wall-mounted single-sided cabinets or double-sided blade signs.",
      specs: [
        { icon: Ruler, label: "Size", value: "Custom to drawing" },
        { icon: Layers, label: "Material", value: "Aluminum cabinet + acrylic" },
        { icon: Lightbulb, label: "Lighting", value: "LED internal" },
        { icon: Palette, label: "Configuration", value: "Single / double / blade" },
        { icon: Shield, label: "Certification", value: "UL 48 Listed" },
        { icon: Zap, label: "Warranty", value: "3 yrs LED + power supply" },
      ],
      gallery: [
        "/images/pasted-image-1787683185061-7qvr07qi.jpeg",
        "/images/pasted-image-1787684052162-akn1dsaq.jpg",
      ],
      dayImg: "/images/pasted-image-1786570375809-rwu26du4.jpg",
      nightImg: "/images/pasted-image-1786570375947-h0wyc0wv.jpg",
    },
  },
];
