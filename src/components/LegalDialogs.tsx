import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@project/components/ui/dialog';

export type LegalDialogType = 'terms' | null;

/** Dispatch with detail 'terms' to open the terms dialog from anywhere. (The privacy policy is a page, /privacy-policy.) */
export const OPEN_LEGAL_EVENT = 'sls:open-legal';

export function LegalDialogs({
  open,
  onClose,
}: {
  open: LegalDialogType;
  onClose: () => void;
}) {
  return (
    <>
      <Dialog open={open === 'terms'} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm leading-relaxed text-white">
            <h3 className="text-base font-semibold mt-2">Company Information</h3>
            <p>
              <strong>Sunlite Signs LLC</strong><br />
              United States
            </p>

            <h3 className="text-base font-semibold">Contact</h3>
            <p>
              Phone: (689) 294-0912<br />
              Email: hello@sunlitesigns.com
            </p>

            <h3 className="text-base font-semibold">Services</h3>
            <p>
              Sunlite Signs LLC provides B2B manufacturing services for channel letters, 3D logos,
              profile letters, and illuminated signage. All products are manufactured to client
              specifications and shipped ready-to-install. Sunlite Signs does not provide installation
              services or serve retail/end customers.
            </p>

            <h3 className="text-base font-semibold">Liability</h3>
            <p>
              All information on this website is provided for general informational purposes only.
              While we strive to keep the information up to date and correct, we make no
              representations or warranties of any kind about the completeness, accuracy, or
              reliability of the information.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useLegalDialogs() {
  const [open, setOpen] = useState<LegalDialogType>(null);
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<LegalDialogType>).detail;
      if (d === 'terms') setOpen(d);
    };
    window.addEventListener(OPEN_LEGAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LEGAL_EVENT, onOpen);
  }, []);
  return { open, setOpen, onClose: () => setOpen(null) };
}
