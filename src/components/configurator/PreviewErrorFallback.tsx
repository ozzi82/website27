import { Link } from "react-router-dom";
import type { FallbackProps } from "react-error-boundary";
import { Button } from "@project/components/ui/button";

// Shown in place of the 3D preview if it throws (failed HDR fetch, lost or
// unavailable WebGL context, ...), so the rest of the page stays usable. Same
// footprint as the preview so the layout doesn't jump.
export default function PreviewErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="w-full aspect-[4/3] rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <p className="font-medium">The 3D preview couldn't load.</p>
      <p className="text-sm text-muted-foreground">
        You can try again, or{" "}
        <Link to="/contact" className="underline">
          send it to us directly
        </Link>{" "}
        and we'll quote it by hand.
      </p>
      <Button type="button" variant="outline" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
