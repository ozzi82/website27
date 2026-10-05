import { useEffect } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { PrimaryCta } from "../components/CtaButton";
import { CTA_LINKS } from "../lib/cta";

const links = [
  { to: CTA_LINKS.exploreUltraSlim.to, label: "Ultra-slim letters" },
  { to: CTA_LINKS.viewChannelLetters.to, label: "Classic trimless letters" },
  { to: "/services/custom-sign-fabrication", label: "Custom sign fabrication" },
  { to: CTA_LINKS.tryConfigurator.to, label: "Build Your Sign in 3D" },
  { to: CTA_LINKS.viewAllProjects.to, label: "Projects" },
  { to: "/contact", label: "Contact" },
];

/** Any address that is not a page of this site. The host answers it with a real 404 status (see nginx.conf). */
export default function NotFoundPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="pt-32 pb-24">
      <Seo title="Page not found" description="This page does not exist or has moved." path="/404" noindex />
      <div className="max-w-3xl mx-auto px-6">
        <p className="mono-label text-primary mb-4">Error 404</p>
        <h1 className="text-5xl md:text-7xl">Page not found.</h1>
        <p className="text-lg text-foreground/80 mt-6 max-w-xl">
          The page you are looking for does not exist or has moved. Try one of these, or send us your artwork and we will quote it.
        </p>
        <ul className="mt-8 grid sm:grid-cols-2 gap-3">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="block border border-border bg-card/50 px-4 py-3 hover:border-primary hover:text-primary transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <PrimaryCta />
          <Link to="/" className="mono-label inline-flex items-center px-4 py-3 text-muted-foreground hover:text-foreground">Back to the homepage</Link>
        </div>
      </div>
    </div>
  );
}
