import { useRef, useState } from "react";
import { Readout } from "@kit/index";
import { Slider } from "@/components/Slider";
import { EDGE, FAINT, GROUND, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { lay, picture } from "./escape";
import { koch, snowflake } from "./koch";
import { Live } from "./Live";
import { ease, fill, ink, outline, say } from "./paint";

/**
 * the figures of the fractals series: the Koch curve built step by step with its numbers, a
 * coast measured with shorter and shorter rulers, boxes counted at finer and finer grids, the
 * fern drawn from four rules, and points of the plane that stay or escape.
 */

const LOG43 = Math.log(4) / Math.log(3);

export function SeriesThumb() {
  return (
    <Live
      label={L("The Koch snowflake gaining one step after another")}
      still={9}
      className="h-full"
      draw={(pen, t) => {
        const cycle = t % 9;
        const level = Math.min(5, Math.floor(cycle / 1.5));
        const grow = ease(cycle - level * 1.5, 0, 0.9);
        pen.line(snowflake(level, 8, 4.3, 4.1, level ? grow : 1), ONE, 1.4);
      }}
    />
  );
}

export function SeriesHero() {
  const [step, setStep] = useState(3);
  const [held, setHeld] = useState(false);
  // when the step last changed, so the new points rise rather than jump
  const changed = useRef(0);
  const shownStep = useRef(3);
  return (
    <div className="space-y-3">
      <Live
        label={L("The Koch curve after the chosen number of steps")}
        still={4}
        className="aspect-[16/7] w-full"
        box={{ x0: 0, x1: 16, y0: 0, y1: 7 }}
        deps={[step, held]}
        draw={(pen, t) => {
          let n = step;
          if (!held) {
            const cycle = t % 14;
            n = Math.min(6, Math.floor(cycle / 2));
          }
          if (n !== shownStep.current) {
            shownStep.current = n;
            changed.current = t;
            if (!held) queueMicrotask(() => setStep(n));
          }
          const grow = n ? ease(t - changed.current, 0, 0.8) : 1;
          pen.line(koch(n, [0.6, 1], [15.4, 1], grow), ONE, 1.6);
          // one piece of the curve marked, with its length
          const pts = koch(n, [0.6, 1], [15.4, 1]);
          if (n <= 4) pen.line([pts[0], pts[1]], SKY, 3);
          say(pen, L("One piece: 1/{{d}} of the whole width", { d: 3 ** n }), 0.6, 0.3, MUTED, { size: 12 });
        }}
      />
      <Slider
        label={L("Steps")}
        min={0}
        max={6}
        step={1}
        value={step}
        format={(v) => String(v)}
        onChange={(v) => {
          setHeld(true);
          setStep(v);
        }}
      />
      <Readout
        rows={[
          [L("Pieces"), (4 ** step).toLocaleString("en")],
          [L("Length of a piece"), `1/${3 ** step}`],
          [L("Length of the curve"), `${(4 / 3) ** step >= 10 ? ((4 / 3) ** step).toFixed(1) : ((4 / 3) ** step).toFixed(3)} × ${L("the width")}`],
          [L("Dimension, log 4 / log 3"), LOG43.toFixed(4)],
        ]}
      />
    </div>
  );
}

/** the same coast walked with rulers a third as long each time */
export function SeriesCoast() {
  return (
    <Live
      label={L("A coast measured with shorter and shorter rulers, the length growing each time")}
      still={6}
      draw={(pen, t) => {
        const k = Math.floor((t / 1.6) % 5);
        pen.line(koch(5, [0.5, 2], [11.5, 2]), FAINT, 1);
        const walk = koch(k, [0.5, 2], [11.5, 2]);
        pen.line(walk, ONE, 1.6);
        walk.forEach(([x, y]) => pen.dot(x, y, k < 3 ? 3 : 1.6, INK));
        say(pen, L("Ruler"), 12.3, 6.6, MUTED, { size: 11 });
        const r = 11 / 3 ** k;
        pen.line([[12.3, 6], [12.3 + Math.max(0.05, Math.min(3.4, r)), 6]], SKY, 3);
        say(pen, L("Length"), 12.3, 4.4, MUTED, { size: 11 });
        say(pen, `${((4 / 3) ** k).toFixed(2)} ×`, 12.3, 3.5, INK, { size: 15, mono: true });
      }}
    />
  );
}

const KOCH6 = koch(6, [0.5, 1], [11.3, 1]);
/** the number of grid cells of side s the curve passes through, sampled along its pieces */
function touched(s: number): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < KOCH6.length - 1; i++) {
    const [x0, y0] = KOCH6[i];
    const [x1, y1] = KOCH6[i + 1];
    for (let j = 0; j < 4; j++) {
      const x = x0 + ((x1 - x0) * j) / 4;
      const y = y0 + ((y1 - y0) * j) / 4;
      cells.add(`${Math.floor((x - 0.5) / s)},${Math.floor((y - 1) / s)}`);
    }
  }
  return cells;
}
const GRIDS = [1, 2, 3, 4, 5].map((k) => {
  const s = 10.8 / 3 ** k;
  return { s, cells: touched(s) };
});

