import { useEffect, useRef, useState } from "react";
import type { Part } from "@/lib/api";

type Props = { part: Part; accent: string };

/**
 * one part of the series: its clip, its name and its length, and a short
 * caption that opens on request. the caption stands in for the voice-over for
 * a reader who cannot hear it; the explanation itself is in the clip.
 */
export function Reel({ part, accent }: Props) {
  const host = useRef<HTMLElement | null>(null);
  const [near, setNear] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    // this observer decides only whether the player is worth mounting. which
    // part the reader is in is decided once for the whole page, by useHere.
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

  const seconds = part.beats.reduce((s, b) => s + b.seconds, 0);
  const src = part.video
    ? `https://www.youtube-nocookie.com/embed/${part.video}?rel=0&modestbranding=1&playsinline=1`
    : "";

  return (
    <section ref={host} className="py-10">
      <div className="mx-auto max-w-3xl">
        <div
          className="relative aspect-video w-full overflow-hidden rounded border"
          style={{ borderColor: accent }}
        >
          {near && src ? (
            <iframe
              src={src}
              title={part.title}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <span className="font-mono text-[11px] text-muted">
                {part.video ? "Loading" : "Clip not published yet"}
              </span>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px] text-muted">
          <span>{seconds.toFixed(0)} s</span>
          {part.caption ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="rounded border border-edge px-2 py-0.5 text-muted transition-colors hover:border-muted hover:text-ink"
            >
              {open ? "Hide description" : "Show description"}
            </button>
          ) : null}
        </div>
        {open ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/80">{part.caption}</p>
        ) : null}
      </div>
    </section>
  );
}
