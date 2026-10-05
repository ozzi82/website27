import { cn } from "@project/lib/utils";

/**
 * The UL mark (owner-supplied, public/images/ul-mark.svg, never recoloured or distorted) with a short factual caption.
 * Used where "UL 48 listed" is stated, so the claim and the mark sit together.
 */
export default function ULBadge({ label = "UL 48 listed signs", size = 32, className }: { label?: string; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-sm font-medium text-foreground/90", className)}>
      <img src="/images/ul-mark.svg" alt="UL mark" width={size} height={size} loading="lazy" decoding="async" style={{ width: size, height: size }} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
}
