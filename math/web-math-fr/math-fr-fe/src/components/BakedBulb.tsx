import { useEffect, useRef } from "react";
import { kitTheme, useMode } from "@kit/index";

/**
 * the front page's Mandelbulb as a baked video (scripts/bake-bulb.mjs): one whole period of the
 * live bulb's turn, in plain H.264, which every computer and phone decodes in its hardware, laid on
 * the page's own colour for the mode in force, its edges fading out so no square shows. a small screen gets the 720 px file; a device that should be spared
 * video (data saver on, two cores or less, little memory) and a reader who asked for less motion
 * get the still frame. it plays only while on screen. a file that does not load hands back to the
 * live bulb through onMissing.
 */
const SPARE = (() => {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return Boolean(nav.connection?.saveData) || (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
})();

export function BakedBulb({ kase, className, onMissing }: { kase: string; className?: string; onMissing?: () => void }) {
  const host = useRef<HTMLVideoElement | null>(null);
  const mode = useMode(kitTheme.colours.default);
  const small = typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2) < 1100;
  const base = `${import.meta.env.BASE_URL}baked/bulb-${kase}-${mode}`;
  const src = `${base}-${small ? 720 : 1080}.mp4`;
  const still = SPARE || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

  useEffect(() => {
    const video = host.current;
    if (!video || still) return;
    const watch = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void video.play().catch(() => undefined);
      else video.pause();
    });
    watch.observe(video);
    return () => watch.disconnect();
  }, [src, still]);

  // the video is laid on the page's own colour; its edges fade out, so no square shows
  const look: React.CSSProperties = { maskImage: "radial-gradient(closest-side, #000 72%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent)" };

  if (still) return <img className={className} src={`${base}.jpg`} alt="" aria-hidden="true" style={look} onError={onMissing} />;
  return <video ref={host} key={src} className={className} src={src} poster={`${base}.jpg`} muted loop playsInline preload="auto" aria-hidden="true" style={look} onError={onMissing} />;
}
