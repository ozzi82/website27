import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/home/Hero";
import TrustStrip from "../components/home/TrustStrip";
import ProductsSection from "../components/home/ProductsSection";
import TrustBadgeSection from "../components/home/TrustBadgeSection";
import UltraSlimSection from "../components/home/UltraSlimSection";
import ConfiguratorShowcase from "../components/home/ConfiguratorShowcase";
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
    "Wholesale sign manufacturer for sign companies: ultra-slim cast block acrylic letters, classic trimless stainless steel channel letters, flat cutout letters and custom sign fabrication, UL 48 listed and shipped ready-to-install nationwide. Trade only.",
  email: "hello@sunlitesigns.com",
  telephone: "+1-689-294-0912",
  areaServed: "United States",
  // Other places the company is listed; add the LinkedIn company page and any directory listing here when they exist.
  sameAs: ["https://www.facebook.com/profile.php?id=61553443110216"],
  knowsAbout: ["Channel letters", "Ultra-slim channel letters", "Cast block acrylic letters", "Trimless stainless steel letters", "Illuminated signage", "UL 48 certification"],
};

/**
 * Homepage (brief section 17, ultra-slim first per the owner taxonomy): hero, capability strip, products, ultra-slim LP 11 series, "Build Your Sign" configurator showcase, why outsource,
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
        description="Wholesale channel letter manufacturer for sign companies. Ultra-slim cast acrylic letters and classic trimless channel letters built to your drawings, UL 48 listed, shipped nationwide. Trade only."
        path="/"
        jsonLd={jsonLd}
      />
      <Hero />
      <TrustStrip />
      <ProductsSection />
      <TrustBadgeSection />
      <UltraSlimSection />
      <ConfiguratorShowcase />
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
