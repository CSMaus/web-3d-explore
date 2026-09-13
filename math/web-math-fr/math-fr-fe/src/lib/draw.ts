import type { Box, Pen } from "@/components/Plot";
import type { Net } from "@/systems/net";
import { forward } from "@/systems/net";

/** the colours every page in topic 3 uses for the same things. */
export const INK = "#e8e8ea";
export const MUTED = "#8a919b";
export const EDGE = "#39414c";
export const FAINT = "#23262c";
/** the two colours of dots: green is class one, rose is class zero. */
export const ONE = "#a5e3a0";
export const TWO = "#c75ab0";
export const SKY = "#8fd3e8";

function channel(hex: string, at: number) {
  return parseInt(hex.slice(1 + at * 2, 3 + at * 2), 16);
}

/** a colour part way from a to b. */
export function mix(a: string, b: string, t: number) {
  const k = Math.max(0, Math.min(1, t));
  const c = [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/**
 * a value between zero and one, painted as a colour between the two classes
 * through the dark of the page, so half way is nearly black and either
 * certainty is either colour.
 */
export function classColour(value: number) {
  const v = Math.max(0, Math.min(1, value));
  return v < 0.5 ? mix("#2a1a26", TWO, (0.5 - v) * 2 * 0.75) : mix("#1a2a1c", ONE, (v - 0.5) * 2 * 0.75);
}

/**
 * paint the whole plane with what a function says at every point. the cell
 * count is small on purpose: this runs on every redraw while a network trains.
 */
export function shadePlane(pen: Pen, f: (x: number, y: number) => number, cells = 48) {
  const b = pen.box;
  const cw = pen.width / cells;
  const ch = pen.height / cells;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const x = b.x0 + ((i + 0.5) / cells) * (b.x1 - b.x0);
      const y = b.y1 - ((j + 0.5) / cells) * (b.y1 - b.y0);
      pen.ctx.fillStyle = classColour(f(x, y));
      pen.ctx.fillRect(i * cw, j * ch, cw + 0.5, ch + 0.5);
    }
  }
}

/** a height painted from dark to sky, given its range. */
export function heightColour(h: number, lo: number, hi: number) {
  const t = hi > lo ? (h - lo) / (hi - lo) : 0.5;
  return mix("#0e1116", SKY, 0.1 + 0.9 * t);
}

export function shadeHeight(
  pen: Pen,
  f: (x: number, y: number) => number,
  lo: number,
  hi: number,
  cells = 64,
) {
  const b = pen.box;
  const cw = pen.width / cells;
  const ch = pen.height / cells;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const x = b.x0 + ((i + 0.5) / cells) * (b.x1 - b.x0);
      const y = b.y1 - ((j + 0.5) / cells) * (b.y1 - b.y0);
      pen.ctx.fillStyle = heightColour(f(x, y), lo, hi);
      pen.ctx.fillRect(i * cw, j * ch, cw + 0.5, ch + 0.5);
    }
  }
}

/** contour lines of a height, by marching squares on a coarse grid. */
export function contours(pen: Pen, f: (x: number, y: number) => number, levels: number[], colour: string, cells = 60) {
  const b = pen.box;
  const g: number[][] = [];
  for (let i = 0; i <= cells; i++) {
    g.push([]);
    for (let j = 0; j <= cells; j++) {
      g[i].push(f(b.x0 + (i / cells) * (b.x1 - b.x0), b.y0 + (j / cells) * (b.y1 - b.y0)));
    }
  }
  const X = (i: number) => b.x0 + (i / cells) * (b.x1 - b.x0);
  const Y = (j: number) => b.y0 + (j / cells) * (b.y1 - b.y0);
  for (const level of levels) {
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const pts: [number, number][] = [];
        const edge = (a: number, bb: number, pa: [number, number], pb: [number, number]) => {
          if ((a < level) !== (bb < level)) {
            const t = (level - a) / (bb - a);
            pts.push([pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]);
          }
        };
        edge(g[i][j], g[i + 1][j], [X(i), Y(j)], [X(i + 1), Y(j)]);
        edge(g[i + 1][j], g[i + 1][j + 1], [X(i + 1), Y(j)], [X(i + 1), Y(j + 1)]);
        edge(g[i + 1][j + 1], g[i][j + 1], [X(i + 1), Y(j + 1)], [X(i), Y(j + 1)]);
        edge(g[i][j + 1], g[i][j], [X(i), Y(j + 1)], [X(i), Y(j)]);
        if (pts.length >= 2) pen.line([pts[0], pts[1]], colour, 1);
        if (pts.length === 4) pen.line([pts[2], pts[3]], colour, 1);
      }
    }
  }
}

