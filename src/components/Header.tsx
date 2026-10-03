import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { PrimaryCta } from "./CtaButton";
import { primaryNav, productNav, productNavExtras } from "../data/nav";
import { EMAIL, PHONE_DISPLAY, PHONE_NUMBER, WHATSAPP_URL } from "../lib/contact";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const navLinkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return <>
    <div className="bg-primary text-primary-foreground text-xs py-1.5 text-center tracking-wide hidden md:block">
      Wholesale manufacturing partner for sign companies · Trade only
    </div>
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-6 flex items-center justify-between gap-4 h-16 w-full">
        <Link to="/" onClick={close} className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
          <span className="text-primary">SUNLITE</span>
          <span className="text-foreground">SIGNS</span>
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
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] text-primary hover:bg-[hsl(var(--primary)/0.2)] transition-colors" title="WhatsApp" aria-label="WhatsApp">
              <WhatsAppIcon className="w-5 h-5" />
            </a>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] text-primary hover:bg-[hsl(var(--primary)/0.2)] transition-colors" title="Email" aria-label="Email">
              <Mail aria-hidden="true" className="w-4 h-4" />
            </a>
          </div>
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
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
            <WhatsAppIcon className="w-4 h-4" />WhatsApp
          </a>
        </div>
      </nav>}
    </header>
  </>;
}
