import type { ProductionStage } from "../data/production";
import MediaFrame from "./MediaFrame";

/** Blueprint-style tile shown while a stage has no real photo/video yet (never stock imagery). */
function StagePlaceholder({ stage }: { stage: ProductionStage }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 steel-plate bg-secondary/60 p-3">
      <div className="corner-marks h-full flex items-end justify-between p-3 border border-border/60">
        <span className="font-heading text-[6.5rem] leading-[0.8] font-bold text-transparent [-webkit-text-stroke:1.5px_hsl(var(--primary)/0.5)]">
          {stage.number}
        </span>
        <span className="mono-label text-muted-foreground text-right max-w-[9rem]">{stage.title}</span>
      </div>
    </div>
  );
}

/** One manufacturing stage: media (photo, video or typographic placeholder) + numbered caption. */
export default function ProductionStageCard({ stage, priority = false }: { stage: ProductionStage; priority?: boolean }) {
  return (
    <article className="flex flex-col border border-border bg-card/50" data-stage={stage.id}>
      <MediaFrame
        image={stage.image}
        video={stage.video}
        priority={priority}
        aspect="aspect-[16/10]"
        placeholder={<StagePlaceholder stage={stage} />}
        className="border-b border-border"
      />
      <div className="p-5 flex-1">
        <p className="mono-label text-primary">Stage {stage.number}</p>
        <h3 className="text-2xl md:text-3xl mt-2">{stage.title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{stage.description}</p>
      </div>
    </article>
  );
}
