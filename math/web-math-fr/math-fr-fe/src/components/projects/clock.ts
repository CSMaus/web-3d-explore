import { useEffect, useRef, useState } from "react";

/**
 * the time of a project figure, in seconds, advanced on animation frames while the figure is on
 * screen and the page is not scrolling. a reader who asked for less motion gets one still frame,
 * at `still` seconds, chosen so the picture shows its point. `fps` caps how often the figure
 * repaints, so a page of several figures stays light.
 */
export function useClock(still = 0, fps = 30): [number, React.RefObject<HTMLDivElement | null>] {
  const host = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState(still);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    let seen = false;
    let frame = 0;
    let last = 0;
    let clock = still;
    const watch = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      if (seen && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    });
    const loop = (now: number) => {
      frame = 0;
      if (!seen) return;
      const gap = now - last;
      if (gap >= 1000 / fps) {
        // a long gap (a hidden tab, a scroll) does not jump the picture forward
        if (!document.documentElement.dataset.scrolling) clock += Math.min(gap, 100) / 1000;
        last = now;
        setT(clock);
      }
      frame = requestAnimationFrame(loop);
    };
    watch.observe(el);
    return () => {
      watch.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [still, fps]);

  return [t, host];
}
