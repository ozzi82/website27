import { useState, type ReactNode } from "react";
import { Play } from "lucide-react";
import { cn } from "@project/lib/utils";
import type { MediaImage, MediaVideo } from "../data/production";
import Picture from "./Picture";

interface MediaFrameProps {
  image?: MediaImage;
  video?: MediaVideo;
  /** Tailwind aspect class for the frame; the media is cropped to it (object-cover). */
  aspect?: string;
  /** Above-the-fold media loads eagerly; everything else is lazy. */
  priority?: boolean;
  /** Rendered when there is no image or video. */
  placeholder?: ReactNode;
  className?: string;
  imgClassName?: string;
  /** How wide the frame is drawn at each screen size, so phones fetch a small copy. Default suits a card in a 3-column grid. */
  sizes?: string;
}

/**
 * Lazy media slot: an image (width/height set, so no layout shift) or a video behind a poster.
 * The video file is never requested until the visitor presses play (poster + play button facade),
 * so future production videos cost nothing on page load.
 */
export default function MediaFrame({ image, video, aspect = "aspect-[16/10]", priority = false, placeholder, className, imgClassName, sizes = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" }: MediaFrameProps) {
  const [playing, setPlaying] = useState(false);
  const still = video?.poster ?? image;

  return (
    <div className={cn("relative overflow-hidden bg-card", aspect, className)}>
      {video && playing ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          poster={video.poster.src}
          controls
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-label={video.poster.alt}
        >
          <source src={video.src} type={video.type} />
        </video>
      ) : still ? (
        <>
          <Picture
            src={still.src}
            alt={still.alt}
            width={still.width}
            height={still.height}
            sizes={sizes}
            priority={priority}
            className={cn("absolute inset-0 w-full h-full object-cover", imgClassName)}
          />
          {video && (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play video: ${video.poster.alt}`}
              className="absolute inset-0 grid place-items-center bg-background/20 hover:bg-background/10 transition-colors"
            >
              <span className="grid place-items-center w-16 h-16 rounded-full border border-foreground/60 bg-background/60 text-foreground">
                <Play aria-hidden="true" className="w-6 h-6 ml-0.5" />
              </span>
            </button>
          )}
        </>
      ) : (
        placeholder ?? null
      )}
    </div>
  );
}
