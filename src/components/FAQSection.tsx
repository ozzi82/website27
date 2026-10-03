import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@project/components/ui/accordion';
import SectionHeader from './SectionHeader';

export const faqs: Faq[] = [
  { q: "Does Sunlite Signs serve retail customers?", a: "No. Sunlite Signs is exclusively a B2B manufacturing partner for sign companies, agencies, shopfitters, and other trade professionals." },
  { q: "Can sign companies use Sunlite as a production partner?", a: "Yes. Sign companies use Sunlite as an outsourced manufacturer to expand their product offering with channel letters and illuminated signage – without investing in in-house production." },
  { q: "Do you handle installation?", a: "No. Sunlite delivers ready-to-install. Installation is handled by you, your crew, your electrician, or a local contractor." },
  { q: "Can you ship directly to the project site?", a: "Yes, by arrangement. We ship to your shop, warehouse, or – after coordination – directly to your client's project site." },
  { q: "What files do you need for a quote?", a: "Logo as a vector file (AI, EPS, PDF), dimensions or dimension sketch, photos of the facade or installation site, desired light effect, and indoor/outdoor specification." },
  { q: "Do you consult on technical feasibility?", a: "Yes. We advise on materials, light effects, sizing, and technical feasibility – and create visualizations on request." },
  { q: "Are one-off projects possible?", a: "Yes. We manufacture both one-off projects and production runs – always to your project specifications." },
  { q: "Does Sunlite offer white-label or neutral shipping?", a: "Please contact us directly to discuss white-label and neutral shipping options." },
];

export interface Faq {
  q: string;
  a: string;
}

interface FAQSectionProps {
  /** Defaults to the company-wide questions; product pages pass their own (supported facts only). */
  items?: Faq[];
  eyebrow?: string;
  title?: string;
  titleClassName?: string;
}

export default function FAQSection({ items = faqs, eyebrow = "FAQ", title = "Frequently asked questions", titleClassName }: FAQSectionProps) {
  return (
    <section id="faq" className="py-14 md:py-28 border-t border-border bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow={eyebrow} title={title} titleClassName={titleClassName} />
        <Accordion type="single" collapsible className="max-w-3xl">
          {items.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
              <AccordionTrigger className="text-left font-medium text-base py-5">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
