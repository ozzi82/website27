import SectionHeader from "../SectionHeader";
import ProjectCard from "../ProjectCard";
import { PrimaryCta, SecondaryCta } from "../CtaButton";
import { featuredProjects } from "../../data/projects";
import { CTA_LINKS } from "../../lib/cta";

export default function ProjectsSection() {
  return (
    <section id="projects" className="py-14 md:py-28 border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="Recent production" title="See what we've built." />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
          {featuredProjects().map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <SecondaryCta label={CTA_LINKS.viewAllProjects.label} to={CTA_LINKS.viewAllProjects.to} />
          <PrimaryCta />
        </div>
      </div>
    </section>
  );
}
