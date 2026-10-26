import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SolidFigure } from "@kit/index";
import type { Card } from "@/lib/api";
import { SHAPES, topicLabel } from "@/lib/shapes";
import { builtAt } from "@/lib/topic";

/** where each card sits on a wide screen, in reading order: a column span on a twelve-column grid and a drop from the row's top */
const PLACES = [
  "md:col-start-1 md:col-end-4 md:row-start-1",
  "md:col-start-5 md:col-end-8 md:row-start-1 md:mt-40",
  "md:col-start-9 md:col-end-12 md:row-start-1 md:mt-8",
  "md:col-start-2 md:col-end-5 md:row-start-2 md:mt-10",
  "md:col-start-7 md:col-end-10 md:row-start-2 md:mt-36",
];

/** seconds the light takes to run one link; it runs the links one after another, in reading order */
const LINK_SECONDS = 2.6;

type Pt = { x: number; y: number };
type Edge = { d: string; a: Pt; b: Pt };

/** where the ray from a box's centre towards a point leaves the box */
function port(r: DOMRect, base: DOMRect, to: Pt): Pt {
  const c = { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  const k = Math.min(Math.abs(r.width / 2 / (dx || 1e-6)), Math.abs(r.height / 2 / (dy || 1e-6)));
  return { x: c.x + dx * k, y: c.y + dy * k };
}

/**
 * the topics as a graph: five cards in reading order on a zigzag, each with a turning
 * figure, joined one to the next by curves that leave and meet the cards at small
 * ports. one light runs the reading order, link after link, and each card glows as it
 * arrives. a card under the pointer or the keyboard turns its figure faster and lifts,
 * its own links brighten and the others dim. the curves are measured from the cards
 * where they stand, so they follow any width; a reader who asks for less motion gets
 * the graph still.
 */
export function TopicGraph({ topics }: { topics: Card[] }) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement | null>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const lights = useRef<(SVGPathElement | null)[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [lit, setLit] = useState<number | null>(null);

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const measure = () => {
      const base = host.getBoundingClientRect();
      const rects = cards.current.filter(Boolean).map((el) => (el as HTMLElement).getBoundingClientRect());
      const centre = (r: DOMRect): Pt => ({ x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 });
      const out: Edge[] = [];
      for (let i = 0; i + 1 < rects.length; i += 1) {
        const a = port(rects[i], base, centre(rects[i + 1]));
        const b = port(rects[i + 1], base, centre(rects[i]));
        const across = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
        const bend = Math.max(40, (across ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y)) * 0.5);
        const [c1, c2] = across
          ? [{ x: a.x + Math.sign(b.x - a.x) * bend, y: a.y }, { x: b.x - Math.sign(b.x - a.x) * bend, y: b.y }]
          : [{ x: a.x, y: a.y + Math.sign(b.y - a.y) * bend }, { x: b.x, y: b.y - Math.sign(b.y - a.y) * bend }];
        out.push({ a, b, d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}` });
      }
      setEdges(out);
      setSize({ w: base.width, h: base.height });
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(host);
    return () => watch.disconnect();
  }, [topics.length]);

  // the light runs the links in turn, and each card glows as the light reaches it
  useEffect(() => {
    if (!edges.length || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const n = edges.length;
    const lap = n * LINK_SECONDS * 1000;
    const runs: Animation[] = [];
    lights.current.slice(0, n).forEach((path, i) => {
      if (!path?.animate) return;
      runs.push(
        path.animate(
          [
            { strokeDashoffset: 0.16, opacity: 1, offset: 0 },
            { strokeDashoffset: -1, opacity: 1, offset: 1 / n },
            { strokeDashoffset: -1, opacity: 0, offset: Math.min(1, 1 / n + 0.001) },
            { strokeDashoffset: -1, opacity: 0, offset: 1 },
          ],
          { duration: lap, delay: i * LINK_SECONDS * 1000, iterations: Infinity, easing: "linear" },
        ),
      );
    });
    cards.current.slice(1, n + 1).forEach((card, i) => {
      if (!card?.animate) return;
      const at = Math.min(0.98, (i + 1) / n);
      runs.push(
        card.animate(
          [
            { outlineColor: "transparent", offset: 0 },
            { outlineColor: "transparent", offset: Math.max(0, at - 0.02) },
            { outlineColor: "var(--c-glow)", offset: at },
            { outlineColor: "transparent", offset: Math.min(1, at + 0.12) },
          ],
          { duration: lap, iterations: Infinity },
        ),
      );
    });
    return () => runs.forEach((r) => r.cancel());
  }, [edges.length]);

  const touches = (i: number) => lit === null || lit === i || lit === i + 1;

  return (
    <div ref={box} data-slot="topic-graph" className="relative">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0" width={size.w} height={size.h}>
        {edges.map((e, i) => (
          <g key={i} style={{ opacity: touches(i) ? 1 : 0.25, transition: "opacity 300ms ease" }}>
            <path d={e.d} fill="none" stroke="var(--c-border)" strokeWidth={lit !== null && touches(i) ? 2 : 1.25} />
            <path
              ref={(el) => {
                lights.current[i] = el;
              }}
              d={e.d}
              fill="none"
              stroke="var(--c-glow)"
              strokeWidth={2.5}
              strokeLinecap="round"
              pathLength={1}
              style={{ strokeDasharray: "0.16 0.84", strokeDashoffset: 0.16, filter: "drop-shadow(0 0 4px var(--c-glow))" }}
            />
            {[e.a, e.b].map((p, k) => (
              <circle key={k} cx={p.x} cy={p.y} r={4} fill="var(--c-background)" stroke={lit !== null && touches(i) ? "var(--c-glow)" : "var(--c-border)"} strokeWidth={1.5} />
            ))}
          </g>
        ))}
      </svg>
      <ol className="relative grid gap-6 md:grid-cols-12 md:gap-x-6 md:gap-y-10">
        {topics.map((topic, i) => {
          const built = builtAt(topic.slug);
          const shape = SHAPES[topic.slug];
          const on = lit === i;
          const inner = (
            <>
              <div className="mx-auto aspect-square w-full max-w-[240px]">{shape ? <SolidFigure kind={shape} lit={on} className="h-full w-full" /> : null}</div>
              <div data-text="label" className="mt-4">
                {topicLabel(topic.number, t)}
              </div>
              <div data-text="itemTitle" className="mt-1">
                {topic.title}
              </div>
              <p data-text="note" className="mt-2">
                {t(`front.lines.${topic.slug}`)}
              </p>
              <div data-text="tab" className="mt-4" data-slot="graph-open">
                {t("front.openTopic")} →
              </div>
            </>
          );
          return (
            <li key={topic.slug} className={`self-start ${PLACES[i] ?? ""}`}>
              {built ? (
                <Link
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  to={built.landing}
                  data-slot="panel"
                  data-lit={on || undefined}
                  className="fractal-obstacle block"
                  style={{ outline: "2px solid transparent", outlineOffset: 4 }}
                  onMouseEnter={() => setLit(i)}
                  onMouseLeave={() => setLit(null)}
                  onFocus={() => setLit(i)}
                  onBlur={() => setLit(null)}
                >
                  {inner}
                </Link>
              ) : (
                <div data-slot="panel">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
