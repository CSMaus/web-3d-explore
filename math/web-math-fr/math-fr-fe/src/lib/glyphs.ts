import { arc, arrow, axes, box, circle, fit, loop, plot, poly, seg, type Pt } from "@kit/index";

/**
 * the small figure of every interactive page: one exact drawing of what the page
 * shows, in a 100 by 100 box, by the page's address, and the one unbroken line of it
 * the light walks along. drawn by `LineFigure`. a drawing given as a string walks its
 * longest run of pieces joined end to end; one made of loose pieces (dots, bars, cells,
 * strokes) names its own walk along its drawn lines. a page with no entry shows no figure.
 */

type Glyph = string | { d: string; walk: string };

const TAU = Math.PI * 2;

/** a curve through points given in maths coordinates, fitted into the box */
const fitted = (points: Pt[], margin = 8) => poly(fit(points, margin));

/** a small network of units in columns, every unit joined to every unit of the next column */
function network(columns: number[], r = 3.2): { d: string; walk: string } {
  const xs = columns.map((_, i) => 14 + (72 * i) / (columns.length - 1));
  const at = columns.map((n, i) => Array.from({ length: n }, (_, k) => [xs[i], 50 + (k - (n - 1) / 2) * (64 / Math.max(...columns))] as Pt));
  let d = "";
  for (let i = 0; i + 1 < at.length; i += 1) for (const a of at[i]) for (const b of at[i + 1]) d += seg([a[0] + r, a[1]], [b[0] - r, b[1]]);
  for (const col of at) for (const p of col) d += circle(p[0], p[1], r, 16);
  const route = at.map((col, i) => col[i % 2 === 0 ? 0 : col.length - 1]);
  return { d, walk: poly(route) };
}

/** a row of token boxes along the bottom, with arcs between some of them */
function tokens(n: number, links: [number, number][], y = 70): { d: string; walk: string } {
  const w = 76 / n;
  let d = "";
  for (let i = 0; i < n; i += 1) d += box(12 + i * w + 1, y, w - 2, 9);
  const route: Pt[] = [];
  for (const [a, b] of links) {
    const x0 = 12 + a * w + w / 2;
    const x1 = 12 + b * w + w / 2;
    d += arc((x0 + x1) / 2, y, Math.abs(x1 - x0) / 2, 0, Math.PI, 24);
    for (let k = 0; k <= 24; k += 1) {
      const t = Math.PI - (Math.PI * k) / 24;
      route.push([(x0 + x1) / 2 + (Math.abs(x1 - x0) / 2) * Math.cos(t), y - (Math.abs(x1 - x0) / 2) * Math.sin(t)]);
    }
  }
  if (!route.length) for (let i = 0; i < n; i += 1) route.push([12 + i * w + 1, y], [12 + (i + 1) * w - 1, y]);
  return { d, walk: poly(route) };
}

/** the Lorenz attractor, integrated, seen from the side (x against z) */
function lorenz(): string {
  let [x, y, z] = [1, 1, 1];
  const pts: Pt[] = [];
  for (let i = 0; i < 5000; i += 1) {
    const dt = 0.006;
    [x, y, z] = [x + 10 * (y - x) * dt, y + (x * (28 - z) - y) * dt, z + (x * y - (8 / 3) * z) * dt];
    if (i > 300 && i % 3 === 0) pts.push([x, z]);
  }
  return fitted(pts);
}

/** the Rossler attractor, integrated, seen from above (x against y) */
function rossler(): string {
  let [x, y, z] = [1, 1, 0];
  const pts: Pt[] = [];
  for (let i = 0; i < 9000; i += 1) {
    const dt = 0.01;
    [x, y, z] = [x + (-y - z) * dt, y + (x + 0.2 * y) * dt, z + (0.2 + z * (x - 5.7)) * dt];
    if (i > 1500 && i % 4 === 0) pts.push([x, y]);
  }
  return fitted(pts);
}

/** the logistic map's parabola, the diagonal, and a cobweb of an orbit between them */
function cobweb(): string {
  const r = 3.7;
  const P = (x: number, y: number): Pt => [12 + x * 76, 88 - y * 76];
  let d = poly(Array.from({ length: 41 }, (_, i) => P(i / 40, r * (i / 40) * (1 - i / 40))));
  d += seg(P(0, 0), P(1, 1));
  let x = 0.12;
  const web: Pt[] = [P(x, 0)];
  for (let i = 0; i < 9; i += 1) {
    const y = r * x * (1 - x);
    web.push(P(x, y), P(y, y));
    x = y;
  }
  return d + poly(web);
}