/** boxes counted at finer grids, and the counts against the grid size on logarithms */
export function SeriesBoxes() {
  return (
    <Live
      label={L("The curve covered by grids of smaller and smaller boxes, with the box counts on a logarithmic plot")}
      still={7}
      draw={(pen, t) => {
        const k = Math.floor((t / 1.8) % GRIDS.length);
        const { s, cells } = GRIDS[k];
        for (const key of cells) {
          const [i, j] = key.split(",").map(Number);
          fill(pen, 0.5 + i * s, 1 + j * s, s, s, TWO, 0.35);
          if (k < 3) outline(pen, 0.5 + i * s, 1 + j * s, s, s, TWO, 0.6, 0);
        }
        pen.line(KOCH6, INK, 1);
        say(pen, L("{{n}} boxes", { n: cells.size }), 0.5, 0.25, INK, { size: 12, mono: true });
        // the plot: log of the count against log of one over the box size
        const ox = 12.2;
        const oy = 1;
        pen.line([[ox, oy], [ox, oy + 6]], EDGE, 1);
        pen.line([[ox, oy], [ox + 3.5, oy]], EDGE, 1);
        const pts = GRIDS.slice(0, k + 1).map((g, i) => [ox + (i + 1) * 0.65, oy + Math.log(g.cells.size) * 0.62] as [number, number]);
        pts.forEach(([x, y]) => pen.dot(x, y, 3, ONE));
        if (pts.length > 1) {
          // the slope of the last step: it falls towards the dimension as the boxes shrink
          const slope = Math.log(GRIDS[k].cells.size / GRIDS[k - 1].cells.size) / Math.log(3);
          pen.line(pts, ONE, 1);
          say(pen, L("Slope {{d}}", { d: slope.toFixed(2) }), ox + 0.1, oy + 6.6, ONE, { size: 12, mono: true });
        }
      }}
    />
  );
}

// the fern: four maps and their chances, the numbers Barnsley published
const FERN: [number, number, number, number, number, number, number][] = [
  [0, 0, 0, 0.16, 0, 0, 0.01],
  [0.85, 0.04, -0.04, 0.85, 0, 1.6, 0.85],
  [0.2, -0.26, 0.23, 0.22, 0, 1.6, 0.07],
  [-0.15, 0.28, 0.26, 0.24, 0, 0.44, 0.07],
];
const FERN_POINTS: [number, number][] = (() => {
  let x = 0;
  let y = 0;
  let s = 7;
  const out: [number, number][] = [];
  for (let i = 0; i < 24000; i++) {
    s = (s * 16807) % 2147483647;
    let r = s / 2147483647;
    let m = FERN[0];
    for (const f of FERN) {
      if (r < f[6]) {
        m = f;
        break;
      }
      r -= f[6];
    }
    [x, y] = [m[0] * x + m[1] * y + m[4], m[2] * x + m[3] * y + m[5]];
    if (i > 20) out.push([x, y]);
  }
  return out;
})();

/** the fern, point by point, each point one of four rules chosen at random */
export function SeriesFern() {
  return (
    <Live
      label={L("A fern appearing point by point, each point placed by one of four rules")}
      still={12}
      box={{ x0: -9, x1: 9, y0: -0.3, y1: 10.3 }}
      draw={(pen, t) => {
        const n = Math.min(FERN_POINTS.length, Math.floor(((t % 14) / 10) * FERN_POINTS.length));
        const ctx = pen.ctx;
        ctx.fillStyle = ink(ONE);
        for (let i = 0; i < n; i++) {
          const [x, y] = FERN_POINTS[i];
          ctx.fillRect(pen.px(x * 1.2 - 3.2), pen.py(y), 1.2, 1.2);
        }
        say(pen, L("{{n}} points", { n: n.toLocaleString("en") }), 1.4, 8.6, INK, { size: 12, mono: true });
        say(pen, L("Four rules, chosen at random"), 1.4, 7.6, MUTED, { size: 11 });
        say(pen, L("with chances 85, 7, 7 and 1 per cent"), 1.4, 6.9, MUTED, { size: 11 });
      }}
    />
  );
}

/** the Mandelbrot set, and a point whose path either stays or runs away */
export function SeriesEscape() {
  return (
    <Live
      label={L("The Mandelbrot set, and the path of one point that either stays near or escapes")}
      fps={20}
      still={3}
      draw={(pen, t) => {
        const w = Math.max(40, Math.round(Math.abs(pen.px(9) - pen.px(0)) * 0.5));
        const h = Math.round((w * 8) / 9);
        lay(pen, picture("series-escape", w, h, { cx: -0.6, cy: 0, span: 3 }, { ground: GROUND, mid: FAINT, hot: MUTED, inside: EDGE }, undefined, 50), 0.2, 0.5, 9, 8);
        // the point travels round a loop that crosses the edge of the set
        const a = t * 0.35;
        const c: [number, number] = [-0.45 + 0.42 * Math.cos(a), 0.5 * Math.sin(a)];
        const toX = (x: number) => 0.2 + 4.5 + ((x + 0.6) / 3) * 9;
        const toY = (y: number) => 0.5 + 4 + (y / 3) * 9;
        let z: [number, number] = [0, 0];
        const path: [number, number][] = [[toX(0), toY(0)]];
        let gone = -1;
        for (let n = 0; n < 30; n++) {
          z = [z[0] * z[0] - z[1] * z[1] + c[0], 2 * z[0] * z[1] + c[1]];
          if (z[0] * z[0] + z[1] * z[1] > 4) {
            gone = n + 1;
            break;
          }
          path.push([toX(z[0]), toY(z[1])]);
        }
        pen.line(path, gone < 0 ? SKY : TWO, 1);
        pen.dot(toX(c[0]), toY(c[1]), 4, gone < 0 ? ONE : TWO);
        say(pen, gone < 0 ? L("Stays: c is in the set") : L("Escapes after {{n}} steps", { n: gone }), 9.8, 6.4, gone < 0 ? ONE : TWO, { size: 13 });
        say(pen, "z → z² + c", 9.8, 5.4, MUTED, { size: 12, mono: true });
      }}
    />
  );
}
