import { useState } from "react";
import SegmentedControl from "./configurator/SegmentedControl";
import { emitsLight } from "./configurator/types";
import type { LightConfig } from "../data/configurations";

type Time = "day" | "night";

/**
 * The render of one EdgeLuxe system. Where there is a day render as well, a Day | Night switch shows the same letter
 * both ways (night first: that is the lit letter); otherwise just the single photo.
 */
export default function SystemImage({ config }: { config: LightConfig }) {
  const [time, setTime] = useState<Time>("night");
  const hasDay = Boolean(config.imgDay);
  const src = hasDay && time === "day" ? config.imgDay! : config.img;
  const dims = hasDay ? { width: 1200, height: 900 } : { width: 852, height: 1331 };
  return (
    <figure className="rounded-xl overflow-hidden border border-border bg-card">
      <img
        src={src}
        alt={`${config.title} ${config.subtitle}: sample letter${hasDay ? `, ${time === "night" ? "lit at night" : "by day"}` : ""}`}
        {...dims}
        className="w-full h-auto object-cover"
        loading="eager"
      />
      {hasDay && emitsLight(config) && (
        <figcaption className="p-3 border-t border-border">
          <SegmentedControl<Time>
            label="Day or night view"
            value={time}
            onChange={setTime}
            fill
            options={[
              { value: "night", label: "Night" },
              { value: "day", label: "Day" },
            ]}
          />
        </figcaption>
      )}
    </figure>
  );
}
