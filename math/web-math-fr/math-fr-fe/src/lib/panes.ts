import type { Box, Pen } from "@/components/Plot";
import { FAINT, GROUND, MUTED, niceStep } from "@/lib/draw";
import { forLight, lightPage } from "@/lib/tone";

/**
 * several small plots inside one canvas, each with its own coordinates and numbered axes. a page
 * that shows two views of one run keeps them in one picture, so on a phone the one picture is
 * held while the controls scroll. the canvas is drawn with the unit box (0 to 1 both ways); a pane
 * maps its own coordinates into a rectangle of it, side by side on a wide canvas, stacked on a tall one.
 */
export const UNIT: Box = { x0: 0, x1: 1, y0: 0, y1: 1 };

export type Pane = {
  box: Box;
  /** the pane's coordinates to the canvas's unit box */
  at: (x: number, y: number) => [number, number];
  /** the rectangle the pane fills, in the unit box */
  rect: { x0: number; x1: number; y0: number; y1: number };
};

/** room for the numbers on the left and below, in pixels */
const LEFT = 36;
const BELOW = 18;
const EDGE = 16;

/** n rectangles of the canvas: side by side when the canvas is wide, one above the other when it is tall; `weights` sets their shares */
export function split(pen: Pen, weights: number[]): Pane["rect"][] {
  const total = weights.reduce((s, w) => s + w, 0);
  const wide = pen.width >= pen.height * 1.5;
  const out: Pane["rect"][] = [];
  let from = 0;
  for (const w of weights) {
    const to = from + w / total;
    out.push(wide ? { x0: from, x1: to, y0: 0, y1: 1 } : { x0: 0, x1: 1, y0: 1 - to, y1: 1 - from });
    from = to;
  }
  return out;
}

/** a pane over a rectangle of the canvas, its own box inside the room left for the numbers */
export function pane(pen: Pen, rect: Pane["rect"], box: Box): Pane {
  const fx = (px: number) => px / Math.max(1, pen.width);
  const fy = (py: number) => py / Math.max(1, pen.height);
  const x0 = rect.x0 + fx(LEFT);
  const x1 = rect.x1 - fx(EDGE);
  const y0 = rect.y0 + fy(BELOW);
  const y1 = rect.y1 - fy(EDGE);
  return {
    box,
    rect: { x0, x1, y0, y1 },
    at: (x, y) => [x0 + ((x - box.x0) / (box.x1 - box.x0)) * (x1 - x0), y0 + ((y - box.y0) / (box.y1 - box.y0)) * (y1 - y0)],
  };
}

/** a colour as the plot draws it on the current page */
export function toned(colour: string): string {
  return lightPage() ? forLight(colour, GROUND) : colour;
}

/** a line in pane coordinates */
export function line(pen: Pen, p: Pane, pts: [number, number][], colour: string, weight = 1) {
  pen.line(pts.map(([x, y]) => p.at(x, y)), colour, weight);
}

export function dot(pen: Pen, p: Pane, x: number, y: number, r: number, colour: string) {
  const [a, b] = p.at(x, y);
  pen.dot(a, b, r, colour);
}

/** a filled box from (x0, y0) to (x1, y1) in pane coordinates */
export function block(pen: Pen, p: Pane, x0: number, y0: number, x1: number, y1: number, colour: string) {
  const [a, b] = p.at(x0, y0);
  const [c, d] = p.at(x1, y1);
  const l = pen.px(Math.min(a, c));
  const t = pen.py(Math.max(b, d));
  pen.ctx.fillStyle = toned(colour);
  pen.ctx.fillRect(l, t, Math.max(0.6, Math.abs(pen.px(c) - pen.px(a))), Math.max(0, Math.abs(pen.py(d) - pen.py(b))));
}

export function label(pen: Pen, p: Pane, s: string, x: number, y: number, colour = MUTED, align: CanvasTextAlign = "left") {
  const [a, b] = p.at(x, y);
  pen.text(s, a, b, colour, align);
}

/** the pane's grid and its numbers on the left and below */
export function frame(pen: Pen, p: Pane, opts: { x?: number; y?: number; xFormat?: (v: number) => string; yFormat?: (v: number) => string } = {}) {
  const b = p.box;
  const xs = opts.x ?? niceStep(b.x1 - b.x0);
  const ys = opts.y ?? niceStep(b.y1 - b.y0);
  const plain = (v: number) => (Number.isInteger(v) ? String(v) : Math.abs(v) < 1 ? v.toFixed(2) : v.toFixed(1));
  const fx = opts.xFormat ?? plain;
  const fy = opts.yFormat ?? plain;
  const ctx = pen.ctx;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = toned(MUTED);
  for (let x = Math.ceil(b.x0 / xs - 1e-9) * xs; x <= b.x1 + 1e-9; x += xs) {
    const v = Math.abs(x) < 1e-12 ? 0 : x;
    line(pen, p, [[v, b.y0], [v, b.y1]], FAINT, 1);
    const [a, c] = p.at(v, b.y0);
    ctx.textAlign = "center";
    ctx.fillText(fx(v), pen.px(a), pen.py(c) + 12);
  }
  for (let y = Math.ceil(b.y0 / ys - 1e-9) * ys; y <= b.y1 + 1e-9; y += ys) {
    const v = Math.abs(y) < 1e-12 ? 0 : y;
    line(pen, p, [[b.x0, v], [b.x1, v]], FAINT, 1);
    const [a, c] = p.at(b.x0, v);
    ctx.textAlign = "right";
    ctx.fillText(fy(v), pen.px(a) - 4, pen.py(c) + 3);
  }
  ctx.textAlign = "left";
}
