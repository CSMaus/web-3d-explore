import { useEffect, useRef, useState } from "react";
import { Text, Heading } from "@kit/index";
import type { Part } from "@/lib/api";

type Props = { part: Part; accent: string };

/**
 * one part of the series: its clip, its length, and beside it the reading text
 * that answers the part's question paragraph by paragraph, one a beat, so the
 * part can be read instead of heard or along with the clip.
 */
export function Reel({ part, accent }: Props) {
  const host = useRef<HTMLElement | null>(null);
  const [near, setNear] = useState(false);

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
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-24">
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
                <span data-text="caption">
                  {part.video ? "Loading" : "Clip not published yet"}
                </span>
              </div>
            )}
          </div>
          <div data-text="caption" className="mt-2">{seconds.toFixed(0)} s</div>
        </div>
        <article className="max-w-2xl">
          {part.question ? <Heading level={3}>{part.question}</Heading> : null}
          <div className="mt-4 space-y-4">
            {(part.text ?? []).map((paragraph, i) => (
              <Text kind="body" as="p" key={i}>
                {paragraph}
              </Text>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
