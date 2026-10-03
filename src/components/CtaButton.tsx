import { Link } from "react-router-dom";
import { ArrowRight, Box } from "lucide-react";
import { Button } from "@project/components/ui/button";
import { cn } from "@project/lib/utils";
import { CTA_LINKS, CTA_PRIMARY } from "../lib/cta";

interface CtaButtonProps {
  /** Visual size: "lg" for page-level calls, "md" for the header. */
  size?: "md" | "lg";
  className?: string;
  /** Inverse colors for use on the orange trade-statement band. */
  tone?: "default" | "inverse";
  arrow?: boolean;
  /** Called after a click (e.g. to close the mobile menu). */
  onClick?: () => void;
}

/** The one primary conversion button: "Request Wholesale Pricing" -> /contact. */
export function PrimaryCta({ size = "lg", className, tone = "default", arrow = true, onClick }: CtaButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "uppercase tracking-wider font-semibold",
        size === "lg" ? "h-14 px-8" : "h-10 px-5 text-xs",
        tone === "inverse" && "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
        className,
      )}
    >
      <Link to={CTA_PRIMARY.to} onClick={onClick}>
        {CTA_PRIMARY.label}
        {arrow && <ArrowRight aria-hidden="true" />}
      </Link>
    </Button>
  );
}

interface SecondaryCtaProps {
  label: string;
  to: string;
  className?: string;
  onClick?: () => void;
}

/** Outline button for the secondary action (e.g. "Explore Products"). */
export function SecondaryCta({ label, to, className, onClick }: SecondaryCtaProps) {
  return (
    <Button
      asChild
      size="lg"
      variant="outline"
      className={cn("h-14 px-8 uppercase tracking-wider font-semibold bg-transparent", className)}
    >
      <Link to={to} onClick={onClick}>{label}</Link>
    </Button>
  );
}

/** Quiet text link with an arrow for informational calls ("Explore Ultra-Slim ->"). */
export function ArrowLink({ label, to, className }: { label: string; to: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        "mono-label group inline-flex items-center gap-2 text-primary hover:text-foreground transition-colors",
        className,
      )}
    >
      {label}
      <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Highlighted entry to the 3D configurator ("Build Your Sign"): an outlined button that stands out from the quiet nav links. */
export function BuildYourSignButton({ size = "md", className, onClick }: { size?: "md" | "lg"; className?: string; onClick?: () => void }) {
  return (
    <Button
      asChild
      size="lg"
      variant="outline"
      className={cn(
        "uppercase tracking-wider font-semibold bg-primary/10 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        size === "lg" ? "h-14 px-8" : "h-10 px-4 text-xs",
        className,
      )}
    >
      <Link to={CTA_LINKS.tryConfigurator.to} onClick={onClick}>
        <Box aria-hidden="true" />
        {CTA_LINKS.tryConfigurator.label}
      </Link>
    </Button>
  );
}
