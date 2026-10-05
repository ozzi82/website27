import { Link } from 'react-router-dom';
import { LegalDialogs, useLegalDialogs } from './LegalDialogs';
import { COMPANY_LINE, COMPANY_POSITIONING, EMAIL, PHONE_DISPLAY } from '../lib/contact';
import { CTA_LINKS, CTA_PRIMARY } from '../lib/cta';

const navLinks = [
  { label: "Ultra-Slim Letters", href: CTA_LINKS.exploreUltraSlim.to },
  { label: "Classic Trimless Letters", href: CTA_LINKS.viewChannelLetters.to },
  { label: "Flat Cutout Letters", href: CTA_LINKS.viewFlatCutout.to },
  { label: "Custom Fabrication", href: CTA_LINKS.customFabrication.to },
  { label: CTA_LINKS.tryConfigurator.label, href: CTA_LINKS.tryConfigurator.to },
  { label: "Projects", href: CTA_LINKS.viewProjects.to },
  { label: "Manufacturing", href: CTA_LINKS.viewManufacturing.to },
  { label: "About", href: "/about" },
  { label: CTA_PRIMARY.label, href: CTA_PRIMARY.to },
];

export default function Footer() {
  const { open, setOpen, onClose } = useLegalDialogs();

  return (
    <>
      <footer className="bg-secondary py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
            <div className="space-y-3 max-w-md">
              <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                <span className="text-primary">SUNLITE</span> <span className="text-foreground">SIGNS</span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="text-foreground/90">{COMPANY_LINE}</span>
                <br />
                {COMPANY_POSITIONING}
              </p>
              <p className="text-xs text-muted-foreground">
                {PHONE_DISPLAY} · {EMAIL}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 md:ml-auto md:max-w-md md:justify-end">
              {navLinks.map(l => (
                <Link key={l.label} to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
              <button onClick={() => setOpen('terms')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </button>
              <button onClick={() => setOpen('privacy')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </button>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row gap-4 justify-between text-xs text-muted-foreground">
            <p suppressHydrationWarning>© {new Date().getFullYear()} Sunlite Signs LLC. All rights reserved.</p>
            <p>Trade customers only. No retail sales. No installation services.</p>
          </div>
        </div>
      </footer>
      <LegalDialogs open={open} onClose={onClose} />
    </>
  );
}
