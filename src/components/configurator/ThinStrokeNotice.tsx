import { AlertTriangle } from "lucide-react";
import type { LightConfig } from "../../data/configurations";
import { thinStrokeAdvice } from "./strokeGuard";

/**
 * The thin-stroke advice, laid over the top-left corner of the 3D preview where it cannot be missed (the zoom buttons
 * are on the right). Renders nothing when the artwork is fine.
 */
export default function ThinStrokeNotice({ config, strokeRatio }: { config: LightConfig; strokeRatio: number | null }) {
  const advice = thinStrokeAdvice(config, strokeRatio);
  if (!advice) return null;
  const strong = advice.severity === "strong";
  return (
    <p
      role="note"
      className={`pointer-events-none absolute left-3 top-3 z-10 flex max-w-[min(24rem,calc(100%-5.5rem))] gap-2 rounded-lg border p-2.5 text-xs leading-snug shadow-lg backdrop-blur-sm sm:p-3 sm:text-sm ${
        strong ? "border-amber-500/70 bg-amber-950/80 text-amber-50" : "border-amber-500/40 bg-black/65 text-amber-100"
      }`}
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <span>{advice.message}</span>
    </p>
  );
}
