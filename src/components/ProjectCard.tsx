import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { projectMeta, type Project } from "../data/projects";
import { caseStudyForProject, caseStudyPath, type CaseStudy } from "../data/caseStudies";
import MediaFrame from "./MediaFrame";

/**
 * A project photo with context: title plus whichever metadata is known (product, depth, illumination,
 * finish, mounting). Absent fields render nothing; a card can link back to its product page, and to its case study
 * when one exists (data/caseStudies.ts: none ship yet, so no card links anywhere today).
 */
export default function ProjectCard({ project, index, caseStudy }: { project: Project; index?: number; caseStudy?: CaseStudy }) {
  const meta = projectMeta(project);
  const study = caseStudy ?? caseStudyForProject(project.id);
  return (
    <article className="group flex flex-col border border-border bg-card/50" data-project={project.id}>
      <MediaFrame
        image={{ src: project.image, alt: project.alt, width: project.width, height: project.height }}
        aspect="aspect-[4/3]"
        className="border-b border-border"
        imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        {index !== undefined && <p className="mono-label text-muted-foreground">Fig. {String(index + 1).padStart(2, "0")}</p>}
        <h3 className="text-lg sm:text-2xl mt-1 leading-tight">{project.title}</h3>
        {meta.length > 0 && (
          <dl className="mt-4 pt-4 border-t border-border grid gap-2">
            {meta.map((m) => (
              <div key={m.label} className="grid sm:grid-cols-[6.5rem_1fr] gap-x-3 gap-y-0.5">
                <dt className="mono-label text-muted-foreground pt-0.5">{m.label}</dt>
                <dd className="text-sm">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {caseStudy && <p className="text-sm text-muted-foreground mt-3">{caseStudy.summary}</p>}
        {study && (
          <Link
            to={caseStudyPath(study.slug)}
            className="mono-label mt-4 inline-flex items-center gap-2 text-primary hover:text-foreground transition-colors"
          >
            Read the case study <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
          </Link>
        )}
        {project.productSlug && (
          <Link
            to={`/services/${project.productSlug}`}
            className="mono-label mt-4 inline-flex items-center gap-2 text-primary hover:text-foreground transition-colors"
          >
            View {project.productType ?? "product"} <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
