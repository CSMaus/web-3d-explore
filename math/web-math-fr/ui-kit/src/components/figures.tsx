import * as React from "react";
import { FIGURES, type FigureKind } from "../lib/figures";
import { project, SOLIDS, WALK_REFERENCE, walkLength, type SolidKind } from "../lib/solids";

/**
 * a line figure: a fractal drawn as thin edges with a light travelling along
 * them. every piece of the figure is in one path, so a figure is a handful of
 * elements however many pieces it has, and the light runs along all of them in
 * turn. the light is three strokes on the same path: a wide faint halo, a
 * longer fading tail, and a short bright core, so it reads as a point of light
 * with a trail rather than a band. every path carries pathLength 1, so the
 * lengths in the sheet are fractions of the whole figure.
 */
export function EdgeFigure({ kind, className, ...props }: React.ComponentProps<"svg"> & { kind: FigureKind }) {
  const d = React.useMemo(() => FIGURES[kind]().join(" "), [kind]);
  return (
    <svg data-slot="edge-figure" data-kind={kind} viewBox="0 0 100 100" className={className} aria-hidden="true" {...props}>
      <path className="edge-low" d={d} pathLength={1} />
      <path className="edge-high" d={d} pathLength={1} />
      <path className="edge-base" d={d} pathLength={1} />
      <path className="edge-halo" d={d} pathLength={1} />
      <path className="edge-tail" d={d} pathLength={1} />
      <path className="edge-core" d={d} pathLength={1} />
    </svg>
  );
}

/**
 * a line figure from path data in a 100 by 100 box (built with the helpers in
 * lib/motifs.ts), with the same light as the other figures, for a tile that shows
 * one exact thing. `walk` is the one unbroken line the light walks along; the
 * browser starts a dash again at every separate piece of a path, so a light on a
 * drawing of many pieces would light them all at once. the paths are fixed and the
 * light runs in the sheet, so a page of these costs nothing per frame.
 */
export function LineFigure({ d, walk, className, ...props }: React.ComponentProps<"svg"> & { d: string; walk?: string }) {
  const w = walk ?? d;
  return (
    <svg data-slot="edge-figure" data-kind="line" viewBox="0 0 100 100" className={className} aria-hidden="true" {...props}>
      <path className="edge-base" d={d} pathLength={1} />
      <path className="edge-halo" d={w} pathLength={1} />
      <path className="edge-tail" d={w} pathLength={1} />
      <path className="edge-core" d={w} pathLength={1} />
    </svg>
  );
}

/** a full turn of a solid figure, in seconds, and how much faster it turns while it is lit */
const SOLID_TURN = 60;
const SOLID_FAST = 3;
/** how many times a second a turning figure is drawn: its turn is slow, so this reads as smooth */
const SOLID_FPS = 16;

/**
 * a solid figure: a shape in three dimensions, turning slowly about its upright
 * axis, drawn with the same edges and travelling light as the flat figures.
 * `lit` speeds the turn up, smoothly, for a card under the pointer. it turns only
 * while it is on the screen and the tab is shown, and stands still for a reader
 * who asks for less motion. the path is written straight into the svg, so a
 * frame renders nothing in react.
 */
export function SolidFigure({ kind, lit = false, className, style, ...props }: React.ComponentProps<"svg"> & { kind: SolidKind; lit?: boolean }) {
  const lines = React.useMemo(() => SOLIDS[kind](), [kind]);
  // the lap scales with the walking line's length, between half and twice the set lap
  const pace = React.useMemo(() => Math.min(2, Math.max(0.5, walkLength(lines) / WALK_REFERENCE)), [lines]);
  const host = React.useRef<SVGSVGElement | null>(null);
  const fast = React.useRef(lit);
  React.useEffect(() => {
    fast.current = lit;
  }, [lit]);

  React.useEffect(() => {
    const svg = host.current;
    if (!svg) return;
    const base = svg.querySelector(".edge-base");
    const light = Array.from(svg.querySelectorAll<SVGPathElement>(".edge-halo, .edge-tail, .edge-core"));
    const walk = lines.slice(-1);
    const single = lines.length === 1;
    let angle = 0.6;
    const paint = () => {
      const all = project(lines, angle);
      base?.setAttribute("d", all);
      // a figure of one line walks its whole drawing: the same path data, made once
      const w = single ? all : project(walk, angle);
      for (const p of light) p.setAttribute("d", w);
    };
    paint();
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (still) return;

    // the light's lap and its breathing, as the sheet sets them, are played here in step with the
    // turn, a few times a second, rather than by the sheet at the screen's rate: the sheet's
    // animations repainted every figure on every frame
    const timing = getComputedStyle(light[light.length - 1] ?? svg);
    const names = timing.animationName.split(",").map((n) => n.trim());
    const seconds = timing.animationDuration.split(",").map((d) => parseFloat(d) * (d.trim().endsWith("ms") ? 0.001 : 1));
    const lap = seconds[names.findIndex((n) => n.startsWith("travel"))] || 16;
    const breathIndex = names.findIndex((n) => n.startsWith("breathe"));
    const breath = breathIndex >= 0 ? seconds[breathIndex] : 0;
    for (const p of light) p.style.animation = "none";
    let clock = Math.random() * lap;

    let frame = 0;
    let shown = true;
    let speed = 1;
    let last = performance.now();
    let drawn = 0;
    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      if (now - drawn < 1000 / SOLID_FPS) return;
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      drawn = now;
      speed += ((fast.current ? SOLID_FAST : 1) - speed) * Math.min(1, dt * 3);
      angle += ((Math.PI * 2) / SOLID_TURN) * speed * dt;
      clock += dt;
      paint();
      const offset = (-(clock / lap) % 1).toFixed(4);
      const glow = breath ? (0.775 - 0.225 * Math.cos((clock / breath) * Math.PI * 2)).toFixed(3) : "";
      for (const p of light) {
        p.style.strokeDashoffset = offset;
        if (breath) p.style.opacity = glow;
      }
    };
    const run = () => {
      cancelAnimationFrame(frame);
      if (shown && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(step);
      }
    };
    const watch = new IntersectionObserver(([e]) => {
      shown = e.isIntersecting;
      run();
    });
    watch.observe(svg);
    document.addEventListener("visibilitychange", run);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      document.removeEventListener("visibilitychange", run);
    };
  }, [lines]);

  return (
    <svg ref={host} data-slot="edge-figure" data-kind={kind} data-solid="" data-lit={lit || undefined} viewBox="0 0 100 100" className={className} aria-hidden="true" style={{ "--walk-scale": pace.toFixed(2), ...style } as React.CSSProperties} {...props}>
      <path className="edge-base" pathLength={1} />
      <path className="edge-halo" pathLength={1} />
      <path className="edge-tail" pathLength={1} />
      <path className="edge-core" pathLength={1} />
    </svg>
  );
}
