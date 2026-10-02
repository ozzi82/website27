import { useMemo, useRef } from "react";
import type { BloomEffect } from "postprocessing";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { DayNightToneMapping } from "./DayNightToneMapping";
import { useNightEffect } from "./NightContext";
import { bloomIntensityFor } from "./nightFade";

/**
 * Bloom and tone mapping, mounted for day and night alike so a change never pops a pass in
 * or out: the fade drives the bloom intensity and the tone mapper's day-to-night crossfade.
 * EffectComposer replaces the renderer's own tone mapping, hence the explicit one.
 */
export default function NightEffects({ lit, level = 1 }: { lit: boolean; level?: number }) {
  const bloom = useRef<BloomEffect>(null);
  const toneMapping = useMemo(() => new DayNightToneMapping(), []);

  useNightEffect((n) => {
    // The wrapper types its ref as the effect class rather than an instance, so `bloom` is cast below.
    if (bloom.current) bloom.current.intensity = bloomIntensityFor(n, lit, level);
    toneMapping.night = n;
  });

  return (
    <EffectComposer>
      <Bloom ref={bloom as never} mipmapBlur intensity={0} luminanceThreshold={0.7} luminanceSmoothing={0.25} radius={0.6} />
      <primitive object={toneMapping} dispose={null} />
    </EffectComposer>
  );
}
