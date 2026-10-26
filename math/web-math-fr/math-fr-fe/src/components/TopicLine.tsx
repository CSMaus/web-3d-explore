import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SolidFigure } from "@kit/index";
import type { Card } from "@/lib/api";
import { SHAPES, topicLabel } from "@/lib/shapes";
import { builtAt } from "@/lib/topic";

/** how long the light takes to run the whole line, in seconds */
const LINE_SECONDS = 9;

/**
 * the topics in reading order on one straight line: five cards in a row on a wide
 * screen, one under another on a narrow one, each with its turning figure, and a
 * straight line through the figures' centres with a light running along it from the
 * first topic to the last. a card under the pointer or the keyboard turns its figure
 * faster and lifts. the line is measured from the figures where they stand.
 */
export function TopicLine({ topics }: { topics: Card[] }) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement | null>(null);
  const figures = useRef<(HTMLDivElement | null)[]>([]);
  const [line, setLine] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [lit, setLit] = useState<string | null>(null);

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const measure = () => {
      const base = host.getBoundingClientRect();
      const at = figures.current.filter(Boolean).map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2];
      });
      setLine(at.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" "));
      setSize({ w: base.width, h: base.height });
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(host);
    return () => watch.disconnect();
  }, [topics.length]);

  return (
    <div ref={box} data-slot="topic-graph" className="relative">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={size.w} height={size.h}>
        {line ? (
          <>
            <path d={line} fill="none" stroke="var(--c-border)" strokeWidth={1} pathLength={1} />
            <path d={line} fill="none" stroke="var(--c-glow)" strokeWidth={2} strokeLinecap="round" pathLength={1} data-slot="graph-light" style={{ strokeDasharray: "0.08 0.92", animationDuration: `${LINE_SECONDS}s` }} />
          </>
        ) : null}
      </svg>
      <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-5">
        {topics.map((topic, i) => {
          const built = builtAt(topic.slug);
          const shape = SHAPES[topic.slug];
          const on = lit === topic.slug;
          const inner = (
            <>
              <div
                ref={(el) => {
                  figures.current[i] = el;
                }}
                className="mx-auto aspect-square w-full max-w-[200px] max-lg:mx-0 max-lg:w-28 max-lg:shrink-0"
              >
                {shape ? <SolidFigure kind={shape} lit={on} className="h-full w-full" /> : null}
              </div>
              <div className="min-w-0 lg:mt-5">
                <div data-text="label">{topicLabel(topic.number, t)}</div>
                <div data-text="itemTitle" className="mt-1">{topic.title}</div>
                <p data-text="note" className="mt-2">{t(`front.lines.${topic.slug}`)}</p>
                <div data-text="tab" className="mt-4" data-slot="graph-open">
                  {t("front.openTopic")} →
                </div>
              </div>
            </>
          );
          const row = "flex items-center gap-5 lg:block";
          return (
            <li key={topic.slug} className="self-stretch">
              {built ? (
                <Link
                  to={built.landing}
                  data-slot="panel"
                  data-lit={on || undefined}
                  className={`fractal-obstacle h-full ${row}`}
                  onMouseEnter={() => setLit(topic.slug)}
                  onMouseLeave={() => setLit(null)}
                  onFocus={() => setLit(topic.slug)}
                  onBlur={() => setLit(null)}
                >
                  {inner}
                </Link>
              ) : (
                <div data-slot="panel" className={row}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