/** the bifurcation diagram of the logistic map: the values the orbit settles on, for each rate */
function bifurcation(): { d: string; walk: string } {
  let d = "";
  const top: Pt[] = [];
  for (let k = 0; k <= 70; k += 1) {
    const r = 2.8 + (1.2 * k) / 70;
    let x = 0.5;
    for (let i = 0; i < 200; i += 1) x = r * x * (1 - x);
    const seen = new Set<number>();
    for (let i = 0; i < 24; i += 1) {
      x = r * x * (1 - x);
      seen.add(Math.round(x * 60));
    }
    const px = 10 + (80 * k) / 70;
    for (const v of seen) d += seg([px, 90 - (v / 60) * 80], [px + 0.6, 90 - (v / 60) * 80]);
    top.push([px, 90 - (Math.max(...seen) / 60) * 80]);
  }
  return { d, walk: poly(top) };
}

/** a slope field: short strokes along dy/dx = x - y on a grid, and one solution through it */
function field(): { d: string; walk: string } {
  let d = "";
  for (let i = 0; i < 7; i += 1)
    for (let j = 0; j < 7; j += 1) {
      const x = -1.5 + i * 0.5;
      const y = -1.5 + j * 0.5;
      const a = Math.atan(x - y);
      const cx = 14 + i * 12;
      const cy = 86 - j * 12;
      d += seg([cx - 4 * Math.cos(a), cy + 4 * Math.sin(a)], [cx + 4 * Math.cos(a), cy - 4 * Math.sin(a)]);
    }
  const solution: Pt[] = [];
  let y = 1.6;
  for (let x = -1.7; x <= 1.7; x += 0.05) {
    solution.push([14 + ((x + 1.5) / 0.5) * 12, 86 - ((y + 1.5) / 0.5) * 12]);
    y += (x - y) * 0.05;
  }
  return { d: d + poly(solution), walk: poly(solution) };
}

/** a curve and the steps that follow it from its rate alone, falling a little behind */
function stepping(): string {
  const fn = (x: number) => Math.exp(x / 1.6);
  let d = plot(fn, 0, 3, 0, 7);
  const pts: Pt[] = [];
  let x = 0;
  let y = 1;
  for (let i = 0; i <= 6; i += 1) {
    pts.push([10 + (x / 3) * 80, 90 - (y / 7) * 80]);
    y += (fn(x) / 1.6) * 0.5;
    x += 0.5;
  }
  d += poly(pts);
  for (const p of pts) d += circle(p[0], p[1], 1.4, 10);
  return d;
}

/** a spiral in the phase plane winding into its fixed point, with the axes */
function phase(): string {
  const pts: Pt[] = Array.from({ length: 300 }, (_, i) => {
    const t = (i / 300) * TAU * 3.2;
    const r = 34 * Math.exp(-0.17 * t);
    return [52 + r * Math.cos(t), 48 - r * Math.sin(t)];
  });
  return seg([10, 48], [92, 48]) + seg([52, 90], [52, 8]) + poly(pts);
}

/** the main cardioid of the Mandelbrot set with its biggest bulbs */
function mandelbrot(): string {
  const S = 34;
  const cx = 60;
  const cy = 50;
  const card: Pt[] = Array.from({ length: 121 }, (_, i) => {
    const t = (i / 120) * TAU;
    const re = 0.5 * Math.cos(t) - 0.25 * Math.cos(2 * t);
    const im = 0.5 * Math.sin(t) - 0.25 * Math.sin(2 * t);
    return [cx + re * S, cy - im * S];
  });
  return poly(card) + circle(cx - S, cy, S * 0.25, 32) + circle(cx - 1.31 * S, cy, S * 0.06, 12) + circle(cx - 0.12 * S, cy - 0.74 * S, S * 0.09, 14) + circle(cx - 0.12 * S, cy + 0.74 * S, S * 0.09, 14);
}

