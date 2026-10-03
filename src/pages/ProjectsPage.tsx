import { useEffect } from "react";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import SectionHeader from "../components/SectionHeader";
import ProjectCard from "../components/ProjectCard";
import RelatedLinks from "../components/RelatedLinks";
import FinalCTA from "../components/FinalCTA";
import { PrimaryCta } from "../components/CtaButton";
import { projects } from "../data/projects";
import { CTA_LINKS } from "../lib/cta";
import { breadcrumbJsonLd, type Crumb } from "../lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Projects", to: "/projects" },
];

/**
 * The one canonical projects page (the old /gallery redirects here). All entries come from data/projects.ts;
 * each card shows only the metadata that is known and links back to its product page when one is mapped.
 */
export default function ProjectsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Seo
        title="Projects: Recent Illuminated Letter Production"
        description="Recent illuminated letters and logos fabricated by Sunlite Signs for sign companies and trade partners. Wholesale channel letters, shipped ready to install nationwide."
        path="/projects"
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <section className="pt-8 pb-10 md:pb-12 steel-plate border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <Breadcrumbs items={crumbs} className="mb-10" />
          <SectionHeader
            as="h1"
            eyebrow="Recent production"
            title="See what we've built."
            intro="Illuminated letters and logos, fabricated to our partners' drawings."
            action={<PrimaryCta />}
            className="mb-0 border-b-0 pb-0"
          />
        </div>
      </section>
      <section id="projects" className="py-12 md:py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </div>
      </section>
      <RelatedLinks
        items={[
          { to: CTA_LINKS.viewChannelLetters.to, title: "Channel letters", text: "Front, halo and front + back lit, trimmed or trimless." },
          { to: CTA_LINKS.exploreUltraSlim.to, title: "Ultra-slim trimless", text: "A specialized option at 25–30 mm total depth." },
          { to: CTA_LINKS.viewManufacturing.to, title: "Manufacturing", text: "How drawings become finished signs." },
          { to: CTA_LINKS.viewCastAcrylic.to, title: "Cast acrylic", text: "Solid cast acrylic letters with homogeneous illumination." },
        ]}
      />
      <FinalCTA />
    </>
  );
}
