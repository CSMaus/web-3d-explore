import { useEffect, useRef } from "react";

/**
 * the front page's Mandelbulb as a baked video: one whole period of the live bulb's turn, recorded
 * frame by frame with its transparency (scripts/bake-bulb.mjs), so it lies over the page as the
 * shader did and costs a video decode instead of a ray march through every pixel. Safari plays the
 * HEVC file, which keeps the transparency there; every other browser the WebM. it plays only while
 * on screen, and a reader who asked for less motion gets its first frame, still. a video that
 * does not load (not baked yet for a theme) hands back to the live bulb through onMissing.
 */
const SAFARI = typeof navigator !== "undefined" && /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Firefox/.test(navigator.userAgent);

export function BakedBulb({ kase, view, className, onMissing }: { kase: string; view: "solid" | "contour"; className?: string; onMissing?: () => void }) {
  const host = useRef<HTMLVideoElement | null>(null);
  const src = `${import.meta.env.BASE_URL}baked/bulb-${kase}-${view}.${SAFARI ? "mov" : "webm"}`;

  useEffect(() => {
    const video = host.current;
    if (!video) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      video.pause();
      return;
    }
    const watch = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void video.play().catch(() => undefined);
      else video.pause();
    });
    watch.observe(video);
    return () => watch.disconnect();
  }, [src]);

  return <video ref={host} key={src} className={className} src={src} muted loop playsInline preload="auto" aria-hidden="true" onError={onMissing} />;
}
