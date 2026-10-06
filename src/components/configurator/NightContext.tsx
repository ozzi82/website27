import { createContext, useContext, useLayoutEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { FADE_SECONDS, easeInOut, stepProgress } from "./nightFade";

type NightRef = MutableRefObject<number>;

// A ref rather than React state: the amount changes every frame during a fade, and
// re-rendering the scene 60 times a second for that would be wasteful. Consumers
// read it in their own frame loop and write straight to materials and lights.
const NightContext = createContext<NightRef>({ current: 0 });

interface NightProviderProps {
  isNight: boolean;
  /** A night amount (0-1) written by someone else, e.g. the building film's clock: used as is, with no fade of its own. */
  driven?: NightRef;
  children: ReactNode;
}

/** Owns the damped `nightAmount` (0 = day, 1 = night) that every day/night-dependent part of the scene follows. */
export function NightProvider({ isNight, driven, children }: NightProviderProps) {
  const progress = useRef(isNight ? 1 : 0); // start settled: mounting at night must not fade in
  const amount = useRef(progress.current);
  // Runs before every other frame callback so they all see this frame's value.
  useFrame((_, delta) => {
    progress.current = stepProgress(progress.current, isNight ? 1 : 0, delta, FADE_SECONDS);
    amount.current = easeInOut(progress.current);
  }, -1);
  return <NightContext.Provider value={driven ?? amount}>{children}</NightContext.Provider>;
}

/**
 * Calls `apply(nightAmount)` after every render (so freshly changed props such as a new
 * glow colour take effect at once) and on every frame (so the fade animates).
 */
export function useNightEffect(apply: (nightAmount: number) => void) {
  const amount = useContext(NightContext);
  const latest = useRef(apply);
  latest.current = apply;
  useLayoutEffect(() => {
    latest.current(amount.current);
  });
  useFrame(() => latest.current(amount.current));
}
