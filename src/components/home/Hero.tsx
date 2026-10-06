import { useEffect, useRef, useState } from "react";
import { ArrowLink, PrimaryCta, SecondaryCta } from "../CtaButton";
import { CTA_LINKS, CTA_SECONDARY } from "../../lib/cta";

const POSTER = { src: "/images/hero-loop-poster.jpg", width: 1600, height: 900 };
/** About 2.4 MB, silent, 19 seconds of the production floor; the phone and the desktop use the same file. */
const VIDEO_SRC = "/videos/hero-loop.mp4";

/**
 * Whether to play the background video. It is part of the prerendered HTML (so the browser starts fetching it with the page)
 * and is removed on the client for visitors who asked for reduced motion or to save data; they keep the poster.
 */
function useAllowVideo(): boolean {
  const [allow, setAllow] = useState(true);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAllow(false);
  }, []);
  return allow;
}

export default function Hero() {
  const allowVideo = useAllowVideo();
  const [videoReady, setVideoReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // The poster stays until the video is really playing (it may already be, before React took over the prerendered page).
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const ready = () => setVideoReady(true);
    if (!v.paused && v.readyState >= 3) ready();
    v.addEventListener("playing", ready);
    Promise.resolve(v.play?.()).catch(() => undefined); // blocked (for example low-power mode): the poster simply stays
    return () => v.removeEventListener("playing", ready);
  }, [allowVideo]);

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
        {allowVideo && (
          <video
            ref={video}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
            src={VIDEO_SRC}
            poster={POSTER.src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            tabIndex={-1}
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
            German-engineered ultra-slim cast acrylic letters and classic trimless channel letters, manufactured to your drawings — UL 48 listed, ready to install and shipped nationwide.
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
