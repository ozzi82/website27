import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PlantHero, SpecRail, ProductLines } from "../components/plant/PlantTop";
import { Facility, Workflow, TradeStatement } from "../components/plant/PlantBottom";
import LightEffects from "../components/LightEffects";
import Seo from "../components/Seo";
import { SITE_NAME, SITE_URL } from "../lib/seo";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Wholesale B2B manufacturer of UL 48 listed channel letters, trimless letters, cast acrylic letters and illuminated cabinet signs, shipped ready-to-install nationwide.",
  email: "hello@sunlitesigns.com",
  telephone: "+1-689-294-0912",
  address: {
    "@type": "PostalAddress",
    streetAddress: "5005 W Laurel",
    addressLocality: "Tampa",
    addressRegion: "FL",
    postalCode: "33607",
    addressCountry: "US",
  },
  areaServed: "United States",
  knowsAbout: ["Channel letters", "Illuminated signage", "Cast acrylic letters", "Cabinet signs", "UL 48 certification"],
};

export default function HomePage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 300);
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <>
      <Seo
        title="Wholesale Channel Letters & Illuminated Signage Manufacturer"
        description="B2B production partner for channel letters, trimless letters, cast acrylic letters and illuminated cabinet signs. UL 48 listed, 48-hour quotes, shipped ready-to-install nationwide. Trade only."
        path="/"
        jsonLd={jsonLd}
      />
      <PlantHero />
      <SpecRail />
      <ProductLines />
      <Facility />
      <LightEffects />
      <Workflow />
      <TradeStatement />
    </>
  );
}
