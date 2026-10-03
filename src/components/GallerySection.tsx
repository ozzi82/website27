import ProjectCard from "./ProjectCard";
import { PrimaryCta } from "./CtaButton";
import { projects } from "../data/projects";

/** All projects from data/projects.ts, each with whatever context is known. */
export default function GallerySection() {
  return (
    <section id="projects" className="py-16 md:py-24 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
        <div className="mt-10">
          <PrimaryCta />
        </div>
      </div>
    </section>
  );
}