/** a short label on a dark plate, so it reads over any surface. */
export function plate(pen: Pen, s: string, x: number, y: number, colour: string, align: CanvasTextAlign = "left") {
  const ctx = pen.ctx;
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  const w = ctx.measureText(s).width;
  const px = pen.px(x);
  const py = pen.py(y);
  const left = align === "left" ? px - 3 : align === "right" ? px - w - 3 : px - w / 2 - 3;
  ctx.fillStyle = "rgba(14,17,22,0.82)";
  ctx.fillRect(left, py - 11, w + 6, 15);
  pen.text(s, x, y, colour, align);
}

// ---------------------------------------------------------------- a network drawn

export type Laid = {
  /** the pixel position of every unit, by layer then index */
  at: [number, number][][];
};

/** where each unit sits: layers left to right, units spread top to bottom. */
export function layout(sizes: number[], width: number, height: number, pad = 40): Laid {
  const at: [number, number][][] = [];
  const L = sizes.length;
  for (let l = 0; l < L; l++) {
    const x = L === 1 ? width / 2 : pad + ((width - 2 * pad) * l) / (L - 1);
    const n = sizes[l];
    at.push([]);
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? height / 2 : pad + ((height - 2 * pad) * i) / (n - 1);
      at[l].push([x, y]);
    }
  }
  return { at };
}

export type NetStyle = {
  /** values to write inside units, by layer then index; omitted units are blank */
  values?: number[][];
  /** a per-unit tint between zero and one, painted like a class value */
  tint?: number[][];
  /** how far into the layers the drawing has got; layers beyond are dim */
  upTo?: number;
  labels?: string[];
  /** a change to show on each weight, same shape as W, drawn as a coloured halo */
  change?: number[][][];
  radius?: number;
};

/**
 * the network as circles and lines, in pixels: thickness is the weight's size
 * and colour its sign, green for a push up and rose for a push down. every
 * page that has a network in it draws it through this, so a reader learns to
 * read the picture once.
 */
