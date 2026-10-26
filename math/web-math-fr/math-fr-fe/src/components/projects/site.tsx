import { useState } from "react";
import { Readout, Verdict } from "@kit/index";
import type { Pen } from "@/components/Plot";
import { EDGE, FAINT, GROUND, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { inside, lay, picture, type View } from "./escape";
import { koch } from "./koch";
import { Live } from "./Live";
import { ease, fill, outline, say } from "./paint";

/**
 * the figures of this site's own project: a Julia set redrawn for any constant picked on the map
 * of the Mandelbrot set, a strip of clips, a slider moving a picture, an orbit with its numbers,
 * and a deep view arriving coarse first.
 */

const JULIA_VIEW: View = { cx: 0, cy: 0, span: 3.3 };
const MAP_VIEW: View = { cx: -0.65, cy: 0, span: 2.9 };

const colours = () => ({ ground: GROUND, mid: SKY, hot: ONE, inside: FAINT });

/** a constant on the edge of the main bulb, a little outside it, moving round with time */
function wander(t: number): [number, number] {
  const a = t * 0.22 + 1.2;
  const k = 1.015;
  return [k * (0.5 * Math.cos(a) - 0.25 * Math.cos(2 * a)), k * (0.5 * Math.sin(a) - 0.25 * Math.sin(2 * a))];
}

/** how many samples a box of the figure gets across, at a share of its pixels */
function samples(pen: Pen, w: number, share: number): number {
  return Math.max(24, Math.round(Math.abs(pen.px(w) - pen.px(0)) * share));
}

export function SiteThumb() {
  return (
    <Live
      label={L("A Julia set changing shape as its constant moves")}
      fps={12}
      still={6}
      className="h-full"
      draw={(pen, t) => {
        const c = wander(t);
        const w = samples(pen, 16, 0.4);
        const h = Math.round((w * 9) / 16);
        lay(pen, picture("site-thumb", w, h, { cx: 0, cy: 0, span: 3.6 }, colours(), c, 48), 0, 0, 16, 9);
      }}
    />
  );
}

export function SiteHero() {
  const [c, setC] = useState<[number, number] | null>(null);
  const [shown, setShown] = useState<[number, number]>(wander(6));
  const pick = (x: number, y: number) => {
    if (x < 10) return;
    const span = MAP_VIEW.span;
    const cx = MAP_VIEW.cx + ((Math.min(16, Math.max(10.4, x)) - 13.2) / 5.6) * span;
    const cy = MAP_VIEW.cy + ((Math.min(7.4, Math.max(1.6, y)) - 4.5) / 5.6) * span;
    setC([cx, cy]);
    setShown([cx, cy]);
  };
  const connected = inside(shown[0], shown[1]);
  return (
    <div className="space-y-3">
      <Live
        label={L("A Julia set, and the map of the Mandelbrot set where its constant is picked")}
        fps={c ? 4 : 15}
        still={6}
        className="aspect-[16/9] w-full"
        deps={[c]}
        onDrag={pick}
        draw={(pen, t) => {
          const now = c ?? wander(t);
          if (!c && Math.abs(now[0] - shown[0]) + Math.abs(now[1] - shown[1]) > 0.02) queueMicrotask(() => setShown(now));
          const w = samples(pen, 9.6, c ? 0.75 : 0.42);
          const h = Math.round((w * 9) / 9.6);
          lay(pen, picture("site-hero", w, h, { ...JULIA_VIEW, span: 3.3 }, colours(), now, c ? 120 : 70), 0, 0, 9.6, 9);
          // the map of c
          const mw = samples(pen, 5.6, 0.6);
          lay(pen, picture("site-map", mw, mw, MAP_VIEW, { ground: GROUND, mid: EDGE, hot: MUTED, inside: TWO }, undefined, 60), 10.4, 1.7, 5.6, 5.6);
          outline(pen, 10.4, 1.7, 5.6, 5.6, EDGE, 1, 6);
          const mx = 13.2 + ((now[0] - MAP_VIEW.cx) / MAP_VIEW.span) * 5.6;
          const my = 4.5 + ((now[1] - MAP_VIEW.cy) / MAP_VIEW.span) * 5.6;
          pen.ring(mx, my, 6, INK, 2);
          pen.dot(mx, my, 2.5, ONE);
          say(pen, L("Drag c across the map"), 10.4, 7.9, MUTED, { size: 12 });
          say(pen, L("The Mandelbrot set"), 10.4, 1.0, MUTED, { size: 11 });
        }}
      />
      <Verdict good={connected ? true : undefined}>
        {connected ? L("c is inside the Mandelbrot set, so its Julia set is one connected piece.") : L("c is outside the Mandelbrot set, so its Julia set falls apart into dust.")}
      </Verdict>
      <Readout
        rows={[
          [L("The constant c"), `${shown[0].toFixed(3)} ${shown[1] < 0 ? "-" : "+"} ${Math.abs(shown[1]).toFixed(3)}i`],
          [L("The rule"), "z → z² + c"],
        ]}
      />
    </div>
  );
}

/** a strip of film passing by, each frame one step of the Koch curve */
export function SiteWatch() {
  return (
    <Live
      label={L("A strip of clips passing by, each showing one more step of a fractal")}
      still={1.2}
      draw={(pen, t) => {
        const frameW = 5.2;
        const shift = (t * 1.2) % frameW;
        fill(pen, -1, 1.2, 18, 6.6, FAINT, 0.6);
        for (let k = -1; k < 5; k++) {
          const x = k * frameW - shift + 0.3;
          const level = (((k + Math.floor((t * 1.2) / frameW)) % 4) + 4) % 4;
          outline(pen, x, 2, frameW - 0.6, 5, EDGE, 1, 3);
          pen.line(koch(level, [x + 0.4, 3], [x + frameW - 1, 3]), ONE, 1.4);
          say(pen, String(level), x + 0.25, 6.4, MUTED, { size: 10, mono: true });
        }
        for (let k = -1; k < 34; k++) {
          const x = k * 0.55 - ((t * 1.2) % 0.55);
          fill(pen, x, 7.25, 0.25, 0.3, GROUND);
          fill(pen, x, 1.45, 0.25, 0.3, GROUND);
        }
      }}
    />
  );
}

/** a slider moved by an unseen hand, and the picture following it */
export function SiteMove() {
  return (
    <Live
      label={L("A slider moving, and a Julia set redrawn at each position")}
      fps={15}
      still={2}
      draw={(pen, t) => {
        const k = 0.5 + 0.5 * Math.sin(t * 0.7);
        const c: [number, number] = [-0.8 + 0.5 * k, 0.156 + 0.1 * k];
        const w = samples(pen, 8, 0.5);
        const h = Math.round((w * 7) / 8);
        lay(pen, picture("site-move", w, h, { cx: 0, cy: 0, span: 3.4 }, colours(), c, 60), 7.6, 1, 8, 7);
        say(pen, L("Real part of c"), 0.4, 6.4, MUTED, { size: 12 });
        pen.line([[0.4, 5], [6.6, 5]], EDGE, 3);
        pen.line([[0.4, 5], [0.4 + 6.2 * k, 5]], ONE, 3);
        pen.dot(0.4 + 6.2 * k, 5, 7, INK);
        say(pen, c[0].toFixed(2), 6.6, 6.4, SKY, { size: 12, mono: true, align: "right" });
        say(pen, L("Every pixel is computed"), 0.4, 3, MUTED, { size: 11 });
        say(pen, L("again for the new value."), 0.4, 2.3, MUTED, { size: 11 });
      }}
    />
  );
}

/** the orbit of zero under z² + c, point by point, with the values written beside it */
export function SiteRead() {
  const c: [number, number] = [-0.122, 0.745];
  const orbit: [number, number][] = [[0, 0]];
  for (let n = 0; n < 40; n++) {
    const [x, y] = orbit[orbit.length - 1];
    orbit.push([x * x - y * y + c[0], 2 * x * y + c[1]]);
  }
  return (
    <Live
      label={L("The orbit of zero under z squared plus c, drawn point by point with its values")}
      still={9}
      box={{ x0: -1.3, x1: 3.1, y0: -1.2, y1: 1.3 }}
      draw={(pen, t) => {
        const n = Math.min(orbit.length - 1, Math.floor((t * 2.2) % (orbit.length + 6)));
        pen.axes(FAINT);
        pen.ring(0, 0, Math.abs(pen.px(1) - pen.px(0)), FAINT, 1);
        pen.line(orbit.slice(0, n + 1), EDGE, 1);
        orbit.slice(0, n + 1).forEach(([x, y], i) => pen.dot(x, y, i === n ? 4 : 2, i === n ? ONE : SKY));
        const rows = orbit.slice(Math.max(0, n - 3), n + 1);
        rows.forEach(([x, y], i) => {
          const k = Math.max(0, n - 3) + i;
          say(pen, `z${String(k).padStart(2, "0")} = ${x.toFixed(3)} ${y < 0 ? "-" : "+"} ${Math.abs(y).toFixed(3)}i`, 1.05, 1.0 - i * 0.22, k === n ? ONE : MUTED, { size: 11, mono: true });
        });
        say(pen, `c = ${c[0]} + ${c[1]}i`, 1.05, -0.1, INK, { size: 11, mono: true });
        say(pen, L("Settles into a cycle of three"), 1.05, -0.38, MUTED, { size: 11, alpha: ease(n, 18, 24) });
      }}
    />
  );
}

let blocks: HTMLCanvasElement | null = null;

/** a deep view of the Mandelbrot set arriving in blocks, each pass finer than the last */
export function SiteZoom() {
  return (
    <Live
      label={L("A view of the Mandelbrot set arriving coarse first, then finer")}
      fps={10}
      still={4}
      draw={(pen, t) => {
        const w = samples(pen, 9, 0.5);
        const h = Math.round((w * 7) / 9);
        const full = picture("site-zoom", w, h, { cx: -0.743644, cy: 0.131826, span: 0.012 }, colours(), undefined, 220);
        const pass = Math.floor((t / 0.7) % 7);
        const block = [32, 16, 8, 4, 2, 1, 1][pass];
        if (full) {
          // one small canvas for the blocks, kept from frame to frame
          const small = (blocks ??= document.createElement("canvas"));
          small.width = Math.max(1, Math.ceil(w / block));
          small.height = Math.max(1, Math.ceil(h / block));
          small.getContext("2d")?.drawImage(full, 0, 0, small.width, small.height);
          lay(pen, small, 0.4, 0.5, 9, 7, false);
        }
        outline(pen, 0.4, 0.5, 9, 7, EDGE, 1, 2);
        say(pen, L("Pass {{n}} of 6", { n: Math.min(6, pass + 1) }), 10.2, 6.6, INK, { size: 13, mono: true });
        say(pen, L("{{n}} pixels a block", { n: block }), 10.2, 5.8, MUTED, { size: 12 });
        say(pen, L("Computed on a server"), 10.2, 3.2, MUTED, { size: 11 });
        say(pen, L("in double precision"), 10.2, 2.5, MUTED, { size: 11 });
      }}
    />
  );
}
