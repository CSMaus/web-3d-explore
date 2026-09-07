import { useEffect, useRef } from "react";

let watcher: IntersectionObserver | null = null;

function shared() {
  if (watcher) return watcher;
  watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("shown");
          watcher?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
  );
  return watcher;
}

export function useRise<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--rise-delay", `${delay}ms`);
    const obs = shared();
    obs.observe(node);
    return () => obs.unobserve(node);
  }, [delay]);
  return ref;
}

export function useInView<T extends HTMLElement>(
  onChange: (visible: boolean) => void,
  amount = 0.55,
) {
  const ref = useRef<T | null>(null);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => cb.current(entry.isIntersecting),
      { threshold: amount },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [amount]);
  return ref;
}