export function drawNet(ctx: CanvasRenderingContext2D, net: Net, laid: Laid, style: NetStyle = {}) {
  const r = style.radius ?? 14;
  const upTo = style.upTo ?? net.W.length + 1;
  let largest = 1e-9;
  for (const m of net.W) for (const row of m) for (const w of row) largest = Math.max(largest, Math.abs(w));

  for (let l = 0; l < net.W.length; l++) {
    const dim = l + 1 > upTo;
    for (let i = 0; i < net.W[l].length; i++) {
      for (let j = 0; j < net.W[l][i].length; j++) {
        const w = net.W[l][i][j];
        const [x0, y0] = laid.at[l][j];
        const [x1, y1] = laid.at[l + 1][i];
        const weight = 0.4 + (3.2 * Math.abs(w)) / largest;
        const change = style.change?.[l]?.[i]?.[j];
        if (change !== undefined && Math.abs(change) > 1e-9) {
          ctx.strokeStyle = change > 0 ? "rgba(165,227,160,0.35)" : "rgba(199,90,176,0.35)";
          ctx.lineWidth = weight + 6;
          ctx.beginPath();
          ctx.moveTo(x0 + r, y0);
          ctx.lineTo(x1 - r, y1);
          ctx.stroke();
        }
        ctx.strokeStyle = dim ? FAINT : w >= 0 ? ONE : TWO;
        ctx.globalAlpha = dim ? 1 : 0.55 + 0.45 * (Math.abs(w) / largest);
        ctx.lineWidth = weight;
        ctx.beginPath();
        ctx.moveTo(x0 + r, y0);
        ctx.lineTo(x1 - r, y1);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let l = 0; l < laid.at.length; l++) {
    const lit = l <= upTo;
    for (let i = 0; i < laid.at[l].length; i++) {
      const [x, y] = laid.at[l][i];
      const tint = style.tint?.[l]?.[i];
      ctx.fillStyle = lit && tint !== undefined ? classColour(tint) : "#0e1116";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = lit ? (l === 0 ? SKY : INK) : EDGE;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      const v = style.values?.[l]?.[i];
      if (lit && v !== undefined) {
        ctx.fillStyle = INK;
        ctx.fillText(Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2), x, y);
      }
    }
    if (style.labels?.[l]) {
      ctx.fillStyle = MUTED;
      ctx.fillText(style.labels[l], laid.at[l][0][0], 14);
    }
  }
  ctx.textBaseline = "alphabetic";
}

/** a shortcut: the values of every unit for one input, for drawNet. */
export function unitValues(net: Net, x: number[]): number[][] {
  return forward(net, x).a;
}

/** a grid of numbers as coloured cells, dark for small and bright for large. */
export function heatGrid(
  ctx: CanvasRenderingContext2D,
  g: number[][],
  x: number,
  y: number,
  cell: number,
  lo: number,
  hi: number,
  colour = SKY,
  labels = false,
) {
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < g[r].length; c++) {
      const v = g[r][c];
      const t = hi > lo ? (v - lo) / (hi - lo) : 0;
      // an empty cell is still a cell: a shade above the page, so the grid reads as a grid
      ctx.fillStyle = v < 0 ? mix("#1b1f25", TWO, Math.min(1, -v / Math.max(1e-9, Math.abs(lo)))) : mix("#1b1f25", colour, Math.max(0, Math.min(1, t)));
      ctx.fillRect(x + c * cell, y + r * cell, cell - 1, cell - 1);
      if (labels && cell >= 22) {
        ctx.fillStyle = t > 0.6 ? "#0e1116" : INK;
        ctx.fillText(Number.isInteger(v) ? String(v) : v.toFixed(1), x + c * cell + cell / 2, y + r * cell + cell / 2);
      }
    }
  }
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

export function boxOf(X: number[][], pad = 0.6): Box {
  const xs = X.map((p) => p[0]);
  const ys = X.map((p) => p[1]);
  return { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad };
}

/** a round step for tick marks: 1, 2 or 5 times a power of ten, about `want` of them across a range. */
export function niceStep(range: number, want = 5) {
  const raw = range / Math.max(1, want);
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-12))));
  const m = raw / pow;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * pow;
}

/**
 * numbered axes: faint grid lines at round values, with the value written at
 * each, along the bottom and the left of the plot. the axis names go in the
 * caption under the picture, never inside it.
 */
export function ticks(pen: Pen, opts: { x?: number; y?: number; xFormat?: (v: number) => string; yFormat?: (v: number) => string } = {}) {
  const b = pen.box;
  const xs = opts.x ?? niceStep(b.x1 - b.x0);
  const ys = opts.y ?? niceStep(b.y1 - b.y0);
  const fx = opts.xFormat ?? ((v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2)));
  const fy = opts.yFormat ?? ((v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2)));
  const ctx = pen.ctx;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  for (let x = Math.ceil(b.x0 / xs) * xs; x <= b.x1 + 1e-9; x += xs) {
    const v = Math.abs(x) < 1e-12 ? 0 : x;
    pen.line([[v, b.y0], [v, b.y1]], "#1b1f25", 1);
    ctx.fillStyle = "#5b616b";
    ctx.textAlign = "center";
    ctx.fillText(fx(v), pen.px(v), pen.height - 4);
  }
  for (let y = Math.ceil(b.y0 / ys) * ys; y <= b.y1 + 1e-9; y += ys) {
    const v = Math.abs(y) < 1e-12 ? 0 : y;
    pen.line([[b.x0, v], [b.x1, v]], "#1b1f25", 1);
    // the bottom value would sit on the x labels, so it is left to them
    if (pen.py(v) > pen.height - 14) continue;
    ctx.fillStyle = "#5b616b";
    ctx.textAlign = "left";
    ctx.fillText(fy(v), 4, pen.py(v) - 3);
  }
  ctx.textAlign = "left";
}
