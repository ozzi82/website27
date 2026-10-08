import SectionHeader from "../SectionHeader";
import ProcessIllustration from "./ProcessIllustration";
import { processSteps } from "../../data/process";

export default function ProcessSteps() {
  return (
    <section id="process" className="py-14 md:py-28 border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="Process" title="From Artwork to Your Dock." />
        <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t-2 border-primary/50">
          {processSteps.map((step, i) => (
            <li
              key={step}
              className="pt-5 pb-8 pr-4 border-border max-sm:even:border-l max-sm:even:pl-5 sm:pl-5 sm:border-l sm:[&:nth-child(3n+1)]:border-l-0 sm:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(3n+1)]:border-l lg:[&:nth-child(3n+1)]:pl-5 lg:first:border-l-0 lg:first:pl-0"
            >
              <ProcessIllustration step={i} className="mb-4 h-28 lg:h-24 xl:h-28 w-full bg-card border border-border text-foreground" />
              <span className="font-heading text-5xl md:text-6xl font-bold text-muted-foreground/40 leading-none">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-xl md:text-2xl mt-3 uppercase">{step}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
