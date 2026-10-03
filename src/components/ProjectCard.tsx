import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { projectMeta, type Project } from "../data/projects";
import MediaFrame from "./MediaFrame";

/**
 * A project photo with context: title plus whichever metadata is known (product, depth, illumination,
 * finish, mounting). Absent fields render nothing; a card can link back to its product page.
 */
export default function ProjectCard({ project, index }: { project: Project; index?: number }) {
  const meta = projectMeta(project);
  return (
    <article className="group flex flex-col border border-border bg-card/50" data-project={project.id}>
      <MediaFrame
        image={{ src: project.image, alt: project.alt, width: project.width, height: project.height }}
        aspect="aspect-[4/3]"
        className="border-b border-border"
        imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="p-5 flex-1 flex flex-col">
        {index !== undefined && <p className="mono-label text-muted-foreground">Fig. {String(index + 1).padStart(2, "0")}</p>}
        <h3 className="text-2xl mt-1">{project.title}</h3>
        {meta.length > 0 && (
          <dl className="mt-4 pt-4 border-t border-border grid gap-2">
            {meta.map((m) => (
              <div key={m.label} className="grid grid-cols-[6.5rem_1fr] gap-3">
                <dt className="mono-label text-muted-foreground pt-0.5">{m.label}</dt>
                <dd className="text-sm">{m.value}</dd>
              </div>
            ))}
          </dl>
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
