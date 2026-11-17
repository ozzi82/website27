import { configurations } from "../../data/configurations";
import Picture from "../Picture";

interface ConfigChooserProps {
  onSelect: (configId: string) => void;
}

/** Step 1 of the configurator: pick one of the 12 EdgeLuxe letter configurations. */
export default function ConfigChooser({ onSelect }: ConfigChooserProps) {
  return (
    <div>
      <ol className="mb-8 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Pick a sign type", "Below. You can change it later."],
          ["Type your text or upload a logo", "You see it as a sign straight away."],
          ["Set size, colour and light", "By day and by night, on your wall."],
          ["Ask for your price", "We get your sign exactly as you built it."],
        ].map(([title, text], i) => (
          <li key={title} className={`flex gap-3 rounded-xl border p-3 ${i === 0 ? "border-primary/60 bg-primary/5" : "border-border bg-card"}`}>
            <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <h2 className="mb-4 text-2xl font-semibold">1. Pick a sign type</h2>
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