/** a Julia set drawn by inverse iteration: the points every orbit is pushed towards, each root taken by a fixed sequence */
function julia(re: number, im: number): { d: string; walk: string } {
  const dots: Pt[] = [];
  let [x, y] = [0.5, 0.2];
  let seed = 11;
  let d = "";
  const S = 30;
  for (let i = 0; i < 6000; i += 1) {
    seed = (seed * 16807) % 2147483647;
    const ar = x - re;
    const ai = y - im;
    const m = Math.sqrt(Math.hypot(ar, ai));
    const a = Math.atan2(ai, ar) / 2 + (seed % 2 ? Math.PI : 0);
    [x, y] = [m * Math.cos(a), m * Math.sin(a)];
    if (i > 60 && i % 2 === 0) {
      d += seg([50 + x * S - 0.6, 50 - y * S], [50 + x * S + 0.6, 50 - y * S]);
      if (i % 12 === 0) dots.push([50 + x * S, 50 - y * S]);
    }
  }
  dots.sort((p, q) => Math.atan2(p[1] - 50, p[0] - 50) - Math.atan2(q[1] - 50, q[0] - 50));
  return { d, walk: loop(dots) };
}

/** a ball of bulbs: the Mandelbulb seen as a sphere with eight lobes and its equator */
function bulb(): string {
  const outline: Pt[] = Array.from({ length: 160 }, (_, i) => {
    const t = (i / 160) * TAU;
    const r = 34 + 4 * Math.cos(8 * t);
    return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
  });
  const equator: Pt[] = Array.from({ length: 80 }, (_, i) => {
    const t = (i / 80) * TAU;
    const r = 32 + 3 * Math.cos(8 * t);
    return [50 + r * Math.cos(t), 50 + 0.32 * r * Math.sin(t)];
  });
  return loop(outline) + loop(equator) + seg([50, 14], [50, 86]);
}

/** a fern from four affine maps, as its main stem and two orders of fronds */
function fern(): string {
  let d = "";
  const frond = (x: number, y: number, len: number, ang: number, depth: number) => {
    const steps = 9;
    let px = x;
    let py = y;
    let a = ang;
    for (let i = 0; i < steps; i += 1) {
      const nx = px + Math.cos(a) * (len / steps);
      const ny = py - Math.sin(a) * (len / steps);
      d += seg([px, py], [nx, ny]);
      if (depth > 0 && i > 0 && i < steps - 1) {
        const side = len * 0.42 * (1 - i / steps);
        frond(nx, ny, side, a + 1.05, depth - 1);
        frond(nx, ny, side, a - 1.05, depth - 1);
      }
      px = nx;
      py = ny;
      a -= 0.035;
    }
  };
  frond(46, 94, 88, Math.PI / 2 + 0.12, 2);
  return d;
}

