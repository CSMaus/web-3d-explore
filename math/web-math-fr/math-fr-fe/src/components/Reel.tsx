import { useEffect, useRef, useState } from "react";
import type { Beat } from "@/lib/api";

type Props = { beat: Beat; accent: string };

export function Reel({ beat, accent }: Props) {
  const host = useRef<HTMLElement | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    // this observer decides only whether the player is worth mounting. which
    // part the reader is in is decided once for the whole page, by useHere,
    // because a per-beat callback that only fires on entry cannot answer it.
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          watch.disconnect();
        }
      },
      { rootMargin: "600px 0px 600px 0px", threshold: 0 },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, []);

  const src = beat.video
    ? `https://www.youtube-nocookie.com/embed/${beat.video}?rel=0&modestbranding=1&playsinline=1`
    : "";

  return (
    <section ref={host} className="grid gap-8 py-16 lg:grid-cols-[1fr_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div
          className="relative aspect-video w-full overflow-hidden rounded border"
          style={{ borderColor: accent }}
        >
          {near && src ? (
            <iframe
              src={src}
              title={beat.slug}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <span className="font-mono text-[11px] text-muted">
                {beat.video ? "loading" : "clip not published yet"}
              </span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline justify-between font-mono text-[11px] text-muted">
          <span>{beat.slug}</span>
          <span>{beat.seconds.toFixed(1)} s</span>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: accent }}>
            what is on screen
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">{beat.shows}</p>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
            why the beat exists
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{beat.why}</p>
        </div>
        <blockquote
          className="border-l-2 pl-4 text-sm leading-relaxed text-ink/75 italic"
          style={{ borderColor: accent }}
        >
          {beat.say}
        </blockquote>
      </div>
    </section>
  );
}
