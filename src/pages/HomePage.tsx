import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/home/Hero";
import TrustStrip from "../components/home/TrustStrip";
import ProductsSection from "../components/home/ProductsSection";
import UltraSlimSection from "../components/home/UltraSlimSection";
import OutsourcingSection from "../components/home/OutsourcingSection";
import ManufacturingSection from "../components/home/ManufacturingSection";
import ProjectsSection from "../components/home/ProjectsSection";
import ProcessSteps from "../components/home/ProcessSteps";
import TradeStatement from "../components/home/TradeStatement";
import LightEffects from "../components/LightEffects";
import FAQSection from "../components/FAQSection";
import FinalCTA from "../components/FinalCTA";
import Seo from "../components/Seo";
import { SITE_NAME, SITE_URL } from "../lib/seo";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Wholesale sign manufacturer for sign companies: UL 48 listed channel letters, ultra-slim trimless letters and cast acrylic letters, shipped ready-to-install nationwide. Trade only.",
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
  knowsAbout: ["Channel letters", "Ultra-slim trimless channel letters", "Illuminated signage", "Cast acrylic letters", "UL 48 certification"],
};

/**
 * Homepage (brief section 17): hero, capability strip, products, ultra-slim differentiator, why outsource,
 * manufacturing, projects, EdgeLuxe letter systems (+ configurator link), process, trade-only statement, FAQ, final CTA.
 */
export default function HomePage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 300);
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <>
      <Seo
        title="Wholesale Channel Letters for Sign Companies"
        description="Wholesale channel letter manufacturer for sign companies. Ultra-slim trimless and cast acrylic letters built to your drawings, UL 48 listed, shipped nationwide. Trade only."
        path="/"
        jsonLd={jsonLd}
      />
      <Hero />
      <TrustStrip />
      <ProductsSection />
      <UltraSlimSection />
      <OutsourcingSection />
      <ManufacturingSection />
      <ProjectsSection />
      <LightEffects />
      <ProcessSteps />
      <TradeStatement />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
