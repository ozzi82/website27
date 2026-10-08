import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import Logo from "../Logo";
import { PHONE_DISPLAY, PHONE_NUMBER } from "../../lib/contact";

/** Slim header of the configurator: the logo, the page name, and the way back to the site (the site's own header and footer are left out here). */
export default function ConfiguratorHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
      <Link to="/" aria-label="Sunlite Signs, home" className="flex shrink-0 items-center">
        <Logo className="h-5 w-auto text-foreground sm:h-6" />
      </Link>
      <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
      <p className="hidden text-sm font-medium text-muted-foreground sm:block">3D Configurator</p>
      <div className="ml-auto flex items-center gap-3">
        <a href={`tel:${PHONE_NUMBER}`} className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground md:inline-flex">
          <Phone aria-hidden="true" className="h-3.5 w-3.5" />
          {PHONE_DISPLAY}
        </a>
        <Link
          to="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Back to website
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
