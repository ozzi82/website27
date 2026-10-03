import { Link } from "react-router-dom";
import { cn } from "@project/lib/utils";
import type { Crumb } from "../lib/seo";

/** Visible breadcrumb trail. Pair it with breadcrumbJsonLd(crumbs) so the structured data matches what is shown. */
export default function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mono-label text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.to + c.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {last ? (
                <span aria-current="page" className="text-foreground">{c.label}</span>
              ) : (
                <Link to={c.to} className="hover:text-primary transition-colors">{c.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
