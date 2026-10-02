/** LED brightness is a percentage the visitor sets with the dimmer slider. */
export const DEFAULT_BRIGHTNESS = 100;

/**
 * Scale applied to everything that emits light at night (face and side glow, halo spill, bloom).
 * Squared so the slider feels even: perceived brightness is roughly the square root of emitted
 * light, so a straight-line slider would seem to do nothing until the very bottom.
 */
export function brightnessFactor(percent: number): number {
  if (Number.isNaN(percent)) return 1;
  const p = Math.min(100, Math.max(0, percent)) / 100;
  return p * p;
}
