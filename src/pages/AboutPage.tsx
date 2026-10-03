import { useEffect } from "react";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import SectionHeader from "../components/SectionHeader";
import OutsourcingSection from "../components/home/OutsourcingSection";
import TradeStatement from "../components/home/TradeStatement";
import TargetGroups from "../components/TargetGroups";
import FAQSection from "../components/FAQSection";
import RelatedLinks from "../components/RelatedLinks";
import FinalCTA from "../components/FinalCTA";
import { PrimaryCta } from "../components/CtaButton";
import { COMPANY_LINE, COMPANY_POSITIONING, EMAIL, PHONE_DISPLAY, PHONE_NUMBER } from "../lib/contact";
import { CTA_LINKS } from "../lib/cta";
import { breadcrumbJsonLd, type Crumb } from "../lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
];

const details: { label: string; value: React.ReactNode }[] = [
  { label: "Address", value: "5005 W Laurel · Tampa, FL 33607" },
  { label: "Phone", value: <a href={`tel:${PHONE_NUMBER}`} className="hover:text-primary transition-colors">{PHONE_DISPLAY}</a> },
  { label: "Email", value: <a href={`mailto:${EMAIL}`} className="hover:text-primary transition-colors">{EMAIL}</a> },
  { label: "Who we sell to", value: "Trade customers only. No retail sales. No installation services." },
];

/**
 * About = who Sunlite is, who it builds for and why the trade outsources to it. The production proof lives on /manufacturing.
 */
export default function AboutPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Seo
        title="About: Wholesale Sign Manufacturing Partner"
        description="Sunlite Signs LLC is a trade-only wholesale manufacturing partner for sign companies, agencies and trade professionals. We build for them and never compete for their customers."
        path="/about"
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <section className="pt-8 pb-10 md:pb-12 steel-plate border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <Breadcrumbs items={crumbs} className="mb-10" />
          <SectionHeader
            as="h1"
            eyebrow="About Sunlite Signs"
            title={
              <>
                A production partner
                <br />
                <span className="text-primary">for sign companies.</span>
              </>
            }
            intro="Sunlite Signs LLC is a wholesale manufacturing partner for sign companies, agencies and trade professionals. We fabricate ultra-slim and classic channel letters and illuminated signage to your drawings and ship them ready to install."
            action={<PrimaryCta />}
            className="mb-0 border-b-0 pb-0"
          />
        </div>
      </section>

      <OutsourcingSection />
      <TargetGroups />
      <TradeStatement />

      <section id="contact-details" className="py-14 md:py-20 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-start">
          <div>
            <p className="mono-label text-primary mb-4">Company</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">{COMPANY_LINE}</h2>
            <p className="text-muted-foreground mt-4 max-w-sm">{COMPANY_POSITIONING}</p>
          </div>
          <dl className="border-t border-border">
            {details.map((d) => (
              <div key={d.label} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
                <dt className="mono-label text-muted-foreground pt-0.5">{d.label}</dt>
                <dd className="text-sm">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <FAQSection />

      <RelatedLinks
        items={[
          { to: CTA_LINKS.exploreUltraSlim.to, title: "Ultra-slim letters", text: "Our signature product: EdgeLuxe LP 11 cast block acrylic, 25–30 mm deep." },
          { to: CTA_LINKS.viewChannelLetters.to, title: "Classic trimless letters", text: "Fabricated stainless steel channel letters." },
          { to: CTA_LINKS.viewManufacturing.to, title: "Manufacturing", text: "How drawings become finished signs." },
          { to: CTA_LINKS.viewProjects.to, title: "Projects", text: "See recent production." },
        ]}
      />
      <FinalCTA />
    </>
  );
}