/** the Koch curve, the rule applied four times */
function koch(): string {
  let pts: Pt[] = [[8, 66], [92, 66]];
  for (let k = 0; k < 4; k += 1) {
    const next: Pt[] = [];
    for (let i = 0; i + 1 < pts.length; i += 1) {
      const [a, b] = [pts[i], pts[i + 1]];
      const dx = (b[0] - a[0]) / 3;
      const dy = (b[1] - a[1]) / 3;
      const p1: Pt = [a[0] + dx, a[1] + dy];
      const p3: Pt = [a[0] + 2 * dx, a[1] + 2 * dy];
      const p2: Pt = [p1[0] + dx * 0.5 + dy * 0.866, p1[1] + dy * 0.5 - dx * 0.866];
      next.push(a, p1, p2, p3);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return poly(pts);
}

/** branches that split and wander, the same every time: a discharge from the top, or a cluster from the centre */
function branches(fromCentre: boolean): string {
  let s = 7;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let d = "";
  const grow = (x: number, y: number, a: number, len: number, depth: number) => {
    if (depth === 0 || len < 2) return;
    let px = x;
    let py = y;
    let ang = a;
    const n = 4;
    for (let i = 0; i < n; i += 1) {
      ang += (r() - 0.5) * 0.9;
      const nx = px + Math.cos(ang) * (len / n);
      const ny = py + Math.sin(ang) * (len / n);
      d += seg([px, py], [nx, ny]);
      px = nx;
      py = ny;
      if (r() < 0.45) grow(px, py, ang + (r() < 0.5 ? 0.7 : -0.7), len * 0.55, depth - 1);
    }
    grow(px, py, ang, len * 0.7, depth - 1);
  };
  if (fromCentre) for (let k = 0; k < 6; k += 1) grow(50, 50, (k / 6) * TAU, 16, 4);
  else grow(50, 6, Math.PI / 2, 26, 5);
  return d;
}

/** a number line with ticks, and a half turn from 1 to -1 above it */
function numberLine(): string {
  let d = arrow([6, 62], [94, 62], 3);
  for (let i = -3; i <= 3; i += 1) d += seg([50 + i * 13, 58], [50 + i * 13, 66]);
  return d + arc(50, 62, 13, 0, Math.PI, 24) + circle(37, 62, 1.8, 10);
}

/** the plane with the unit circle, and a quarter turn from 1 to i */
function quarterTurn(): string {
  return seg([8, 54], [92, 54]) + seg([50, 92], [50, 12]) + circle(50, 54, 26, 48) + arrow([50, 54], [76, 54], 4) + arrow([50, 54], [50, 28], 4) + arc(50, 54, 12, 0, Math.PI / 2, 12);
}

/** two arrows put end to end, and their sum */
function adding(): string {
  return axes() + arrow([14, 86], [44, 56], 4) + arrow([44, 56], [82, 44], 4) + arrow([14, 86], [82, 44], 4);
}

/** two arrows from the origin and their product: the angles add and the lengths multiply */
function multiplying(): string {
  const o: Pt = [16, 84];
  const at = (len: number, ang: number): Pt => [o[0] + len * Math.cos(ang), o[1] - len * Math.sin(ang)];
  return axes(16, 84) + arrow(o, at(34, 0.35), 4) + arrow(o, at(40, 0.75), 4) + arrow(o, at(66, 1.1), 4) + arc(o[0], o[1], 14, 0, 0.35, 8) + arc(o[0], o[1], 20, 0, 1.1, 16);
}

/** the unit circle, a radius at an angle, and its cosine and sine */
function euler(): string {
  const a = 0.85;
  const p: Pt = [50 + 32 * Math.cos(a), 52 - 32 * Math.sin(a)];
  return seg([10, 52], [90, 52]) + seg([50, 90], [50, 14]) + circle(50, 52, 32, 56) + arrow([50, 52], p, 4) + seg(p, [p[0], 52]) + arc(50, 52, 9, 0, a, 10);
}

/** three axes at right angles in perspective, and a turn about one of them */
function quaternion(): string {
  return arrow([50, 56], [50, 12], 4) + arrow([50, 56], [88, 70], 4) + arrow([50, 56], [14, 74], 4) + poly(Array.from({ length: 40 }, (_, i) => {
    const t = (i / 39) * TAU * 0.85;
    return [50 + 20 * Math.cos(t), 30 + 6 * Math.sin(t)] as Pt;
  }));
}

/** a curve and the tangent that gives its rate at one point */
function tangent(fn: (x: number) => number, dfn: (x: number) => number, at: number, x0: number, x1: number, y0: number, y1: number): string {
  const m = dfn(at);
  return axes() + plot(fn, x0, x1, y0, y1, [14, 10, 76, 76]) + plot((x) => fn(at) + m * (x - at), at - (x1 - x0) * 0.22, at + (x1 - x0) * 0.22, y0, y1, [14 + ((at - (x1 - x0) * 0.22 - x0) / (x1 - x0)) * 76, 10, ((x1 - x0) * 0.44 / (x1 - x0)) * 76, 76], 2);
}

/** the area under a curve gathered as thin bars */
function bars(): string {
  const fn = (x: number) => 1 + Math.sin(x) * 0.6 + x * 0.25;
  let d = axes() + plot(fn, 0, 6, 0, 3.4, [14, 10, 76, 76]);
  for (let i = 0; i < 10; i += 1) {
    const x = 0.3 + i * 0.6;
    const h = (fn(x) / 3.4) * 76;
    d += box(14 + (i / 10) * 76 + 0.6, 86 - h, 76 / 10 - 1.2, h);
  }
  return d;
}

/** a quantity that doubles in equal steps */
function growth(): string {
  let d = axes() + plot((x) => 2 ** x, 0, 5, 0, 32, [14, 10, 76, 76]);
  for (let k = 1; k <= 5; k += 1) {
    const x = 14 + (k / 5) * 76;
    const y = 86 - ((2 ** k) / 32) * 76;
    d += seg([x, 86], [x, y]);
  }
  return d;
}

/** a hill and a ball rolling down it by its slope */
function hill(): string {
  const fn = (x: number) => 0.3 + 0.6 * Math.exp(-((x - 0.45) ** 2) / 0.06) + 0.15 * x;
  const P = (x: number): Pt => [10 + x * 80, 88 - fn(x) * 70];
  return plot(fn, 0, 1, 0, 1.14, [10, 8, 80, 80]) + circle(P(0.64)[0] + 2, P(0.64)[1] - 4, 3.4, 16) + arrow([P(0.68)[0] + 4, P(0.68)[1] - 2], [P(0.84)[0] + 2, P(0.84)[1] - 3], 4);
}

/** points scattered about a line, and the line drawn through them */
function fitLine(): string {
  const pts: Pt[] = [[20, 72], [28, 70], [34, 60], [44, 58], [52, 50], [58, 47], [66, 40], [74, 36], [82, 26]];
  return axes() + seg([16, 78], [88, 24]) + pts.map((p) => circle(p[0], p[1], 1.8, 10)).join("");
}

/** a curve, a small step along it, and the small change it makes */
function nudge(): string {
  const fn = (x: number) => 0.2 + x * x;
  const P = (x: number): Pt => [14 + x * 76, 86 - (fn(x) / 1.2) * 76];
  const a = P(0.55);
  const b = P(0.72);
  return axes() + plot(fn, 0, 1, 0, 1.2, [14, 10, 76, 76]) + seg(a, [b[0], a[1]]) + seg([b[0], a[1]], b) + circle(a[0], a[1], 1.6, 10) + circle(b[0], b[1], 1.6, 10);
}

/** one unit: inputs weighted into a sum, through an S-shaped curve, out */
function unit(): string {
  let d = "";
  for (const y of [24, 42, 60, 78]) d += arrow([8, y], [38, 50], 3);
  d += circle(50, 50, 12, 32);
  d += plot((x) => 1 / (1 + Math.exp(-x)), -5, 5, 0, 1, [42, 44, 16, 12], 24);
  return d + arrow([62, 50], [92, 50], 4);
}

/** a target curve built from a few steps added together */
function anyCurve(): string {
  const s = (x: number, c: number, k = 14) => 1 / (1 + Math.exp(-k * (x - c)));
  const fn = (x: number) => 0.2 + 0.5 * s(x, 0.2) - 0.35 * s(x, 0.5) + 0.45 * s(x, 0.75);
  let d = axes() + plot(fn, 0, 1, 0, 1, [14, 10, 76, 76]);
  for (const [c, h] of [[0.2, 0.5], [0.5, -0.35], [0.75, 0.45]] as const) d += plot((x) => 0.05 + Math.abs(h) * 0.5 * s(x, c), 0, 1, 0, 1, [14, 10, 76, 76], 40);
  return d;
}

/** the error falling, step after step, as the network learns */
function lossCurve(plateau: boolean): string {
  const fn = plateau ? (x: number) => 0.85 - 0.7 / (1 + Math.exp(-14 * (x - 0.62))) + 0.02 * Math.sin(40 * x) : (x: number) => 0.12 + 0.75 * Math.exp(-4.5 * x) + 0.025 * Math.sin(37 * x);
  return axes() + plot(fn, 0, 1, 0, 1, [14, 10, 76, 76], 120);
}

/** the correction running back through the network, layer by layer */
function blame(): Glyph {
  const n = network([3, 3, 2]);
  return { d: n.d + arrow([86, 20], [52, 12], 4) + arrow([52, 12], [16, 20], 4), walk: poly([[86, 20], [52, 12], [16, 20]]) };
}

/** the correction growing fainter layer by layer, as bars from the last layer to the first */
function fadeBars(): Glyph {
  let d = axes();
  const tops: Pt[] = [];
  [70, 44, 26, 14, 7].forEach((h, i) => {
    d += box(76 - i * 14, 86 - h, 10, h);
    tops.push([86, 86 - h], [76 - i * 14, 86 - h]);
  });
  return { d, walk: poly(tops) };
}

/** a picture as a grid of cells with a small window sliding over it */
function pictures(): Glyph {
  let d = "";
  const route: Pt[] = [];
  for (let i = 0; i <= 6; i += 1) {
    d += seg([14 + i * 12, 14], [14 + i * 12, 86]) + seg([14, 14 + i * 12], [86, 14 + i * 12]);
    route.push(i % 2 === 0 ? [14, 14 + i * 12] : [86, 14 + i * 12], i % 2 === 0 ? [86, 14 + i * 12] : [14, 14 + i * 12]);
  }
  return { d: d + box(36, 36, 24) + box(37.5, 37.5, 21), walk: poly(route) };
}

/** a sequence read one step at a time, each step passing its state to the next */
function sequence(): Glyph {
  let d = "";
  for (let i = 0; i < 4; i += 1) {
    const x = 10 + i * 22;
    d += box(x, 40, 14, 14) + arrow([x + 7, 80], [x + 7, 56], 3) + arrow([x + 7, 38], [x + 7, 16], 3);
    if (i < 3) d += arrow([x + 15, 47], [x + 21, 47], 3);
  }
  return { d, walk: poly([[10, 47], [90, 47]]) };
}

/** words as rows of bars of differing length, read into a vector */
function words(): Glyph {
  let d = "";
  const route: Pt[] = [];
  [[10, 18, 12, 22], [16, 10, 24], [20, 14, 8, 12]].forEach((row, j) => {
    let x = 10;
    for (const w of row) {
      d += seg([x, 26 + j * 16], [x + w, 26 + j * 16]);
      x += w + 4;
    }
    route.push(j % 2 === 0 ? [10, 26 + j * 16] : [x - 4, 26 + j * 16], j % 2 === 0 ? [x - 4, 26 + j * 16] : [10, 26 + j * 16]);
  });
  route.push([70, 42], [84, 42]);
  return { d: d + arrow([70, 42], [82, 42], 3) + box(84, 18, 8, 50), walk: poly(route) };
}

/** the same text cut three ways: letters, bytes and words */
function threeWays(): Glyph {
  let d = "";
  for (let i = 0; i < 12; i += 1) d += box(8 + i * 7, 18, 6, 10);
  for (let i = 0; i < 6; i += 1) d += box(8 + i * 14, 44, 13, 10);
  for (const [x, w] of [[8, 30], [39, 22], [62, 30]]) d += box(x, 70, w, 10);
  return { d, walk: poly([[8, 18], [92, 18], [92, 44], [8, 44], [8, 70], [92, 70]]) };
}

/** two frequent pieces joined into one new piece of the vocabulary */
function mergeTokens(): Glyph {
  return {
    d: box(14, 22, 20, 14) + box(40, 22, 20, 14) + arrow([24, 38], [40, 60], 4) + arrow([50, 38], [46, 60], 4) + box(26, 62, 46, 16) + box(68, 22, 18, 14),
    walk: poly([[14, 22], [34, 22], [34, 36], [24, 38], [40, 60], [26, 62], [72, 62], [72, 78], [26, 78]]),
  };
}

/** a line of text with the cuts between its pieces */
function cutting(): string {
  let d = seg([8, 50], [92, 50]);
  for (const x of [8, 22, 31, 49, 60, 78, 92]) d += seg([x, 38], [x, 62]);
  return d;
}

/** what the cutting costs, rising with the length of the text */
function costBars(): Glyph {
  let d = axes();
  const tops: Pt[] = [];
  [14, 22, 34, 46, 62].forEach((h, i) => {
    d += box(20 + i * 14, 86 - h, 10, h);
    tops.push([20 + i * 14, 86 - h], [30 + i * 14, 86 - h]);
  });
  return { d, walk: poly(tops) };
}

/** the table: one row of numbers for each piece of the vocabulary */
function table(): Glyph {
  let d = "";
  const route: Pt[] = [];
  for (let i = 0; i <= 6; i += 1) {
    d += seg([10, 12 + i * 12.6], [90, 12 + i * 12.6]);
    route.push(i % 2 === 0 ? [10, 12 + i * 12.6] : [90, 12 + i * 12.6], i % 2 === 0 ? [90, 12 + i * 12.6] : [10, 12 + i * 12.6]);
  }
  for (let i = 0; i <= 5; i += 1) d += seg([10 + i * 16, 12], [10 + i * 16, 88]);
  return { d: d + box(10, 37.2, 80, 12.6), walk: poly(route) };
}

/** meaning as direction: two pairs of points, and the same arrow between each */
function meaning(): Glyph {
  return {
    d: axes() + circle(28, 64, 2, 10) + circle(52, 40, 2, 10) + circle(58, 72, 2, 10) + circle(82, 48, 2, 10) + arrow([28, 64], [50, 42], 3) + arrow([58, 72], [80, 50], 3) + seg([28, 64], [58, 72]) + seg([52, 40], [82, 48]),
    walk: loop([[28, 64], [52, 40], [82, 48], [58, 72]]),
  };
}

/** the space of meanings: three axes and groups of points in it */
function space(): Glyph {
  let d = arrow([30, 70], [30, 10], 3) + arrow([30, 70], [92, 70], 3) + arrow([30, 70], [8, 90], 3);
  const points: Pt[] = [[52, 36], [56, 30], [60, 38], [74, 52], [78, 46], [70, 48], [44, 56], [48, 60]];
  for (const [x, y] of points) d += circle(x, y, 1.8, 10);
  return { d, walk: poly([[8, 90], [30, 70], [30, 10], [30, 70], [92, 70]]) };
}

/** where a word stands, written as waves of different lengths */
function order(): string {
  return plot((x) => Math.sin(x), 0, TAU * 2, -1.2, 1.2, [8, 10, 84, 22]) + plot((x) => Math.sin(2 * x), 0, TAU * 2, -1.2, 1.2, [8, 38, 84, 22]) + plot((x) => Math.sin(4 * x), 0, TAU * 2, -1.2, 1.2, [8, 66, 84, 22], 160);
}

/** each token looking back at the ones before it */
function attention(): Glyph {
  return tokens(6, [[0, 5], [2, 5], [3, 5], [1, 4], [0, 3]]);
}

/** the tokens so far, and the chances of each candidate for the next */
function predict(): Glyph {
  let d = "";
  for (let i = 0; i < 4; i += 1) d += box(8 + i * 13, 20, 11, 10);
  d += arrow([60, 25], [72, 25], 3) + box(74, 20, 14, 10);
  const tops: Pt[] = [];
  [44, 28, 16, 9, 5].forEach((h, i) => {
    d += box(14 + i * 15, 88 - h, 10, h);
    tops.push([14 + i * 15, 88 - h], [24 + i * 15, 88 - h]);
  });
  return { d, walk: poly([[8, 25], [72, 25], ...tops]) };
}

/** the loop: the next token chosen, added, and the whole read again */
function generateLoop(): string {
  let d = "";
  for (let i = 0; i < 5; i += 1) d += box(14 + i * 13, 58, 11, 10);
  return d + arc(50, 58, 30, 0.15, Math.PI - 0.15, 32) + arrow([22, 55], [20, 58], 4) + box(80, 58, 11, 10);
}

/** a spread of chances, sharper or flatter with the temperature */
function choosing(): string {
  return axes() + plot((x) => Math.exp(-((x - 0.3) ** 2) / 0.008), 0, 1, 0, 1.05, [14, 10, 76, 76]) + plot((x) => 0.45 * Math.exp(-((x - 0.3) ** 2) / 0.06), 0, 1, 0, 1.05, [14, 10, 76, 76]);
}

/** many vectors, one a token, averaged into one */
function pool(): Glyph {
  let d = "";
  const route: Pt[] = [];
  for (let i = 0; i < 5; i += 1) {
    d += box(10 + i * 9, 14, 6, 34) + arrow([13 + i * 9, 50], [50, 70], 3);
    route.push([13 + i * 9, 50], [50, 70]);
  }
  return { d: d + box(46, 72, 8, 20), walk: poly([...route, [50, 92]]) };
}

/** what the method explains: a glass held over a row of tokens */
function explains(): Glyph {
  const row = tokens(6, [], 64);
  return { d: row.d + circle(44, 40, 16, 40) + seg([55, 51], [70, 66]), walk: circle(44, 40, 16, 40) };
}

/** a number line with the primes marked, and the gap between each pair */
function gaps(): Glyph {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  const X = (p: number) => 8 + ((p - 1) / 23) * 84;
  let d = seg([6, 66], [94, 66]);
  for (const p of primes) d += seg([X(p), 60], [X(p), 72]);
  const route: Pt[] = [];
  for (let i = 0; i + 1 < primes.length; i += 1) {
    const c = (X(primes[i]) + X(primes[i + 1])) / 2;
    const r = (X(primes[i + 1]) - X(primes[i])) / 2;
    d += arc(c, 60, r, 0, Math.PI, 16);
    for (let k = 0; k <= 16; k += 1) route.push([c - r * Math.cos((Math.PI * k) / 16), 60 - r * Math.sin((Math.PI * k) / 16)]);
  }
  return { d, walk: poly(route) };
}

/** the subpaths of path data as lists of points; the paths here use only M and L */
function pieces(d: string): Pt[][] {
  return d
    .split("M")
    .filter(Boolean)
    .map((part) => part.replace(/Z/g, "").split("L").map((xy) => xy.trim().split(/\s+/).map(Number) as Pt));
}

const length = (pts: Pt[]) => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/** the longest run of pieces that meet end to end, as one unbroken line */
function longestRun(d: string): string {
  const runs: Pt[][] = [];
  for (const piece of pieces(d)) {
    const last = runs[runs.length - 1];
    const end = last?.[last.length - 1];
    if (end && Math.hypot(end[0] - piece[0][0], end[1] - piece[0][1]) < 0.15) last.push(...piece.slice(1));
    else runs.push([...piece]);
  }
  return poly(runs.reduce((best, r) => (length(r) > length(best) ? r : best), runs[0] ?? []));
}

const DRAW: Record<string, () => Glyph> = {
  "/topics/complex/play/line": numberLine,
  "/topics/complex/play/turn": quarterTurn,
  "/topics/complex/play/add": adding,
  "/topics/complex/play/multiply": multiplying,
  "/topics/complex/play/square": () => julia(-1, 0),
  "/topics/complex/play/round": euler,
  "/topics/complex/play/quaternions": quaternion,
  "/topics/fractals/play/ifs": fern,
  "/topics/fractals/play/lsystem": koch,
  "/topics/fractals/play/lichtenberg": () => branches(false),
  "/topics/fractals/play/dla": () => branches(true),
  "/topics/fractals/play/julia": () => julia(-0.123, 0.745),
  "/topics/fractals/play/mandelbrot": mandelbrot,
  "/topics/fractals/play/mandelbulb": bulb,
  "/topics/chaos/play/field": field,
  "/topics/chaos/play/solvers": stepping,
  "/topics/chaos/play/phase": phase,
  "/topics/chaos/play/lorenz": lorenz,
  "/topics/chaos/play/rossler": rossler,
  "/topics/chaos/play/logistic": cobweb,
  "/topics/chaos/play/bifurcation": bifurcation,
  "/topics/networks/play/rate": () => tangent((x) => x * x, (x) => 2 * x, 0.6, 0, 1, 0, 1),
  "/topics/networks/play/rate2": () => tangent((x) => x * x * x, (x) => 3 * x * x, 0.75, 0, 1, 0, 1),
  "/topics/networks/play/accumulate": bars,
  "/topics/networks/play/growth": growth,
  "/topics/networks/play/slope": hill,
  "/topics/networks/play/line": fitLine,
  "/topics/networks/play/nudge": nudge,
  "/topics/networks/play/unit": unit,
  "/topics/networks/play/layers": () => network([3, 4, 4, 2]),
  "/topics/networks/play/any": anyCurve,
  "/topics/networks/play/learn": () => lossCurve(false),
  "/topics/networks/play/blame": blame,
  "/topics/networks/play/slow": () => lossCurve(true),
  "/topics/networks/play/fade": fadeBars,
  "/topics/networks/play/pictures": pictures,
  "/topics/networks/play/sequence": sequence,
  "/topics/networks/play/words": words,
  "/topics/tokens/play/bytes": threeWays,
  "/topics/tokens/play/merge": mergeTokens,
  "/topics/tokens/play/segment": cutting,
  "/topics/tokens/play/cost": costBars,
  "/topics/tokens/play/table": table,
  "/topics/tokens/play/meaning": meaning,
  "/topics/tokens/play/space": space,
  "/topics/tokens/play/order": order,
  "/topics/tokens/play/attend": attention,
  "/topics/tokens/play/predict": predict,
  "/topics/tokens/play/generate": generateLoop,
  "/topics/tokens/play/sample": choosing,
  "/topics/tokens/play/pool": pool,
  "/topics/tokens/play/artefacts": explains,
  "/topics/primes/play/gaps": gaps,
};

const made = new Map<string, { d: string; walk: string }>();

/** the drawing of the page at this address and the line its light walks, or nothing when it has none */
export function glyphOf(to: string): { d: string; walk: string } | null {
  const draw = DRAW[to];
  if (!draw) return null;
  if (!made.has(to)) {
    const g = draw();
    made.set(to, typeof g === "string" ? { d: g, walk: longestRun(g) } : g);
  }
  return made.get(to) ?? null;
}
