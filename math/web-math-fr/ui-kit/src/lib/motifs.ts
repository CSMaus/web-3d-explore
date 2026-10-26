/**
 * the drawing helpers for small line figures: each returns path data in a 100 by
 * 100 box, so a figure is built by joining a few of them. a site uses them to draw
 * one exact figure for each thing it shows (a graph, a vector, a network, a
 * curve), which the element `LineFigure` in components/figures.tsx draws with the
 * same travelling light as the other figures. nothing here is random.
 */

export type Pt = [number, number];

const f = (n: number) => n.toFixed(1);

/** an open polyline through the points */
export function poly(points: Pt[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join("");
}

/** a closed polyline through the points */
export function loop(points: Pt[]): string {
  return `${poly(points)}Z`;
}

/** a straight segment */
export function seg(a: Pt, b: Pt): string {
  return poly([a, b]);
}

/** a circle as a polygon of many sides */
export function circle(cx: number, cy: number, r: number, sides = 48): string {
  return loop(Array.from({ length: sides }, (_, i) => [cx + r * Math.cos((i / sides) * Math.PI * 2), cy + r * Math.sin((i / sides) * Math.PI * 2)] as Pt));
}

/** an arc of a circle from one angle to another, in radians, y down */
export function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 32): string {
  return poly(Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as Pt;
  }));
}

/** an arrow from a to b with a small head at b */
export function arrow(a: Pt, b: Pt, head = 5): string {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const l: Pt = [b[0] - head * Math.cos(ang - 0.45), b[1] - head * Math.sin(ang - 0.45)];
  const r: Pt = [b[0] - head * Math.cos(ang + 0.45), b[1] - head * Math.sin(ang + 0.45)];
  return `${seg(a, b)}${poly([l, b, r])}`;
}

/** a function drawn over [x0, x1] into the box [left, top, width, height], with y from y0 (bottom) to y1 (top) */
export function plot(fn: (x: number) => number, x0: number, x1: number, y0: number, y1: number, box: [number, number, number, number] = [10, 10, 80, 80], steps = 96): string {
  const [left, top, w, h] = box;
  return poly(Array.from({ length: steps + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = Math.min(y1, Math.max(y0, fn(x)));
    return [left + ((x - x0) / (x1 - x0)) * w, top + h - ((y - y0) / (y1 - y0)) * h] as Pt;
  }));
}

/** a pair of axes through the point (x, y) of the box, x to the right and y up */
export function axes(x = 14, y = 86, right = 92, up = 8): string {
  return `${arrow([x, y], [right, y], 3)}${arrow([x, y], [x, up], 3)}`;
}

/** points fitted into the box with a margin, keeping their proportions; y is taken as up */
export function fit(points: Pt[], margin = 8): Pt[] {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) || 1;
  const scale = (100 - 2 * margin) / span;
  const dx = 50 - ((Math.max(...xs) + x0) / 2) * scale;
  const dy = 50 + ((Math.max(...ys) + y0) / 2) * scale;
  return points.map((p) => [p[0] * scale + dx, dy - p[1] * scale]);
}

/** a small square, for a cell, a token or a pixel */
export function box(x: number, y: number, w: number, h = w): string {
  return loop([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
}
