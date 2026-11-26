import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

/** the longest frame a story counts, in seconds: a stalled frame does not jump the picture */
const CAP = 0.05;
/** how far outside the screen the story may be and still count as on it */
const MARGIN = "120px";
const REDUCED = "(prefers-reduced-motion: reduce)";

export type StoryClock = { time: number; dt: number; playing: boolean; toggle: () => void };

type Tick = { time: number; dt: number };

function reduced(): boolean {
  return window.matchMedia?.(REDUCED)?.matches ?? false;
}

/**
 * the time of a story picture. time is the seconds spent in motion since the story was mounted,
 * the sum of every dt; dt is the length of the last frame, capped. the time stands while the
 * reader has paused it, while the tab is hidden and while the story is off the screen, and it
 * starts paused for a reader who asked for less motion.
 */
export function useStoryClock(host: RefObject<HTMLElement | null>): StoryClock {
  const [paused, setPaused] = useState(reduced);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [seen, setSeen] = useState(true);
  const [tick, setTick] = useState<Tick>({ time: 0, dt: 0 });
  const playing = !paused && !hidden && seen;

  useEffect(() => {
    const change = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const watch = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setSeen(entry.isIntersecting);
      },
      { rootMargin: MARGIN },
    );
    watch.observe(el);
    return () => watch.disconnect();
  }, [host]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    // the first frame after a stop only takes the time, so the stop itself is not counted
    let last: number | null = null;
    const loop = (now: number) => {
      const dt = last === null ? 0 : Math.min(CAP, Math.max(0, (now - last) / 1000));
      last = now;
      setTick((t) => ({ time: t.time + dt, dt }));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const toggle = useCallback(() => setPaused((v) => !v), []);

  return { time: tick.time, dt: playing ? tick.dt : 0, playing, toggle };
}
