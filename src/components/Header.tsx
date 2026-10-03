import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from '@project/components/ui/button';
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { services } from "../data/services";
import { configurations } from "../data/configurations";

const PHONE_NUMBER = "+16892940912";
const PHONE_DISPLAY = "(689) 294-0912";
const WHATSAPP_URL = `https://wa.me/${PHONE_NUMBER.replace("+", "")}`;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const navLinks = [
  { label: "Configurator", href: "/configurator" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNav = (href: string) => {
    setOpen(false);
    if (href.includes("#")) {
      const [path, hash] = href.split("#");
      const targetPath = path || "/";
      if (pathname === targetPath) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(targetPath);
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        }, 400);
      }
    } else {
      navigate(href);
    }
  };

  return <>
    <div className="bg-primary text-primary-foreground text-xs py-1.5 text-center tracking-wide hidden md:block">
      B2B Manufacturing Partner for Sign Companies & Agencies
    </div>
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-6 flex items-center justify-between h-16 w-full">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-primary">SUNLITE</span>
          <span className="text-foreground">SIGNS</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          <div className="relative group">
            <button onClick={() => handleNav("/#products")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              Services <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full pt-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all">
              <div className="w-80 rounded-lg border border-border bg-background shadow-lg p-2">
                {services.map(s => (
                  <Link key={s.id} to={`/services/${s.id}`} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <img src={s.img} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                    {s.title}
                  </Link>
                ))}
                <button onClick={() => handleNav("/#products")} className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-muted">
                  View all services →
                </button>
              </div>
            </div>
          </div>
          <div className="relative group">
            <button onClick={() => handleNav("/#light-effects")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              Light Effects <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full pt-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all">
              <div className="w-[28rem] rounded-lg border border-border bg-background shadow-lg p-3">
                <div className="grid grid-cols-2 gap-1">
                  {configurations.map(c => (
                    <Link key={c.id} to={`/light-effects/${c.id}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <img src={c.img} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                      <span className="min-w-0"><span className="block truncate text-foreground/90">{c.title}</span><span className="block truncate text-xs">{c.subtitle}</span></span>
                    </Link>
                  ))}
                </div>
                <button onClick={() => handleNav("/#light-effects")} className="block w-full text-left rounded-md px-3 py-2 mt-1 text-sm font-medium text-primary hover:bg-muted">
                  View all configurations →
                </button>
              </div>
            </div>
          </div>
          {navLinks.map(l => (
            <button key={l.href} onClick={() => handleNav(l.href)} className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              {l.label}
            </button>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <a href={`tel:${PHONE_NUMBER}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <Phone className="w-3.5 h-3.5 text-primary" /><span className="text-xs lg:text-sm">{PHONE_DISPLAY}</span>
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] text-primary hover:bg-[hsl(var(--primary)/0.2)] transition-colors" title="WhatsApp">
            <WhatsAppIcon className="w-5 h-5" />
          </a>
          <a href="mailto:hello@sunlitesigns.com" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] text-primary hover:bg-[hsl(var(--primary)/0.2)] transition-colors" title="Email">
            <Mail className="w-4 h-4" />
          </a>
        </div>
        <Button onClick={() => handleNav("/contact")} className='hidden lg:inline-flex shadow-sm'>Get a Quote</Button>
        <button className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && <div className="lg:hidden border-t border-border bg-background px-4 pb-4 pt-2 space-y-2">
        <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-foreground">Services</p>
        {services.map(s => (
          <button key={s.id} onClick={() => handleNav(`/services/${s.id}`)} className="block w-full text-left py-2 pl-3 text-sm text-muted-foreground hover:text-foreground">
            {s.title}
          </button>
        ))}
        <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-foreground">Light Effects</p>
        <div className="grid grid-cols-2 gap-1">
          {configurations.map(c => (
            <button key={c.id} onClick={() => handleNav(`/light-effects/${c.id}`)} className="flex items-center gap-2 w-full text-left py-1.5 pl-3 text-sm text-muted-foreground hover:text-foreground">
              <img src={c.img} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
        {navLinks.map(l => (
          <button key={l.href} onClick={() => handleNav(l.href)} className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground">
            {l.label}
          </button>
        ))}
        <a href="mailto:hello@sunlitesigns.com" className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
          hello@sunlitesigns.com
        </a>
        <a href={`tel:${PHONE_NUMBER}`} className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
          <Phone className="w-4 h-4" />{PHONE_DISPLAY}
        </a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
          <WhatsAppIcon className="w-4 h-4" />WhatsApp
        </a>
        <Button onClick={() => handleNav("/contact")} className="w-full mt-2">Get a Quote</Button>
      </div>}
    </header>
  </>;
}
