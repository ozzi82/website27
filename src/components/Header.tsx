import { useState } from "react";
import Logo from "./Logo";
import { Link } from "react-router-dom";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { BuildYourSignButton, PrimaryCta } from "./CtaButton";
import { primaryNav, productNav, productNavExtras } from "../data/nav";
import { EMAIL, PHONE_DISPLAY, PHONE_NUMBER } from "../lib/contact";

const navLinkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return <>
    <div data-site-chrome className="bg-primary text-primary-foreground text-xs py-1.5 text-center tracking-wide hidden md:block">
      Wholesale manufacturing partner for sign companies · Trade only
    </div>
    <header data-site-chrome className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-6 flex items-center justify-between gap-4 h-16 w-full">
        <Link to="/" onClick={close} aria-label="Sunlite Signs, home" className="flex items-center shrink-0">
          <Logo className="h-6 sm:h-7 w-auto text-foreground" />
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-6 xl:gap-8">
          <div className="relative group">
            <Link to="/#products" className={`inline-flex items-center gap-1 ${navLinkClass}`}>
              Products <ChevronDown aria-hidden="true" className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
            </Link>
            <div className="absolute left-0 top-full pt-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all">
              <div className="w-64 border border-border bg-background shadow-lg p-2">
                {productNav.map((item) => (
                  <Link key={item.label} to={item.to} className="block px-3 py-2 text-sm text-foreground/90 hover:bg-muted hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                {productNavExtras.map((item) => (
                  <Link key={item.label} to={item.to} className="block px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {primaryNav.map((item) => (
            <Link key={item.label} to={item.to} className={navLinkClass}>{item.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden xl:flex items-center gap-3">
            <a href={`tel:${PHONE_NUMBER}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors whitespace-nowrap">
              <Phone aria-hidden="true" className="w-3.5 h-3.5 text-primary" />{PHONE_DISPLAY}
            </a>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] text-primary hover:bg-[hsl(var(--primary)/0.2)] transition-colors" title="Email" aria-label="Email">
              <Mail aria-hidden="true" className="w-4 h-4" />
            </a>
          </div>
          <BuildYourSignButton className="hidden lg:inline-flex" />
          <PrimaryCta size="md" arrow={false} className="hidden sm:inline-flex shadow-sm" />
          <button
            type="button"
            className="lg:hidden p-1"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && <nav id="mobile-nav" aria-label="Mobile" className="lg:hidden border-t border-border bg-background px-4 pb-5 pt-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <PrimaryCta size="md" arrow={false} className="w-full h-12" onClick={close} />
        <BuildYourSignButton className="w-full h-12 mt-2" onClick={close} />
        <p className="pt-5 pb-1 mono-label text-primary">Products</p>
        {productNav.map((item) => (
          <Link key={item.label} to={item.to} onClick={close} className="block py-2.5 text-base text-foreground/90 hover:text-foreground border-b border-border/60">
            {item.label}
          </Link>
        ))}
        {productNavExtras.map((item) => (
          <Link key={item.label} to={item.to} onClick={close} className="block py-2.5 text-sm text-muted-foreground hover:text-foreground border-b border-border/60">
            {item.label}
          </Link>
        ))}
        <div className="pt-3">
          {primaryNav.map((item) => (
            <Link key={item.label} to={item.to} onClick={close} className="block py-2.5 text-base text-foreground/90 hover:text-foreground border-b border-border/60">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="pt-3 flex flex-col">
          <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
            <Mail aria-hidden="true" className="w-4 h-4" />{EMAIL}
          </a>
          <a href={`tel:${PHONE_NUMBER}`} className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
            <Phone aria-hidden="true" className="w-4 h-4" />{PHONE_DISPLAY}
          </a>
        </div>
      </nav>}
    </header>
  </>;
}
