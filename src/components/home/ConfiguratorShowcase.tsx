import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import SectionHeader from "../SectionHeader";
import { SecondaryCta } from "../CtaButton";
import { CONFIGURATOR_PATH, CONFIGURATOR_TAGLINE } from "../../lib/configuratorMeta";
import Picture from "../Picture";

const POSTER = "/images/configurator-demo-poster.webp";
const SIZE = { width: 720, height: 548 };

const points = [
  "Upload your artwork (SVG, PDF or AI) or just type your text",
  "Choose from the 12 EdgeLuxe letter systems",
  "Switch between day and night, dim the LEDs, try different walls",
  "Send the configuration with your wholesale pricing request",
];

/**
 * The demo is a short silent loop captured from the real configurator (frames of the actual 3D renders). It loads only
 * when it scrolls into view, and never plays for visitors who prefer reduced motion or are saving data: they get the
 * still. On the server and on the first client render it is the still too, so hydration matches.
 */
function useDemoVideo(): [boolean, React.RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlay(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [play, ref];
}

export default function ConfiguratorShowcase() {
  const [play, frameRef] = useDemoVideo();
  return (
    <section id="build-your-sign" className="py-14 md:py-24 border-b border-border scroll-mt-20" aria-labelledby="build-your-sign-title">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
        <div>
          <SectionHeader
            eyebrow={`Build Your Sign · ${CONFIGURATOR_TAGLINE}`}
            title={
              <span id="build-your-sign-title">
                Design it. See it lit.
                <br />
                <span className="text-primary">Send it for a quote.</span>
              </span>
            }
            className="mb-8 pb-8"
            titleClassName="text-4xl sm:text-5xl"
          />
          <ul className="space-y-3 max-w-lg">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-foreground/85">
                <Check aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-9">
            <SecondaryCta label="Open the configurator" to={CONFIGURATOR_PATH} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-md">The preview is illustrative; your quote is based on the shop drawings.</p>
        </div>

        <div ref={frameRef} className="corner-marks border border-border bg-card/60 p-2 sm:p-3">
          {play ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster={POSTER}
              width={SIZE.width}
              height={SIZE.height}
              aria-label="Looping preview of the Build Your Sign configurator: the letters Sunlite shown by day, then glowing at night in several colours and lighting styles"
              className="w-full h-auto block"
            >
              <source src="/images/configurator-demo.webm" type="video/webm" />
              <source src="/images/configurator-demo.mp4" type="video/mp4" />
            </video>
          ) : (
            <Picture
              src={POSTER}
              alt="The configurator preview: the letters Sunlite glowing cyan at night on a concrete wall"
              width={SIZE.width}
              height={SIZE.height}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="w-full h-auto block"
            />
          )}
        </div>
      </div>
    </section>
  );
}
