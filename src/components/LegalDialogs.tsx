import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@project/components/ui/dialog';

export type LegalDialogType = 'privacy' | 'terms' | null;

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
              5005 W Laurel<br />
              Tampa, FL 33607<br />
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

      <Dialog open={open === 'privacy'} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert text-foreground space-y-4 text-sm leading-relaxed">
            <h3 className="text-base font-semibold mt-2">1. Overview</h3>
            <p>
              This privacy policy explains what personal data we collect when you visit this website
              and how we use it.
            </p>

            <h3 className="text-base font-semibold">2. Responsible Party</h3>
            <p>
              <strong>Sunlite Signs LLC</strong><br />
              5005 W Laurel<br />
              Tampa, FL 33607<br />
              Phone: (689) 294-0912<br />
              Email: hello@sunlitesigns.com
            </p>

            <h3 className="text-base font-semibold">3. Data Collection</h3>
            <h4 className="text-sm font-semibold">Contact Form</h4>
            <p>
              When you submit an inquiry through our contact form, we collect your name, company,
              email, phone number, and message. This data is used solely to process your inquiry
              and follow up on your request.
            </p>

            <h4 className="text-sm font-semibold">File Upload</h4>
            <p>
              You may upload files (e.g., project drawings, logos) via the contact form. These files
              are used exclusively to process your inquiry and are deleted after the request is complete,
              unless legally required to be retained.
            </p>

            <h3 className="text-base font-semibold">4. Hosting</h3>
            <p>
              This website is hosted by a third-party provider. Personal data collected on this website
              may be stored on the host's servers. This may include IP addresses, contact inquiries,
              metadata, and other data generated through the website.
            </p>

            <h3 className="text-base font-semibold">5. Email</h3>
            <p>
              Data submitted through the contact form is forwarded to us via email using an external
              service provider.
            </p>

            <h3 className="text-base font-semibold">6. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
            <p>
              To exercise these rights, please contact us at the address above.
            </p>

            <h3 className="text-base font-semibold">7. SSL Encryption</h3>
            <p>
              This site uses SSL/TLS encryption to protect data transmission. You can recognize an
              encrypted connection by the "https://" prefix and the lock icon in your browser.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useLegalDialogs() {
  const [open, setOpen] = useState<LegalDialogType>(null);
  return { open, setOpen, onClose: () => setOpen(null) };
}
