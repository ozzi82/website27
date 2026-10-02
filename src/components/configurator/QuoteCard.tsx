import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import type { QuoteSnapshot } from "./quoteStorage";

interface QuoteCardProps {
  quote: QuoteSnapshot;
  onClear: () => void;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fall back for insecure contexts / denied permission.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** "Your configuration" on the contact page: what the visitor built in the configurator, with a snapshot of it. */
export default function QuoteCard({ quote, onClear }: QuoteCardProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    setStatus((await writeClipboard(quote.summary)) ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <section aria-labelledby="quote-card-title" className="mb-10 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 id="quote-card-title" className="text-lg font-semibold">
            Your configuration
          </h2>
          <p className="text-xs text-muted-foreground">From the sign configurator. It is added to your request below, so we can quote it.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {quote.image && (
          <img
            src={quote.image}
            alt="Preview of your configured sign"
            className="aspect-[4/3] w-full rounded-lg border border-border bg-background object-cover sm:w-56 sm:self-start"
          />
        )}
        <dl className="min-w-0 flex-1 space-y-1.5 text-sm">
          {quote.rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="flex min-w-0 items-center gap-2 break-words">
                {r.swatch && (
                  <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-border" style={{ backgroundColor: r.swatch }} />
                )}
                <span className="min-w-0">{r.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {status === "copied" ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
          Copy summary
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          Clear
        </button>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {status === "copied" && "Copied to the clipboard."}
          {status === "failed" && "Couldn’t copy automatically. Select the text above and copy it."}
        </p>
      </div>
    </section>
  );
}
