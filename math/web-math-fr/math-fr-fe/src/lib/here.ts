import { useEffect, useRef, useState } from "react";

const UNDER_MENU = 96;

/**
 * reports which of the given section ids is the one currently under the menu
 * bar. one observer for the whole page, watching the sections themselves, so
 * the answer is the same whichever direction the page is being scrolled.
 */
export function useHere(ids: string[]): [string, (id: string) => void] {
  const [here, setHere] = useState(ids[0] ?? "");
  const key = ids.join("|");
  const seen = useRef<Set<string>>(new Set());
  // a click sets the answer directly, and the observer is muted just long
  // enough for the callback the click's own scroll triggers. the scroll is
  // instant, so there is no travel to ignore and the window stays short: any
  // longer and the mark stops following a reader who scrolls straight after
  // clicking.
  const held = useRef(0);

  useEffect(() => {
    seen.current = new Set();
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => !!n);
    if (!nodes.length) return;
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.current.add(entry.target.id);
          else seen.current.delete(entry.target.id);
        }
        if (Date.now() < held.current) return;
        const first = ids.find((id) => seen.current.has(id));
        if (first) setHere(first);
      },
      { rootMargin: `-${UNDER_MENU}px 0px -55% 0px`, threshold: 0 },
    );
    nodes.forEach((n) => watch.observe(n));
    return () => watch.disconnect();
    // ids is rebuilt on every render, so the joined key is what actually changes
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (id: string) => {
    held.current = Date.now() + 250;
    setHere(id);
  };

  return [here, go];
}
