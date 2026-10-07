import { configurations } from "../../data/configurations";
import Picture from "../Picture";

interface ConfigChooserProps {
  onSelect: (configId: string) => void;
}

/** Step 1 of the configurator: pick one of the 12 EdgeLuxe letter configurations. */
export default function ConfigChooser({ onSelect }: ConfigChooserProps) {
  return (
    <div>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Pick a letter configuration, then upload your logo to see it lit.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {configurations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className="group flex h-full flex-col justify-start text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors"
          >
            <Picture
              src={c.img}
              alt=""
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="w-full shrink-0 aspect-[16/10] object-cover object-center bg-background"
            />
            <span className="block p-5">
              <span className="block mono-label text-primary mb-1">{c.code}</span>
              <span className="block text-lg font-semibold leading-snug">
                {c.title} {c.subtitle}
              </span>
              <span className="block text-sm text-muted-foreground mt-2">{c.summary}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
