import type { ReactNode } from "react";
import { cn } from "@project/lib/utils";

interface SectionHeaderProps {
  /** Small orange mono label above the headline ("WHAT WE BUILD"). */
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Right-aligned slot (links/buttons) on wide screens. */
  action?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
  titleClassName?: string;
}

/** Editorial section opener shared by the homepage sections (and Phase 2 pages). */
export default function SectionHeader({ eyebrow, title, intro, action, as: Heading = "h2", className, titleClassName }: SectionHeaderProps) {
  return (
    <div className={cn("mb-10 md:mb-14 border-b border-border pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6", className)}>
      <div className="max-w-3xl">
        <p className="mono-label text-primary mb-4">{eyebrow}</p>
        <Heading className={cn("text-4xl sm:text-5xl md:text-6xl lg:text-7xl", titleClassName)}>{title}</Heading>
        {intro && <p className="text-muted-foreground mt-6 max-w-xl">{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
