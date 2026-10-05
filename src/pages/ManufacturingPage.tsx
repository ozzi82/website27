import { useEffect } from "react";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import SectionHeader from "../components/SectionHeader";
import ProductionStageCard from "../components/ProductionStageCard";
import ProcessSteps from "../components/home/ProcessSteps";
import RelatedLinks from "../components/RelatedLinks";
import FinalCTA from "../components/FinalCTA";
import { PrimaryCta } from "../components/CtaButton";
import { productionStages } from "../data/production";
import { COMPANY_LINE, COMPANY_POSITIONING } from "../lib/contact";
import { CTA_LINKS } from "../lib/cta";
import { breadcrumbJsonLd, type Crumb } from "../lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Manufacturing", to: "/manufacturing" },
];

/** What arrives with every order: only claims that already exist on the site. */
const readyToInstall = [
  { label: "Touch-up paint", value: "Every sign comes with touch-up paint." },
  { label: "Installation template", value: "Every sign ships with a printed installation template." },
  { label: "Crated and protected", value: "Packed to arrive ready to install." },
  { label: "Shipped nationwide", value: "To your shop, warehouse or, by arrangement, directly to the project site." },
  { label: "Installation", value: "Not provided. Installation is handled by you, your crew or a local contractor." },
];

/**
 * Production proof (brief sections 7 and 19): the six stages from data/production.ts (real photo, video or an honest
 * placeholder per stage), what ships with every order, the process, and the factual company line. No claims about where
 * a process takes place and no factory, staff or capacity figures.
 */
export default function ManufacturingPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Seo
        title="Manufacturing: Your Drawings In, Finished Signs Out"
        description="How Sunlite Signs turns your drawings into finished illuminated signage: CNC fabrication, LED and electrical, hand assembly, quality control, packaging and freight. Wholesale, trade only."
        path="/manufacturing"
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <section className="pt-8 pb-10 md:pb-12 steel-plate border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <Breadcrumbs items={crumbs} className="mb-10" />
          <SectionHeader
            as="h1"
            eyebrow="Manufacturing"
            title={
              <>
                Your Drawings In.
                <br />
                <span className="text-primary">Finished Signs Out.</span>
              </>
            }
            intro="Fabricated to your drawings and shipped ready to install: from CNC programming to the dock."
            action={<PrimaryCta />}
            className="mb-0 border-b-0 pb-0"
          />
        </div>
      </section>

      <section id="stages" className="py-12 md:py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {productionStages.map((stage, i) => (
              <ProductionStageCard key={stage.id} stage={stage} priority={i === 0} />
            ))}
          </div>
        </div>
      </section>

      <section id="ready-to-install" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-start">
          <div>
            <p className="mono-label text-primary mb-4">What ships with every order</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Ready to install.</h2>
          </div>
          <dl className="border-t border-border">
            {readyToInstall.map((r) => (
              <div key={r.label} className="grid sm:grid-cols-[11rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
                <dt className="mono-label text-muted-foreground pt-0.5">{r.label}</dt>
                <dd className="text-sm">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ProcessSteps />

      <section id="company" className="py-14 md:py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-end">
          <div>
            <p className="mono-label text-primary mb-4">Company</p>
            <p className="font-heading text-3xl md:text-4xl uppercase leading-tight">{COMPANY_LINE}</p>
          </div>
          <div>
            <p className="text-lg text-foreground/85 max-w-xl">{COMPANY_POSITIONING}</p>
            <p className="mono-label text-muted-foreground mt-5">Trade customers only · No retail sales</p>
          </div>
        </div>
      </section>

      <RelatedLinks
        items={[
          { to: CTA_LINKS.exploreUltraSlim.to, title: "Ultra-slim letters", text: "Our signature product: EdgeLuxe LP 11 cast block acrylic, 25–30 mm deep." },
          { to: CTA_LINKS.viewChannelLetters.to, title: "Classic trimless letters", text: "Fabricated stainless steel channel letters." },
          { to: CTA_LINKS.viewProjects.to, title: "Projects", text: "See recent production." },
          { to: "/about", title: "About", text: "Who we build for, and why the trade outsources to us." },
        ]}
      />
      <FinalCTA />
    </>
  );
}
