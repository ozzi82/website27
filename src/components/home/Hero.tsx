import { useEffect, useState } from "react";
import { ArrowLink, PrimaryCta, SecondaryCta } from "../CtaButton";
import { CTA_LINKS, CTA_SECONDARY } from "../../lib/cta";

const VIDEO_ID = "QsF9N8ym39k";
const VIDEO_SRC = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0`;
const POSTER = { src: "/images/hero-production-poster.jpg", width: 1600, height: 900 };

/**
 * Whether to mount the background video. Poster-first: the still paints immediately and the YouTube player
 * (a heavy third-party iframe) is only added after the page has loaded and the browser is idle, and never on
 * phones, with reduced motion, or when the visitor asked to save data. Always false on the server, so the
 * prerendered HTML and the first client render match.
 */
function useBackgroundVideo(): boolean {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (window.innerWidth < 768 || nav.connection?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let idleHandle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      if (cancelled) return;
      if ("requestIdleCallback" in window) idleHandle = window.requestIdleCallback(() => !cancelled && setMount(true), { timeout: 4000 });
      else timer = setTimeout(() => !cancelled && setMount(true), 1500);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return mount;
}

export default function Hero() {
  const showVideo = useBackgroundVideo();
  const [videoReady, setVideoReady] = useState(false);
  return (
    <section className="relative min-h-[88vh] flex flex-col overflow-hidden border-b border-border">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <img
          src={POSTER.src}
          width={POSTER.width}
          height={POSTER.height}
          alt=""
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          {...{ fetchpriority: "high" }}
        />
        {showVideo && (
          <iframe
            title="Sunlite production floor"
            tabIndex={-1}
            onLoad={() => setVideoReady(true)}
            className={`absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
            src={VIDEO_SRC}
            allow="autoplay; encrypted-media"
          />
        )}
        <div className="absolute inset-0 bg-background/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60" />
      </div>

      <div className="relative flex-1 max-w-7xl w-full mx-auto px-6 pt-32 md:pt-36 pb-14 md:pb-16 flex flex-col justify-end">
        <p className="mono-label mb-5 md:mb-6 font-bold text-xs md:text-sm text-foreground animate-in fade-in duration-700">
          Wholesale sign manufacturer · Trade only
        </p>
        <h1 className="text-[clamp(1.75rem,8.6vw,2.4rem)] leading-[1.04] sm:text-6xl md:text-7xl lg:text-[5.5rem] max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          Wholesale Channel Letters.<br />
          <span className="text-primary">Built for Sign Companies.</span>
        </h1>
        <div className="mt-8 md:mt-10 grid md:grid-cols-[1fr_auto] gap-8 items-end animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <p className="text-base md:text-lg text-foreground/80 max-w-xl">
            Ultra-slim cast acrylic letters and classic trimless channel letters, manufactured to your drawings — UL 48 listed, ready to install and shipped nationwide.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <PrimaryCta />
              <SecondaryCta label={CTA_SECONDARY.label} to={CTA_SECONDARY.to} />
            </div>
            <ArrowLink label="Build your sign in 3D" to={CTA_LINKS.tryConfigurator.to} className="text-sm sm:justify-end" />
          </div>
        </div>
      </div>
      <div className="caution-tape h-2 relative" />
    </section>
  );
}
