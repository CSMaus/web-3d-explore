export type Map2 = { a: number; b: number; c: number; d: number; e: number; f: number; p: number };

export const IFS_PRESETS: Record<string, Map2[]> = {
  "Barnsley fern": [
    { a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0, p: 0.01 },
    { a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 1.6, p: 0.85 },
    { a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 1.6, p: 0.07 },
    { a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.44, p: 0.07 },
  ],
  "Barnsley tree": [
    { a: 0, b: 0, c: 0, d: 0.5, e: 0, f: 0, p: 0.05 },
    { a: 0.1, b: 0, c: 0, d: 0.1, e: 0, f: 0.2, p: 0.15 },
    { a: 0.42, b: -0.42, c: 0.42, d: 0.42, e: 0, f: 0.2, p: 0.4 },
    { a: 0.42, b: 0.42, c: -0.42, d: 0.42, e: 0, f: 0.2, p: 0.4 },
  ],
  "Sierpinski triangle": [
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0, f: 0, p: 1 / 3 },
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.5, f: 0, p: 1 / 3 },
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.25, f: 0.433, p: 1 / 3 },
  ],
  "Heighway dragon": [
    { a: 0.5, b: -0.5, c: 0.5, d: 0.5, e: 0, f: 0, p: 0.5 },
    { a: -0.5, b: -0.5, c: 0.5, d: -0.5, e: 1, f: 0, p: 0.5 },
  ],
  "Levy C curve": [
    { a: 0.5, b: 0.5, c: -0.5, d: 0.5, e: 0, f: 0, p: 0.5 },
    { a: 0.5, b: -0.5, c: 0.5, d: 0.5, e: 0.5, f: -0.5, p: 0.5 },
  ],
};

export const KEYS = ["a", "b", "c", "d", "e", "f"] as const;
export const LIMITS: Record<string, number> = { a: 1.5, b: 1.5, c: 1.5, d: 1.5, e: 6, f: 12 };

export function contraction(m: Map2) {
  const t = m.a * m.a + m.b * m.b + m.c * m.c + m.d * m.d;
  const det = m.a * m.d - m.b * m.c;
  const root = Math.sqrt(Math.max(t * t - 4 * det * det, 0));
  return Math.sqrt(Math.max((t + root) / 2, 0));
}

export type Run = {
  xs: Float64Array;
  ys: Float64Array;
  who: Uint8Array;
  tag: Uint8Array;
  kept: number;
  escaped: boolean;
};

export function carrierOf(maps: Map2[]) {
  let best = 0;
  for (let i = 1; i < maps.length; i++) {
    if (contraction(maps[i]) > contraction(maps[best])) best = i;
  }
  return best;
}

export type RunOpts = { points: number; startx: number; starty: number; drop: number };

export function runGame(maps: Map2[], opt: RunOpts): Run {
  const total = opt.points;
  const weights = maps.map((m) => Math.max(m.p, 0));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const cuts: number[] = [];
  let acc = 0;
  for (const w of weights) {
    acc += w / sum;
    cuts.push(acc);
  }
  const carrier = carrierOf(maps);
  let x = opt.startx;
  let y = opt.starty;
  const xs = new Float64Array(total);
  const ys = new Float64Array(total);
  const who = new Uint8Array(total);
  const tag = new Uint8Array(total);
  let mark = carrier;
  let kept = 0;
  let escaped = false;
  for (let i = 0; i < total + opt.drop; i++) {
    const r = Math.random();
    let k = 0;
    while (k < cuts.length - 1 && r > cuts[k]) k++;
    const m = maps[k];
    const nx = m.a * x + m.b * y + m.e;
    const ny = m.c * x + m.d * y + m.f;
    x = nx;
    y = ny;
    if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6) {
      escaped = true;
      break;
    }
    if (k !== carrier) mark = k;
    if (i >= opt.drop) {
      xs[kept] = x;
      ys[kept] = y;
      who[kept] = k;
      tag[kept] = mark;
      kept++;
    }
  }
  return { xs, ys, who, tag, kept, escaped };
}

export type DimOpts = { least?: number; cuts?: number[] };

export function boxDim(xs: Float64Array, ys: Float64Array, kept: number, opt: DimOpts = {}) {
  const least = opt.least ?? 500;
  const cuts = opt.cuts ?? [8, 16, 32, 64, 128];
  if (kept < least) return null;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < kept; i++) {
    if (xs[i] < x0) x0 = xs[i];
    if (xs[i] > x1) x1 = xs[i];
    if (ys[i] < y0) y0 = ys[i];
    if (ys[i] > y1) y1 = ys[i];
  }
  const span = Math.max(x1 - x0, y1 - y0);
  if (!(span > 0)) return null;
  const pairs: [number, number][] = [];
  for (const n of cuts) {
    const s = span / n;
    const seen = new Set<string>();
    for (let i = 0; i < kept; i++) {
      seen.add(`${Math.floor((xs[i] - x0) / s)},${Math.floor((ys[i] - y0) / s)}`);
    }
    pairs.push([Math.log(s), Math.log(seen.size)]);
  }
  const n = pairs.length;
  const mx = pairs.reduce((a, p) => a + p[0], 0) / n;
  const my = pairs.reduce((a, p) => a + p[1], 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pairs) {
    num += (p[0] - mx) * (p[1] - my);
    den += (p[0] - mx) ** 2;
  }
  return den === 0 ? null : -num / den;
}
