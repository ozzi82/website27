import { Link } from 'react-router-dom';
import { LegalDialogs, useLegalDialogs } from './LegalDialogs';

const navLinks = [
  { label: "Services", href: "/#products" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const { open, setOpen, onClose } = useLegalDialogs();

  return (
    <>
      <footer className="bg-secondary py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
            <div className="space-y-3 max-w-md">
              <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                <span className="text-primary">SUNLITE</span> <span className="text-foreground">SIGNS</span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                B2B manufacturing partner for LED channel letters, 3D logos, profile letters, and illuminated signage – shipped ready-to-install.
              </p>
              <p className="text-xs text-muted-foreground">
                Sunlite Signs LLC · 5005 W Laurel · Tampa, FL 33607
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 md:ml-auto">
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
            <p>B2B inquiries only. No installation services. No retail customers.</p>
          </div>
        </div>
      </footer>
      <LegalDialogs open={open} onClose={onClose} />
    </>
  );
}
