import { useEffect, useState } from "react";

/** True from the `lg` breakpoint up (1024 px). False until the browser says otherwise, so tests and the first paint use the compact layout. */
export function useDesktop(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return on;
}
